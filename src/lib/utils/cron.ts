import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

/**
 * Cron format type: 5-field (standard) or 6-field (with seconds)
 */
export type CronFormat = '5-field' | '6-field';

/**
 * Special cron strings supported by many cron implementations
 */
export const SPECIAL_STRINGS: Record<string, { expression: string; description: string }> = {
	'@yearly': { expression: '0 0 1 1 *', description: 'Run once a year at midnight on January 1st' },
	'@annually': {
		expression: '0 0 1 1 *',
		description: 'Run once a year at midnight on January 1st'
	},
	'@monthly': {
		expression: '0 0 1 * *',
		description: 'Run once a month at midnight on the 1st day'
	},
	'@weekly': { expression: '0 0 * * 0', description: 'Run once a week at midnight on Sunday' },
	'@daily': { expression: '0 0 * * *', description: 'Run once a day at midnight' },
	'@midnight': { expression: '0 0 * * *', description: 'Run once a day at midnight' },
	'@hourly': {
		expression: '0 * * * *',
		description: 'Run once an hour at the beginning of the hour'
	},
	'@reboot': { expression: '', description: 'Run once at startup (not schedulable)' }
};

/**
 * Result of parsing a cron expression
 */
export interface CronParseResult {
	valid: boolean;
	description?: string;
	error?: string;
	nextRuns?: Date[];
	format: CronFormat;
	isSpecialString: boolean;
	normalizedExpression?: string;
}

/**
 * Options for parsing cron expressions
 */
export interface ParseOptions {
	nextRunCount?: number;
}

/**
 * Field configuration for the cron builder
 */
export interface CronField {
	name: string;
	label: string;
	min: number;
	max: number;
	altLabels?: string[]; // For months (JAN-DEC) and weekdays (SUN-SAT)
}

/**
 * Cron field definitions for 5-field format
 */
export const CRON_FIELDS_5: CronField[] = [
	{ name: 'minute', label: 'Minute', min: 0, max: 59 },
	{ name: 'hour', label: 'Hour', min: 0, max: 23 },
	{ name: 'dayOfMonth', label: 'Day of Month', min: 1, max: 31 },
	{
		name: 'month',
		label: 'Month',
		min: 1,
		max: 12,
		altLabels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
	},
	{
		name: 'dayOfWeek',
		label: 'Day of Week',
		min: 0,
		max: 6,
		altLabels: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
	}
];

/**
 * Cron field definitions for 6-field format (with seconds)
 */
export const CRON_FIELDS_6: CronField[] = [
	{ name: 'second', label: 'Second', min: 0, max: 59 },
	...CRON_FIELDS_5
];

/**
 * Builder field value types
 */
export type FieldValueType = 'wildcard' | 'specific' | 'range' | 'list' | 'step' | 'rangeStep';

/**
 * Builder field value configuration
 */
export interface FieldValue {
	type: FieldValueType;
	specific?: number;
	rangeStart?: number;
	rangeEnd?: number;
	step?: number;
	listValues?: number[];
}

/**
 * Check if an expression is a special string
 */
export function isSpecialString(expression: string): boolean {
	const trimmed = expression.trim().toLowerCase();
	return trimmed in SPECIAL_STRINGS;
}

/**
 * Expand a special string to its cron expression equivalent
 */
export function expandSpecialString(expression: string): string | null {
	const trimmed = expression.trim().toLowerCase();
	return SPECIAL_STRINGS[trimmed]?.expression || null;
}

/**
 * Get the description for a special string
 */
export function getSpecialStringDescription(expression: string): string | null {
	const trimmed = expression.trim().toLowerCase();
	return SPECIAL_STRINGS[trimmed]?.description || null;
}

/**
 * Detect the format of a cron expression (5-field or 6-field)
 */
export function detectCronFormat(expression: string): CronFormat {
	const trimmed = expression.trim();

	// Special strings are always treated as 5-field
	if (isSpecialString(trimmed)) {
		return '5-field';
	}

	const parts = trimmed.split(/\s+/);
	return parts.length >= 6 ? '6-field' : '5-field';
}

/**
 * Get a human-readable description of a cron expression
 */
export function getCronDescription(expression: string): string {
	const trimmed = expression.trim();

	// Handle special strings
	if (isSpecialString(trimmed)) {
		const desc = getSpecialStringDescription(trimmed);
		if (desc) return desc;
	}

	// Handle @reboot separately as it's not schedulable
	if (trimmed.toLowerCase() === '@reboot') {
		return 'Run once at system startup';
	}

	try {
		const format = detectCronFormat(trimmed);
		const options = {
			throwExceptionOnParseError: true,
			use24HourTimeFormat: false,
			verbose: format === '6-field'
		};

		return cronstrue.toString(trimmed, options);
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : 'Failed to parse cron expression');
	}
}

/**
 * Get the next N run times for a cron expression
 */
export function getNextRuns(expression: string, count: number = 5): Date[] {
	const trimmed = expression.trim();

	// Handle special strings
	if (isSpecialString(trimmed)) {
		const expanded = expandSpecialString(trimmed);
		if (!expanded) {
			// @reboot can't be scheduled
			return [];
		}
		return getNextRunsFromExpression(expanded, count, '5-field');
	}

	const format = detectCronFormat(trimmed);
	return getNextRunsFromExpression(trimmed, count, format);
}

/**
 * Internal function to get next runs from a normalized expression
 */
function getNextRunsFromExpression(expression: string, count: number, format: CronFormat): Date[] {
	try {
		// cron-parser v5 always expects 6-field format
		// For 5-field expressions, prepend '0' for seconds
		let expr = expression;
		if (format === '5-field') {
			expr = '0 ' + expression;
		}

		const cronExpr = CronExpressionParser.parse(expr, {
			currentDate: new Date()
		});
		const runs: Date[] = [];

		for (let i = 0; i < count; i++) {
			try {
				const next = cronExpr.next();
				runs.push(next.toDate());
			} catch {
				// No more iterations available
				break;
			}
		}

		return runs;
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : 'Failed to calculate next run times');
	}
}

/**
 * Validate a cron expression
 */
export function validateCronExpression(expression: string): { valid: boolean; error?: string } {
	const trimmed = expression.trim();

	if (!trimmed) {
		return { valid: false, error: 'Expression is empty' };
	}

	// Handle special strings
	if (isSpecialString(trimmed)) {
		return { valid: true };
	}

	try {
		// Try to parse with cron-parser (requires 6-field format)
		const format = detectCronFormat(trimmed);
		const expr = format === '5-field' ? '0 ' + trimmed : trimmed;
		CronExpressionParser.parse(expr);
		// Also validate with cronstrue to ensure description can be generated
		cronstrue.toString(trimmed, { throwExceptionOnParseError: true });
		return { valid: true };
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Invalid cron expression'
		};
	}
}

/**
 * Parse a cron expression and return full details
 */
export function parseCronExpression(
	expression: string,
	options: ParseOptions = {}
): CronParseResult {
	const { nextRunCount = 5 } = options;
	const trimmed = expression.trim();

	if (!trimmed) {
		return {
			valid: false,
			error: 'Expression is empty',
			format: '5-field',
			isSpecialString: false
		};
	}

	const isSpecial = isSpecialString(trimmed);
	const format = detectCronFormat(trimmed);

	// Validate first
	const validation = validateCronExpression(trimmed);
	if (!validation.valid) {
		return {
			valid: false,
			error: validation.error,
			format,
			isSpecialString: isSpecial
		};
	}

	try {
		const description = getCronDescription(trimmed);
		const nextRuns = getNextRuns(trimmed, nextRunCount);
		const normalizedExpression = isSpecial ? expandSpecialString(trimmed) || undefined : trimmed;

		return {
			valid: true,
			description,
			nextRuns,
			format,
			isSpecialString: isSpecial,
			normalizedExpression
		};
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Failed to parse expression',
			format,
			isSpecialString: isSpecial
		};
	}
}

/**
 * Build a cron field value string from FieldValue configuration
 */
export function buildFieldValue(value: FieldValue): string {
	switch (value.type) {
		case 'wildcard':
			return '*';
		case 'specific':
			return String(value.specific ?? 0);
		case 'range':
			return `${value.rangeStart ?? 0}-${value.rangeEnd ?? 0}`;
		case 'list':
			return (value.listValues ?? []).join(',');
		case 'step':
			return `*/${value.step ?? 1}`;
		case 'rangeStep':
			return `${value.rangeStart ?? 0}-${value.rangeEnd ?? 0}/${value.step ?? 1}`;
		default:
			return '*';
	}
}

/**
 * Build a complete cron expression from field values
 */
export function buildCronExpression(fields: FieldValue[], format: CronFormat = '5-field'): string {
	const expectedLength = format === '6-field' ? 6 : 5;
	const values = fields.slice(0, expectedLength).map(buildFieldValue);

	// Pad with wildcards if not enough fields
	while (values.length < expectedLength) {
		values.push('*');
	}

	return values.join(' ');
}

/**
 * Get default field values for the builder
 */
export function getDefaultFieldValues(format: CronFormat = '5-field'): FieldValue[] {
	const count = format === '6-field' ? 6 : 5;
	return Array.from({ length: count }, () => ({ type: 'wildcard' as FieldValueType }));
}

/**
 * Common cron expression examples
 */
export const CRON_EXAMPLES: { expression: string; description: string }[] = [
	{ expression: '* * * * *', description: 'Every minute' },
	{ expression: '0 * * * *', description: 'Every hour' },
	{ expression: '0 0 * * *', description: 'Every day at midnight' },
	{ expression: '0 9 * * *', description: 'Every day at 9:00 AM' },
	{ expression: '0 9 * * 1-5', description: 'Weekdays at 9:00 AM' },
	{ expression: '*/15 * * * *', description: 'Every 15 minutes' },
	{ expression: '0 */2 * * *', description: 'Every 2 hours' },
	{ expression: '0 0 * * 0', description: 'Every Sunday at midnight' },
	{ expression: '0 0 1 * *', description: 'First day of every month at midnight' },
	{ expression: '0 0 1 1 *', description: 'Every year on January 1st at midnight' },
	{ expression: '30 4 1,15 * *', description: '4:30 AM on 1st and 15th of each month' },
	{ expression: '0 22 * * 1-5', description: '10:00 PM on weekdays' }
];

/**
 * Format a date for display with relative time
 */
export function formatNextRunDate(date: Date): { absolute: string; relative: string } {
	const now = new Date();
	const diff = date.getTime() - now.getTime();

	// Absolute format
	const absolute = date.toLocaleString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	// Relative format
	let relative: string;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		relative = `in ${days} day${days === 1 ? '' : 's'}`;
		const remainingHours = hours % 24;
		if (remainingHours > 0) {
			relative += ` ${remainingHours} hr${remainingHours === 1 ? '' : 's'}`;
		}
	} else if (hours > 0) {
		relative = `in ${hours} hr${hours === 1 ? '' : 's'}`;
		const remainingMinutes = minutes % 60;
		if (remainingMinutes > 0) {
			relative += ` ${remainingMinutes} min`;
		}
	} else if (minutes > 0) {
		relative = `in ${minutes} min`;
		const remainingSeconds = seconds % 60;
		if (remainingSeconds > 0) {
			relative += ` ${remainingSeconds} sec`;
		}
	} else if (seconds > 0) {
		relative = `in ${seconds} sec`;
	} else {
		relative = 'now';
	}

	return { absolute, relative };
}
