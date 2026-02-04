/**
 * Result of JSON validation
 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
	line?: number;
	column?: number;
}

/**
 * Validates a JSON string and returns detailed error information if invalid.
 * @param input - The JSON string to validate
 * @returns ValidationResult with validity status and error details
 */
export function validateJSON(input: string): ValidationResult {
	if (!input || input.trim().length === 0) {
		return { valid: false, error: 'Input is empty' };
	}

	try {
		JSON.parse(input);
		return { valid: true };
	} catch (error) {
		if (error instanceof SyntaxError) {
			// Try to extract position information from the error message
			const positionMatch = error.message.match(/position\s+(\d+)/i);
			const position = positionMatch ? parseInt(positionMatch[1], 10) : 0;

			// Calculate line and column from position
			const lines = input.substring(0, position).split('\n');
			const line = lines.length;
			const column = lines[lines.length - 1].length + 1;

			return {
				valid: false,
				error: error.message,
				line,
				column
			};
		}
		return { valid: false, error: 'Unknown error occurred while parsing JSON' };
	}
}

/**
 * Formats/prettifies a JSON string with specified indentation.
 * @param input - The JSON string to format
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns The formatted JSON string
 * @throws Error if the input is not valid JSON
 */
export function formatJSON(input: string, indent: number = 2): string {
	const validation = validateJSON(input);
	if (!validation.valid) {
		throw new Error(validation.error);
	}
	const parsed = JSON.parse(input);
	return JSON.stringify(parsed, null, indent);
}

/**
 * Minifies a JSON string by removing all unnecessary whitespace.
 * @param input - The JSON string to minify
 * @returns The minified JSON string
 * @throws Error if the input is not valid JSON
 */
export function minifyJSON(input: string): string {
	const validation = validateJSON(input);
	if (!validation.valid) {
		throw new Error(validation.error);
	}
	const parsed = JSON.parse(input);
	return JSON.stringify(parsed);
}
