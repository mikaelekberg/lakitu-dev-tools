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

/**
 * Result of a JSON query operation
 */
export interface QueryResult {
	success: boolean;
	data?: unknown;
	error?: string;
}

/**
 * Token types for query path parsing
 */
type PathToken = { type: 'property'; key: string } | { type: 'index'; index: number } | { type: 'wildcard' };

/**
 * Tokenizes a jq-like query path into segments.
 * Supports: .key, .key.nested, [0], [*], .key[0].nested[*]
 * @param path - The query path string
 * @returns Array of path tokens
 */
function tokenizePath(path: string): PathToken[] {
	const tokens: PathToken[] = [];
	let i = 0;
	const trimmedPath = path.trim();

	// Handle empty path or just "."
	if (trimmedPath === '' || trimmedPath === '.') {
		return tokens;
	}

	// Skip leading dot if present
	if (trimmedPath[i] === '.') {
		i++;
	}

	while (i < trimmedPath.length) {
		const char = trimmedPath[i];

		if (char === '.') {
			// Skip dot separator
			i++;
		} else if (char === '[') {
			// Array index or wildcard
			i++; // skip '['
			let content = '';
			while (i < trimmedPath.length && trimmedPath[i] !== ']') {
				content += trimmedPath[i];
				i++;
			}
			if (trimmedPath[i] !== ']') {
				throw new Error(`Unclosed bracket in path at position ${i}`);
			}
			i++; // skip ']'

			if (content === '*') {
				tokens.push({ type: 'wildcard' });
			} else {
				const index = parseInt(content, 10);
				if (isNaN(index)) {
					throw new Error(`Invalid array index: ${content}`);
				}
				tokens.push({ type: 'index', index });
			}
		} else {
			// Property name
			let key = '';
			while (i < trimmedPath.length && trimmedPath[i] !== '.' && trimmedPath[i] !== '[') {
				key += trimmedPath[i];
				i++;
			}
			if (key) {
				tokens.push({ type: 'property', key });
			}
		}
	}

	return tokens;
}

/**
 * Applies a single token to traverse the data
 */
function applyToken(data: unknown, token: PathToken): unknown {
	if (token.type === 'property') {
		if (data === null || data === undefined) {
			throw new Error(`Cannot access property '${token.key}' of ${data}`);
		}
		if (typeof data !== 'object' || Array.isArray(data)) {
			throw new Error(`Cannot access property '${token.key}' on non-object`);
		}
		const obj = data as Record<string, unknown>;
		if (!(token.key in obj)) {
			throw new Error(`Property '${token.key}' not found`);
		}
		return obj[token.key];
	} else if (token.type === 'index') {
		if (!Array.isArray(data)) {
			throw new Error(`Cannot use array index on non-array`);
		}
		if (token.index < 0 || token.index >= data.length) {
			throw new Error(`Array index ${token.index} out of bounds (length: ${data.length})`);
		}
		return data[token.index];
	} else if (token.type === 'wildcard') {
		if (!Array.isArray(data)) {
			throw new Error(`Cannot use wildcard [*] on non-array`);
		}
		return data; // Return the array itself, we'll map over it with remaining tokens
	}
	return data;
}

/**
 * Recursively applies tokens to data, handling wildcards
 */
function applyTokens(data: unknown, tokens: PathToken[]): unknown {
	if (tokens.length === 0) {
		return data;
	}

	const [currentToken, ...remainingTokens] = tokens;

	if (currentToken.type === 'wildcard') {
		if (!Array.isArray(data)) {
			throw new Error(`Cannot use wildcard [*] on non-array`);
		}
		// Map remaining tokens over each element
		return data.map((item, index) => {
			try {
				return applyTokens(item, remainingTokens);
			} catch (error) {
				if (error instanceof Error) {
					throw new Error(`At index [${index}]: ${error.message}`);
				}
				throw error;
			}
		});
	}

	const result = applyToken(data, currentToken);
	return applyTokens(result, remainingTokens);
}

/**
 * Queries JSON data using a jq-like path syntax.
 * 
 * Supported syntax:
 * - `.` or empty: returns entire object
 * - `.key`: property access
 * - `.key.nested`: nested property access
 * - `[0]`: array index access
 * - `[*]`: wildcard - returns array of results for each element
 * - `.users[0].name`: combined access
 * - `.items[*].id`: get specific property from all array elements
 * 
 * @param data - The parsed JSON data to query
 * @param path - The query path string
 * @returns QueryResult with success status and data or error
 */
export function queryJSON(data: unknown, path: string): QueryResult {
	try {
		const tokens = tokenizePath(path);
		const result = applyTokens(data, tokens);
		return { success: true, data: result };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown query error'
		};
	}
}
