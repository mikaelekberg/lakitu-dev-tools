/**
 * Encodes a string to Base64, properly handling Unicode characters.
 * @param input - The string to encode
 * @returns The Base64 encoded string
 */
export function encodeBase64(input: string): string {
	// Handle Unicode properly by encoding to UTF-8 first
	const utf8Bytes = new TextEncoder().encode(input);
	const binaryString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join('');
	return btoa(binaryString);
}

/**
 * Decodes a Base64 string back to the original text.
 * @param input - The Base64 encoded string
 * @returns The decoded string
 * @throws Error if the input is not valid Base64
 */
export function decodeBase64(input: string): string {
	try {
		// Remove any whitespace that might have been added
		const cleanInput = input.replace(/\s/g, '');
		const binaryString = atob(cleanInput);
		const utf8Bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			utf8Bytes[i] = binaryString.charCodeAt(i);
		}
		return new TextDecoder().decode(utf8Bytes);
	} catch {
		throw new Error('Invalid Base64 string. Please check your input and try again.');
	}
}

/**
 * Validates if a string is valid Base64.
 * @param input - The string to validate
 * @returns True if valid Base64, false otherwise
 */
export function isValidBase64(input: string): boolean {
	if (!input || input.length === 0) return false;
	const cleanInput = input.replace(/\s/g, '');
	// Base64 regex pattern
	const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
	return base64Regex.test(cleanInput) && cleanInput.length % 4 === 0;
}
