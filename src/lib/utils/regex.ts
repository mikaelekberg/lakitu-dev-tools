/**
 * Regex utility functions for the regex tester tool
 */

/**
 * Represents a single regex match with position and capture groups
 */
export interface RegexMatch {
	index: number;
	match: string;
	start: number;
	end: number;
	groups: string[];
}

/**
 * Result of testing a regex pattern against a string
 */
export interface RegexResult {
	valid: boolean;
	error?: string;
	matches: RegexMatch[];
	matchCount: number;
}

/**
 * Result of validating a regex pattern
 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * A common regex pattern with metadata
 */
export interface CommonPattern {
	name: string;
	pattern: string;
	flags: string;
	description: string;
}

/**
 * Common regex patterns that users can select from
 */
export const commonPatterns: CommonPattern[] = [
	{
		name: 'Email Address',
		pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
		flags: 'g',
		description: 'Matches email addresses'
	},
	{
		name: 'URL (HTTP/HTTPS)',
		pattern: "https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+",
		flags: 'gi',
		description: 'Matches HTTP and HTTPS URLs'
	},
	{
		name: 'Phone (US)',
		pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}',
		flags: 'g',
		description: 'Matches US phone numbers in various formats'
	},
	{
		name: 'IPv4 Address',
		pattern:
			'\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
		flags: 'g',
		description: 'Matches valid IPv4 addresses'
	},
	{
		name: 'Date (YYYY-MM-DD)',
		pattern: '\\d{4}-\\d{2}-\\d{2}',
		flags: 'g',
		description: 'Matches dates in ISO format'
	},
	{
		name: 'Date (MM/DD/YYYY)',
		pattern: '\\d{2}/\\d{2}/\\d{4}',
		flags: 'g',
		description: 'Matches dates in US format'
	},
	{
		name: 'Time (HH:MM:SS)',
		pattern: '\\d{1,2}:\\d{2}(?::\\d{2})?',
		flags: 'g',
		description: 'Matches time in 24-hour format'
	},
	{
		name: 'Hex Color',
		pattern: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b',
		flags: 'gi',
		description: 'Matches hex color codes (#RGB or #RRGGBB)'
	},
	{
		name: 'UUID',
		pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
		flags: 'gi',
		description: 'Matches UUID/GUID strings'
	},
	{
		name: 'HTML Tag',
		pattern: '<([a-z][a-z0-9]*)\\b[^>]*>([\\s\\S]*?)<\\/\\1>',
		flags: 'gi',
		description: 'Matches HTML tags with content'
	},
	{
		name: 'Quoted String',
		pattern: '(["\'])(?:(?!\\1)[^\\\\]|\\\\.)*\\1',
		flags: 'g',
		description: 'Matches single or double quoted strings'
	},
	{
		name: 'Digits Only',
		pattern: '\\d+',
		flags: 'g',
		description: 'Matches sequences of digits'
	},
	{
		name: 'Words Only',
		pattern: '\\b[a-zA-Z]+\\b',
		flags: 'g',
		description: 'Matches whole words (letters only)'
	},
	{
		name: 'Credit Card',
		pattern: '\\b(?:\\d{4}[- ]?){3}\\d{4}\\b',
		flags: 'g',
		description: 'Matches credit card number formats'
	},
	{
		name: 'Alphanumeric',
		pattern: '[a-zA-Z0-9]+',
		flags: 'g',
		description: 'Matches alphanumeric sequences'
	}
];

/**
 * Sample text for testing regex patterns
 */
export const sampleText = `Welcome to the Regex Tester!

Contact us at support@example.com or sales@company.org
Visit https://lakitu.dev for more developer tools.

Phone: (555) 123-4567 or 555-987-6543
Date: 2024-01-15, 03/25/2024
Time: 14:30:00

IP Address: 192.168.1.1
Colors: #FF5733, #abc, #123456
UUID: 550e8400-e29b-41d4-a716-446655440000

<div class="container">Hello World</div>
"quoted text" and 'single quoted'

Numbers: 42, 1234, 99999`;

/**
 * Validates a regex pattern without executing it
 * @param pattern - The regex pattern to validate
 * @returns ValidationResult indicating if the pattern is valid
 */
export function validatePattern(pattern: string): ValidationResult {
	if (!pattern) {
		return { valid: false, error: 'Pattern is empty' };
	}

	try {
		new RegExp(pattern);
		return { valid: true };
	} catch (e) {
		const error = e instanceof SyntaxError ? e.message : 'Invalid regular expression';
		return { valid: false, error };
	}
}

/**
 * Tests a regex pattern against an input string
 * @param pattern - The regex pattern to test
 * @param flags - Regex flags (g, i, m, s, u)
 * @param input - The string to test against
 * @returns RegexResult with matches and metadata
 */
export function testRegex(pattern: string, flags: string, input: string): RegexResult {
	if (!pattern) {
		return { valid: true, matches: [], matchCount: 0 };
	}

	if (!input) {
		return { valid: true, matches: [], matchCount: 0 };
	}

	try {
		const regex = new RegExp(pattern, flags);
		const matches: RegexMatch[] = [];

		if (flags.includes('g')) {
			// Global flag: find all matches
			let match: RegExpExecArray | null;
			let iterations = 0;
			const maxIterations = 10000; // Prevent infinite loops

			while ((match = regex.exec(input)) !== null && iterations < maxIterations) {
				const groups: string[] = [];
				// Capture groups start at index 1
				for (let i = 1; i < match.length; i++) {
					if (match[i] !== undefined) {
						groups.push(match[i]);
					}
				}

				matches.push({
					index: matches.length,
					match: match[0],
					start: match.index,
					end: match.index + match[0].length,
					groups
				});

				// Prevent infinite loop for zero-width matches
				if (match[0].length === 0) {
					regex.lastIndex++;
				}

				iterations++;
			}
		} else {
			// Non-global: find first match only
			const match = regex.exec(input);
			if (match) {
				const groups: string[] = [];
				for (let i = 1; i < match.length; i++) {
					if (match[i] !== undefined) {
						groups.push(match[i]);
					}
				}

				matches.push({
					index: 0,
					match: match[0],
					start: match.index,
					end: match.index + match[0].length,
					groups
				});
			}
		}

		return {
			valid: true,
			matches,
			matchCount: matches.length
		};
	} catch (e) {
		const error = e instanceof SyntaxError ? e.message : 'Invalid regular expression';
		return {
			valid: false,
			error,
			matches: [],
			matchCount: 0
		};
	}
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param text - The text to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string): string {
	const htmlEntities: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	};
	return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Color classes for highlighting matches and capture groups
 */
export const highlightColors = [
	'bg-warning/50', // Full match (yellow)
	'bg-primary/40', // Group 1 (blue)
	'bg-secondary/40', // Group 2 (purple)
	'bg-accent/40', // Group 3 (teal)
	'bg-success/40', // Group 4 (green)
	'bg-error/40' // Group 5 (red)
];

/**
 * Gets the color class for a match or group
 * @param index - 0 for full match, 1+ for capture groups
 * @returns CSS class for highlighting
 */
export function getHighlightColor(index: number): string {
	if (index === 0) return highlightColors[0];
	// Cycle through group colors (skip index 0 which is for full match)
	return highlightColors[((index - 1) % (highlightColors.length - 1)) + 1];
}

/**
 * Generates highlighted HTML from matches
 * @param input - The original input string
 * @param matches - Array of regex matches
 * @returns HTML string with highlighted matches
 */
export function generateHighlightedHtml(input: string, matches: RegexMatch[]): string {
	if (matches.length === 0) {
		return escapeHtml(input);
	}

	// Sort matches by start position
	const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

	let result = '';
	let lastEnd = 0;

	for (const match of sortedMatches) {
		// Skip overlapping matches
		if (match.start < lastEnd) continue;

		// Add text before this match
		if (match.start > lastEnd) {
			result += escapeHtml(input.slice(lastEnd, match.start));
		}

		// Add highlighted match
		const colorClass = match.groups.length > 0 ? getHighlightColor(1) : getHighlightColor(0);
		result += `<mark class="${colorClass} rounded px-0.5">${escapeHtml(match.match)}</mark>`;

		lastEnd = match.end;
	}

	// Add remaining text after last match
	if (lastEnd < input.length) {
		result += escapeHtml(input.slice(lastEnd));
	}

	return result;
}

/**
 * Formats matches as a plain text list for copying
 * @param matches - Array of regex matches
 * @returns Formatted string with match details
 */
export function formatMatchesForCopy(matches: RegexMatch[]): string {
	if (matches.length === 0) {
		return 'No matches found';
	}

	return matches
		.map((m, i) => {
			let line = `Match ${i + 1}: "${m.match}" (position ${m.start}-${m.end})`;
			if (m.groups.length > 0) {
				line += `\n  Groups: ${m.groups.map((g, j) => `[${j + 1}] "${g}"`).join(', ')}`;
			}
			return line;
		})
		.join('\n');
}
