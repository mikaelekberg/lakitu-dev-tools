import { parse, stringify } from 'yaml';

/**
 * Options for YAML stringification
 */
export interface YamlOptions {
	/** Number of spaces for indentation (default: 2) */
	indent?: number;
	/** Maximum line width before wrapping (default: 80, 0 = no limit) */
	lineWidth?: number;
	/** Sort object keys alphabetically (default: false) */
	sortKeys?: boolean;
}

/**
 * Result of a conversion or validation operation
 */
export interface ConversionResult {
	success: boolean;
	data?: string;
	error?: string;
	line?: number;
	column?: number;
}

/**
 * Convert a JSON string to YAML format
 * @param json - The JSON string to convert
 * @param options - YAML stringification options
 * @returns ConversionResult with YAML string or error details
 */
export function jsonToYaml(json: string, options?: YamlOptions): ConversionResult {
	const trimmed = json.trim();
	if (!trimmed) {
		return {
			success: false,
			error: 'Please enter JSON to convert'
		};
	}

	try {
		// First parse the JSON to validate it
		const parsed = JSON.parse(trimmed);

		// Convert to YAML
		const yaml = stringify(parsed, {
			indent: options?.indent ?? 2,
			lineWidth: options?.lineWidth ?? 80,
			sortMapEntries: options?.sortKeys ?? false
		});

		return {
			success: true,
			data: yaml
		};
	} catch (error) {
		if (error instanceof SyntaxError) {
			// Extract position info from JSON parse error
			const match = error.message.match(/position (\d+)/);
			const position = match ? parseInt(match[1]) : 0;
			const lines = trimmed.substring(0, position).split('\n');

			return {
				success: false,
				error: `Invalid JSON: ${error.message}`,
				line: lines.length,
				column: lines[lines.length - 1].length + 1
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to convert JSON to YAML'
		};
	}
}

/**
 * Convert a YAML string to JSON format
 * @param yaml - The YAML string to convert
 * @param indent - Number of spaces for JSON indentation (default: 2)
 * @returns ConversionResult with JSON string or error details
 */
export function yamlToJson(yaml: string, indent: number = 2): ConversionResult {
	const trimmed = yaml.trim();
	if (!trimmed) {
		return {
			success: false,
			error: 'Please enter YAML to convert'
		};
	}

	try {
		// Parse YAML
		const parsed = parse(trimmed);

		// Convert to JSON
		const json = JSON.stringify(parsed, null, indent);

		return {
			success: true,
			data: json
		};
	} catch (error) {
		// YAML parse errors include line/column info
		if (error instanceof Error) {
			const lineMatch = error.message.match(/at line (\d+)/);
			const colMatch = error.message.match(/column (\d+)/);

			return {
				success: false,
				error: `Invalid YAML: ${error.message}`,
				line: lineMatch ? parseInt(lineMatch[1]) : undefined,
				column: colMatch ? parseInt(colMatch[1]) : undefined
			};
		}

		return {
			success: false,
			error: 'Failed to convert YAML to JSON'
		};
	}
}

/**
 * Validate YAML syntax without converting
 * @param input - The YAML string to validate
 * @returns ConversionResult indicating validity with error details if invalid
 */
export function validateYaml(input: string): ConversionResult {
	const trimmed = input.trim();
	if (!trimmed) {
		return {
			success: false,
			error: 'Please enter YAML to validate'
		};
	}

	try {
		parse(trimmed);
		return { success: true };
	} catch (error) {
		if (error instanceof Error) {
			const lineMatch = error.message.match(/at line (\d+)/);
			const colMatch = error.message.match(/column (\d+)/);

			return {
				success: false,
				error: error.message,
				line: lineMatch ? parseInt(lineMatch[1]) : undefined,
				column: colMatch ? parseInt(colMatch[1]) : undefined
			};
		}

		return {
			success: false,
			error: 'Invalid YAML'
		};
	}
}
