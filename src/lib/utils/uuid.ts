/**
 * UUID/GUID/ULID Generator Utilities
 *
 * Supports:
 * - UUID v4: Random UUIDs (RFC 4122)
 * - UUID v7: Timestamp-based sortable UUIDs (RFC 9562)
 * - ULID: Universally Unique Lexicographically Sortable Identifiers
 */

export type UUIDType = 'uuidv4' | 'uuidv7' | 'ulid';
export type DetectedIDType = 'uuidv4' | 'uuidv7' | 'ulid' | 'invalid';

export interface TimestampExtractionResult {
	valid: boolean;
	type?: 'uuidv7' | 'ulid';
	timestampMs?: number;
	timestampSec?: number;
	date?: Date;
	iso8601?: string;
	localString?: string;
	relativeTime?: string;
	error?: string;
}

export interface FormatOptions {
	uppercase: boolean;
	hyphens: boolean;
}

/**
 * Generates a UUID v4 (random UUID).
 * Uses the native crypto.randomUUID() API.
 * @returns A UUID v4 string in lowercase with hyphens
 */
export function generateUUIDv4(): string {
	return crypto.randomUUID();
}

/**
 * Generates a UUID v7 (timestamp-based sortable UUID).
 * Follows RFC 9562 specification.
 *
 * Structure:
 * - 48 bits: Unix timestamp in milliseconds
 * - 4 bits: Version (7)
 * - 12 bits: Random
 * - 2 bits: Variant (10)
 * - 62 bits: Random
 *
 * @returns A UUID v7 string in lowercase with hyphens
 */
export function generateUUIDv7(): string {
	const timestamp = Date.now();

	// Get 16 random bytes
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);

	// Set timestamp (48 bits = 6 bytes)
	// Bytes 0-5 contain the timestamp in big-endian order
	bytes[0] = (timestamp / 2 ** 40) & 0xff;
	bytes[1] = (timestamp / 2 ** 32) & 0xff;
	bytes[2] = (timestamp / 2 ** 24) & 0xff;
	bytes[3] = (timestamp / 2 ** 16) & 0xff;
	bytes[4] = (timestamp / 2 ** 8) & 0xff;
	bytes[5] = timestamp & 0xff;

	// Set version (4 bits) - version 7
	// Byte 6: high nibble = version, low nibble = random
	bytes[6] = (bytes[6] & 0x0f) | 0x70;

	// Set variant (2 bits) - RFC 4122 variant (10xx)
	// Byte 8: high 2 bits = variant, low 6 bits = random
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	// Convert to hex string with hyphens
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// Crockford's Base32 alphabet (excludes I, L, O, U to avoid confusion)
const ULID_ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates a ULID (Universally Unique Lexicographically Sortable Identifier).
 *
 * Structure:
 * - 10 characters: Timestamp (48 bits, milliseconds since Unix epoch)
 * - 16 characters: Random (80 bits)
 * - Total: 26 characters using Crockford's Base32
 *
 * @returns A ULID string (26 characters, uppercase)
 */
export function generateULID(): string {
	const timestamp = Date.now();

	// Encode timestamp (48 bits) into 10 Base32 characters
	let timestampPart = '';
	let ts = timestamp;
	for (let i = 9; i >= 0; i--) {
		timestampPart = ULID_ENCODING[ts & 0x1f] + timestampPart;
		ts = Math.floor(ts / 32);
	}

	// Generate random part (80 bits = 16 Base32 characters)
	const randomBytes = new Uint8Array(10);
	crypto.getRandomValues(randomBytes);

	let randomPart = '';
	// Process 80 bits as 16 groups of 5 bits each
	// We'll use a simpler approach: convert each byte pair to base32
	for (let i = 0; i < 10; i++) {
		// For each byte, we need to extract 5-bit chunks
		// This is a simplified approach that still gives good randomness
		const byte = randomBytes[i];
		randomPart += ULID_ENCODING[(byte >> 3) & 0x1f];
		if (randomPart.length < 16) {
			randomPart += ULID_ENCODING[((byte & 0x07) << 2) | ((randomBytes[(i + 1) % 10] >> 6) & 0x03)];
		}
	}

	// Ensure exactly 16 random characters
	randomPart = randomPart.slice(0, 16);

	return timestampPart + randomPart;
}

/**
 * Formats a UUID or ULID according to the specified options.
 * @param id - The UUID or ULID to format
 * @param options - Format options (uppercase, hyphens)
 * @returns The formatted string
 */
export function formatID(id: string, options: FormatOptions): string {
	let result = id;

	// Handle hyphens
	if (!options.hyphens) {
		result = result.replace(/-/g, '');
	} else if (!result.includes('-') && result.length === 32) {
		// Add hyphens to a UUID without them
		result = `${result.slice(0, 8)}-${result.slice(8, 12)}-${result.slice(12, 16)}-${result.slice(16, 20)}-${result.slice(20, 32)}`;
	}

	// Handle case
	if (options.uppercase) {
		result = result.toUpperCase();
	} else {
		result = result.toLowerCase();
	}

	return result;
}

/**
 * Generates multiple IDs of the specified type.
 * @param type - The type of ID to generate
 * @param count - Number of IDs to generate (1-100)
 * @param options - Format options
 * @returns Array of generated IDs
 */
export function generateMultiple(type: UUIDType, count: number, options: FormatOptions): string[] {
	const safeCount = Math.max(1, Math.min(100, count));
	const results: string[] = [];

	for (let i = 0; i < safeCount; i++) {
		let id: string;
		switch (type) {
			case 'uuidv4':
				id = generateUUIDv4();
				break;
			case 'uuidv7':
				id = generateUUIDv7();
				break;
			case 'ulid':
				id = generateULID();
				break;
		}

		// Format the ID (ULIDs don't have hyphens, so hyphens option only affects UUIDs)
		if (type === 'ulid') {
			results.push(options.uppercase ? id.toUpperCase() : id.toLowerCase());
		} else {
			results.push(formatID(id, options));
		}
	}

	return results;
}

/**
 * Detects the type of ID from the input string.
 * @param input - The ID string to analyze
 * @returns The detected type: 'uuidv4', 'uuidv7', 'ulid', or 'invalid'
 */
export function detectIDType(input: string): DetectedIDType {
	const trimmed = input.trim();

	// Check for ULID format: exactly 26 characters, Crockford's Base32 only
	if (trimmed.length === 26) {
		const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
		if (ulidRegex.test(trimmed)) {
			return 'ulid';
		}
	}

	// Check for UUID format (with or without hyphens)
	const uuidWithHyphens = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const uuidWithoutHyphens = /^[0-9a-f]{32}$/i;

	let normalizedUUID: string;

	if (uuidWithHyphens.test(trimmed)) {
		normalizedUUID = trimmed;
	} else if (uuidWithoutHyphens.test(trimmed)) {
		// Add hyphens for easier parsing
		normalizedUUID = `${trimmed.slice(0, 8)}-${trimmed.slice(8, 12)}-${trimmed.slice(12, 16)}-${trimmed.slice(16, 20)}-${trimmed.slice(20, 32)}`;
	} else {
		return 'invalid';
	}

	// Check version nibble (position 14, after the second hyphen)
	const versionChar = normalizedUUID.charAt(14).toLowerCase();

	if (versionChar === '7') {
		return 'uuidv7';
	} else if (versionChar === '4') {
		return 'uuidv4';
	}

	// Other UUID versions are treated as invalid for timestamp extraction
	return 'invalid';
}

/**
 * Extracts the timestamp from a UUID v7.
 * UUID v7 stores the Unix timestamp in milliseconds in the first 48 bits.
 * @param uuid - The UUID v7 string (with or without hyphens)
 * @returns The timestamp in milliseconds
 */
export function extractUUIDv7Timestamp(uuid: string): number {
	// Remove hyphens and take first 12 hex characters (48 bits)
	const hex = uuid.replace(/-/g, '').slice(0, 12);
	return parseInt(hex, 16);
}

/**
 * Extracts the timestamp from a ULID.
 * ULID stores the Unix timestamp in milliseconds in the first 10 Base32 characters.
 * @param ulid - The ULID string (26 characters)
 * @returns The timestamp in milliseconds
 */
export function extractULIDTimestamp(ulid: string): number {
	const timestampChars = ulid.slice(0, 10).toUpperCase();
	let timestamp = 0;

	for (let i = 0; i < 10; i++) {
		const char = timestampChars[i];
		const value = ULID_ENCODING.indexOf(char);
		if (value === -1) {
			throw new Error(`Invalid ULID character: ${char}`);
		}
		timestamp = timestamp * 32 + value;
	}

	return timestamp;
}

/**
 * Formats a date as a relative time string (e.g., "3 days ago", "in 2 hours").
 * @param date - The date to format
 * @returns A human-readable relative time string
 */
export function formatRelativeTime(date: Date): string {
	const now = Date.now();
	const diffMs = now - date.getTime();
	const diffSec = Math.floor(Math.abs(diffMs) / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);
	const diffWeek = Math.floor(diffDay / 7);
	const diffMonth = Math.floor(diffDay / 30);
	const diffYear = Math.floor(diffDay / 365);

	const isFuture = diffMs < 0;
	const prefix = isFuture ? 'in ' : '';
	const suffix = isFuture ? '' : ' ago';

	if (diffSec < 5) {
		return 'just now';
	} else if (diffSec < 60) {
		return `${prefix}${diffSec} second${diffSec !== 1 ? 's' : ''}${suffix}`;
	} else if (diffMin < 60) {
		return `${prefix}${diffMin} minute${diffMin !== 1 ? 's' : ''}${suffix}`;
	} else if (diffHour < 24) {
		return `${prefix}${diffHour} hour${diffHour !== 1 ? 's' : ''}${suffix}`;
	} else if (diffDay < 7) {
		return `${prefix}${diffDay} day${diffDay !== 1 ? 's' : ''}${suffix}`;
	} else if (diffWeek < 5) {
		return `${prefix}${diffWeek} week${diffWeek !== 1 ? 's' : ''}${suffix}`;
	} else if (diffMonth < 12) {
		return `${prefix}${diffMonth} month${diffMonth !== 1 ? 's' : ''}${suffix}`;
	} else {
		return `${prefix}${diffYear} year${diffYear !== 1 ? 's' : ''}${suffix}`;
	}
}

/**
 * Extracts the embedded timestamp from a UUID v7 or ULID.
 * Auto-detects the input type and returns detailed timestamp information.
 * @param input - The UUID v7 or ULID string
 * @returns Extraction result with timestamp in various formats
 */
export function extractTimestamp(input: string): TimestampExtractionResult {
	const trimmed = input.trim();

	if (!trimmed) {
		return { valid: false, error: 'Please enter a UUID v7 or ULID.' };
	}

	const detectedType = detectIDType(trimmed);

	if (detectedType === 'invalid') {
		return {
			valid: false,
			error: 'Invalid input. Please enter a valid UUID v7 or ULID.'
		};
	}

	if (detectedType === 'uuidv4') {
		return {
			valid: false,
			error:
				'UUID v4 does not contain an embedded timestamp. Only UUID v7 and ULID support timestamp extraction.'
		};
	}

	try {
		let timestampMs: number;

		if (detectedType === 'uuidv7') {
			timestampMs = extractUUIDv7Timestamp(trimmed);
		} else {
			timestampMs = extractULIDTimestamp(trimmed);
		}

		const date = new Date(timestampMs);

		// Validate the timestamp is reasonable (between 1970 and year 10000)
		if (timestampMs < 0 || timestampMs > 253402300799999) {
			return {
				valid: false,
				error: 'Extracted timestamp is out of valid range.'
			};
		}

		return {
			valid: true,
			type: detectedType,
			timestampMs,
			timestampSec: Math.floor(timestampMs / 1000),
			date,
			iso8601: date.toISOString(),
			localString: date.toLocaleString(undefined, {
				weekday: 'short',
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				timeZoneName: 'short'
			}),
			relativeTime: formatRelativeTime(date)
		};
	} catch (e) {
		return {
			valid: false,
			error: e instanceof Error ? e.message : 'Failed to extract timestamp.'
		};
	}
}
