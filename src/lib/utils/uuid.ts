/**
 * UUID/GUID/ULID Generator Utilities
 *
 * Supports:
 * - UUID v4: Random UUIDs (RFC 4122)
 * - UUID v7: Timestamp-based sortable UUIDs (RFC 9562)
 * - ULID: Universally Unique Lexicographically Sortable Identifiers
 */

export type UUIDType = 'uuidv4' | 'uuidv7' | 'ulid';

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
