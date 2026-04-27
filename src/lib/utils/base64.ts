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

export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ImageEncodeResult {
	base64: string;
	mimeType: string;
	originalSize: number;
	encodedSize: number;
	dataUri: string;
}

export function encodeImageToBase64(file: File): Promise<ImageEncodeResult> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const dataUri = reader.result as string;
			const base64 = dataUri.split(',')[1];
			resolve({
				base64,
				mimeType: file.type,
				originalSize: file.size,
				encodedSize: base64.length,
				dataUri,
			});
		};
		reader.onerror = () => reject(new Error('Failed to read file.'));
		reader.readAsDataURL(file);
	});
}

export function decodeBase64ToImage(input: string): { dataUri: string; mimeType: string } {
	const trimmed = input.trim().replace(/\s/g, '');

	// Already a data URI
	if (trimmed.startsWith('data:')) {
		const match = trimmed.match(/^data:(image\/[^;]+);base64,/);
		if (!match) throw new Error('Invalid data URI format.');
		return { dataUri: trimmed, mimeType: match[1] };
	}

	// Raw base64 — sniff mime type from magic bytes
	try {
		atob(trimmed); // validate
	} catch {
		throw new Error('Invalid Base64 string.');
	}

	const mimeType = sniffMimeType(trimmed);
	return { dataUri: `data:${mimeType};base64,${trimmed}`, mimeType };
}

function sniffMimeType(base64: string): string {
	// Decode first few bytes to check magic numbers
	const binary = atob(base64.slice(0, 16));
	const bytes = Array.from(binary).map((c) => c.charCodeAt(0));

	if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
	if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
	if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
	if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57) return 'image/webp';

	// Check for SVG (XML text)
	const text = atob(base64.slice(0, 64));
	if (text.includes('<svg') || text.includes('<?xml')) return 'image/svg+xml';

	return 'image/png'; // fallback
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
