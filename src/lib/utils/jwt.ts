/**
 * JWT Header interface
 */
export interface JWTHeader {
	alg: string;
	typ?: string;
	[key: string]: unknown;
}

/**
 * JWT Payload interface with standard claims
 */
export interface JWTPayload {
	iss?: string; // Issuer
	sub?: string; // Subject
	aud?: string | string[]; // Audience
	exp?: number; // Expiration time (seconds since epoch)
	nbf?: number; // Not before (seconds since epoch)
	iat?: number; // Issued at (seconds since epoch)
	jti?: string; // JWT ID
	[key: string]: unknown;
}

/**
 * Decoded JWT structure
 */
export interface DecodedJWT {
	header: JWTHeader;
	payload: JWTPayload;
	signature: string;
}

/**
 * JWT validation result
 */
export interface JWTValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	isExpired?: boolean;
	expiresAt?: Date;
	issuedAt?: Date;
	notBefore?: Date;
}

/**
 * Encodes a string to Base64URL format (URL-safe Base64 without padding).
 * @param str - The string to encode
 * @returns The Base64URL encoded string
 */
export function base64UrlEncode(str: string): string {
	const utf8Bytes = new TextEncoder().encode(str);
	const binaryString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join('');
	const base64 = btoa(binaryString);
	// Convert to Base64URL: replace + with -, / with _, and remove padding
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes a Base64URL encoded string.
 * @param str - The Base64URL encoded string
 * @returns The decoded string
 * @throws Error if the input is not valid Base64URL
 */
export function base64UrlDecode(str: string): string {
	// Convert from Base64URL to Base64: replace - with +, _ with /
	let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	// Add padding if needed
	const padding = base64.length % 4;
	if (padding) {
		base64 += '='.repeat(4 - padding);
	}

	try {
		const binaryString = atob(base64);
		const utf8Bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			utf8Bytes[i] = binaryString.charCodeAt(i);
		}
		return new TextDecoder().decode(utf8Bytes);
	} catch {
		throw new Error('Invalid Base64URL encoding');
	}
}

/**
 * Decodes a JWT token into its components.
 * @param token - The JWT token string
 * @returns The decoded JWT with header, payload, and signature
 * @throws Error if the token is not a valid JWT structure
 */
export function decodeJWT(token: string): DecodedJWT {
	const trimmedToken = token.trim();

	if (!trimmedToken) {
		throw new Error('Token is empty');
	}

	const parts = trimmedToken.split('.');

	if (parts.length !== 3) {
		throw new Error(
			`Invalid JWT structure: expected 3 parts separated by dots, got ${parts.length}`
		);
	}

	const [headerB64, payloadB64, signatureB64] = parts;

	let header: JWTHeader;
	let payload: JWTPayload;

	try {
		const headerJson = base64UrlDecode(headerB64);
		header = JSON.parse(headerJson);
	} catch (e) {
		if (e instanceof SyntaxError) {
			throw new Error('Invalid JWT header: not valid JSON');
		}
		throw new Error('Invalid JWT header: could not decode');
	}

	try {
		const payloadJson = base64UrlDecode(payloadB64);
		payload = JSON.parse(payloadJson);
	} catch (e) {
		if (e instanceof SyntaxError) {
			throw new Error('Invalid JWT payload: not valid JSON');
		}
		throw new Error('Invalid JWT payload: could not decode');
	}

	if (typeof header !== 'object' || header === null) {
		throw new Error('Invalid JWT header: must be an object');
	}

	if (typeof payload !== 'object' || payload === null) {
		throw new Error('Invalid JWT payload: must be an object');
	}

	return {
		header,
		payload,
		signature: signatureB64
	};
}

/**
 * Validates JWT claims and returns detailed validation information.
 * @param payload - The JWT payload to validate
 * @returns Validation result with errors, warnings, and timing information
 */
export function validateJWTClaims(payload: JWTPayload): JWTValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const now = Math.floor(Date.now() / 1000);

	let isExpired: boolean | undefined;
	let expiresAt: Date | undefined;
	let issuedAt: Date | undefined;
	let notBefore: Date | undefined;

	// Check expiration (exp)
	if (payload.exp !== undefined) {
		if (typeof payload.exp !== 'number') {
			errors.push('Invalid "exp" claim: must be a number');
		} else {
			expiresAt = new Date(payload.exp * 1000);
			isExpired = payload.exp < now;
			if (isExpired) {
				errors.push(`Token expired at ${expiresAt.toLocaleString()}`);
			}
		}
	} else {
		warnings.push('No expiration claim (exp) - token never expires');
	}

	// Check not before (nbf)
	if (payload.nbf !== undefined) {
		if (typeof payload.nbf !== 'number') {
			errors.push('Invalid "nbf" claim: must be a number');
		} else {
			notBefore = new Date(payload.nbf * 1000);
			if (payload.nbf > now) {
				errors.push(`Token not valid until ${notBefore.toLocaleString()}`);
			}
		}
	}

	// Check issued at (iat)
	if (payload.iat !== undefined) {
		if (typeof payload.iat !== 'number') {
			errors.push('Invalid "iat" claim: must be a number');
		} else {
			issuedAt = new Date(payload.iat * 1000);
			if (payload.iat > now) {
				warnings.push('Token issued in the future - clock skew detected');
			}
		}
	}

	// Validate issuer format if present
	if (payload.iss !== undefined && typeof payload.iss !== 'string') {
		errors.push('Invalid "iss" claim: must be a string');
	}

	// Validate subject format if present
	if (payload.sub !== undefined && typeof payload.sub !== 'string') {
		errors.push('Invalid "sub" claim: must be a string');
	}

	// Validate audience format if present
	if (payload.aud !== undefined) {
		if (typeof payload.aud !== 'string' && !Array.isArray(payload.aud)) {
			errors.push('Invalid "aud" claim: must be a string or array of strings');
		}
	}

	// Validate JWT ID format if present
	if (payload.jti !== undefined && typeof payload.jti !== 'string') {
		errors.push('Invalid "jti" claim: must be a string');
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		isExpired,
		expiresAt,
		issuedAt,
		notBefore
	};
}

/**
 * Creates an HMAC-SHA256 signature for JWT.
 * @param data - The data to sign (header.payload)
 * @param secret - The secret key
 * @returns Promise resolving to the Base64URL encoded signature
 */
async function createHS256Signature(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const dataBytes = encoder.encode(data);

	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);

	// Convert ArrayBuffer to Base64URL
	const signatureArray = new Uint8Array(signature);
	const binaryString = Array.from(signatureArray, (byte) => String.fromCharCode(byte)).join('');
	const base64 = btoa(binaryString);

	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Verifies the signature of a JWT token using HS256.
 * @param token - The JWT token to verify
 * @param secret - The secret key used to sign the token
 * @returns Promise resolving to true if signature is valid, false otherwise
 */
export async function verifyJWTSignature(token: string, secret: string): Promise<boolean> {
	const parts = token.trim().split('.');

	if (parts.length !== 3) {
		return false;
	}

	const [headerB64, payloadB64, signatureB64] = parts;
	const data = `${headerB64}.${payloadB64}`;

	try {
		const expectedSignature = await createHS256Signature(data, secret);
		return signatureB64 === expectedSignature;
	} catch {
		return false;
	}
}

/**
 * Encodes a JWT token with HS256 signature.
 * @param header - The JWT header (must include alg: "HS256")
 * @param payload - The JWT payload
 * @param secret - The secret key for signing
 * @returns Promise resolving to the encoded JWT token
 * @throws Error if header or payload is invalid
 */
export async function encodeJWT(
	header: JWTHeader,
	payload: JWTPayload,
	secret: string
): Promise<string> {
	if (!header || typeof header !== 'object') {
		throw new Error('Header must be an object');
	}

	if (!payload || typeof payload !== 'object') {
		throw new Error('Payload must be an object');
	}

	if (header.alg !== 'HS256') {
		throw new Error('Only HS256 algorithm is supported');
	}

	if (!secret) {
		throw new Error('Secret is required for signing');
	}

	const headerB64 = base64UrlEncode(JSON.stringify(header));
	const payloadB64 = base64UrlEncode(JSON.stringify(payload));
	const data = `${headerB64}.${payloadB64}`;

	const signature = await createHS256Signature(data, secret);

	return `${data}.${signature}`;
}

/**
 * Formats a Date object to a human-readable string.
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
	return date.toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
}

/**
 * Gets the time remaining until a date, or time since if in the past.
 * @param date - The target date
 * @returns Human-readable time difference string
 */
export function getTimeRemaining(date: Date): string {
	const now = new Date();
	const diff = date.getTime() - now.getTime();
	const absDiff = Math.abs(diff);

	const seconds = Math.floor(absDiff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	let timeStr: string;
	if (days > 0) {
		timeStr = `${days} day${days > 1 ? 's' : ''}`;
	} else if (hours > 0) {
		timeStr = `${hours} hour${hours > 1 ? 's' : ''}`;
	} else if (minutes > 0) {
		timeStr = `${minutes} minute${minutes > 1 ? 's' : ''}`;
	} else {
		timeStr = `${seconds} second${seconds !== 1 ? 's' : ''}`;
	}

	return diff > 0 ? `in ${timeStr}` : `${timeStr} ago`;
}
