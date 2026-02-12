/**
 * Common timezones for the timezone selector
 */
export const COMMON_TIMEZONES = [
	{ value: 'UTC', label: 'UTC' },
	{ value: 'America/New_York', label: 'Eastern Time (ET)' },
	{ value: 'America/Chicago', label: 'Central Time (CT)' },
	{ value: 'America/Denver', label: 'Mountain Time (MT)' },
	{ value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
	{ value: 'Europe/London', label: 'London (GMT/BST)' },
	{ value: 'Europe/Paris', label: 'Central European (CET)' },
	{ value: 'Europe/Berlin', label: 'Berlin (CET)' },
	{ value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
	{ value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
	{ value: 'Asia/Kolkata', label: 'India (IST)' },
	{ value: 'Australia/Sydney', label: 'Sydney (AEST)' }
] as const;

export type TimestampUnit = 'seconds' | 'milliseconds';

/**
 * Auto-detect if a timestamp is in seconds or milliseconds based on magnitude.
 * Timestamps after year 2001 in seconds are > 1,000,000,000
 * Timestamps in milliseconds are > 1,000,000,000,000
 */
export function detectTimestampUnit(timestamp: number): TimestampUnit {
	// If the number is greater than 10 trillion, it's definitely milliseconds
	// If it's between 1 billion and 10 trillion, check the resulting year
	const absTimestamp = Math.abs(timestamp);

	if (absTimestamp > 1e13) {
		// More than 13 digits - milliseconds (year 2286+)
		return 'milliseconds';
	}

	if (absTimestamp > 1e12) {
		// 13 digits - likely milliseconds (2001-2286 range)
		return 'milliseconds';
	}

	// 10 digits or less - likely seconds
	return 'seconds';
}

/**
 * Convert a timestamp to a Date object, auto-detecting the unit.
 */
export function timestampToDate(timestamp: number): Date {
	const unit = detectTimestampUnit(timestamp);
	const ms = unit === 'seconds' ? timestamp * 1000 : timestamp;
	return new Date(ms);
}

/**
 * Convert a Date to Unix timestamp in seconds.
 */
export function dateToTimestampSeconds(date: Date): number {
	return Math.floor(date.getTime() / 1000);
}

/**
 * Convert a Date to Unix timestamp in milliseconds.
 */
export function dateToTimestampMilliseconds(date: Date): number {
	return date.getTime();
}

/**
 * Format a date in ISO 8601 format.
 */
export function formatISO8601(date: Date, timezone: string = 'UTC'): string {
	if (timezone === 'UTC') {
		return date.toISOString();
	}
	// For other timezones, we need to format manually
	const options: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	};
	const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date);
	const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

	return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}

/**
 * Format a date in RFC 2822 format.
 */
export function formatRFC2822(date: Date, timezone: string = 'UTC'): string {
	const options: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
		weekday: 'short',
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZoneName: 'shortOffset'
	};

	return new Intl.DateTimeFormat('en-US', options).format(date).replace(/,/g, '');
}

/**
 * Format a date in the user's locale format.
 */
export function formatLocal(date: Date, timezone: string = 'UTC'): string {
	const options: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
		dateStyle: 'full',
		timeStyle: 'long'
	};
	return new Intl.DateTimeFormat(undefined, options).format(date);
}

/**
 * Get a human-readable relative time string (e.g., "3 days ago", "in 2 hours").
 */
export function getRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	const diffSeconds = Math.round(diffMs / 1000);
	const diffMinutes = Math.round(diffSeconds / 60);
	const diffHours = Math.round(diffMinutes / 60);
	const diffDays = Math.round(diffHours / 24);
	const diffWeeks = Math.round(diffDays / 7);
	const diffMonths = Math.round(diffDays / 30);
	const diffYears = Math.round(diffDays / 365);

	const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

	if (Math.abs(diffSeconds) < 60) {
		return rtf.format(diffSeconds, 'second');
	}
	if (Math.abs(diffMinutes) < 60) {
		return rtf.format(diffMinutes, 'minute');
	}
	if (Math.abs(diffHours) < 24) {
		return rtf.format(diffHours, 'hour');
	}
	if (Math.abs(diffDays) < 7) {
		return rtf.format(diffDays, 'day');
	}
	if (Math.abs(diffWeeks) < 4) {
		return rtf.format(diffWeeks, 'week');
	}
	if (Math.abs(diffMonths) < 12) {
		return rtf.format(diffMonths, 'month');
	}
	return rtf.format(diffYears, 'year');
}

/**
 * Validate if a string is a valid timestamp.
 */
export function isValidTimestamp(input: string): boolean {
	if (!input || input.trim() === '') return false;
	const num = Number(input);
	if (isNaN(num)) return false;
	// Allow negative timestamps (before 1970) and reasonable positive timestamps
	// Max reasonable timestamp: year 3000 in milliseconds
	const maxMs = new Date('3000-01-01').getTime();
	const minMs = new Date('1900-01-01').getTime();

	const unit = detectTimestampUnit(num);
	const ms = unit === 'seconds' ? num * 1000 : num;

	return ms >= minMs && ms <= maxMs;
}

/**
 * Get the current timestamp in seconds.
 */
export function getCurrentTimestampSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

/**
 * Get the current timestamp in milliseconds.
 */
export function getCurrentTimestampMilliseconds(): number {
	return Date.now();
}

/**
 * Format a datetime-local input value from a Date object.
 */
export function dateToDatetimeLocalValue(date: Date, timezone: string = 'UTC'): string {
	const options: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	};
	const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date);
	const get = (type: string) => parts.find((p) => p.type === type)?.value || '';

	return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}

/**
 * Parse a datetime-local input value to a Date object.
 */
export function datetimeLocalValueToDate(value: string, timezone: string = 'UTC'): Date {
	// datetime-local format: YYYY-MM-DDTHH:mm:ss
	const [datePart, timePart] = value.split('T');
	const [year, month, day] = datePart.split('-').map(Number);
	const [hour, minute, second = 0] = (timePart || '00:00:00').split(':').map(Number);

	if (timezone === 'UTC') {
		return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
	}

	// For other timezones, we need to calculate the offset
	// Create a date in the target timezone and adjust
	const tempDate = new Date(year, month - 1, day, hour, minute, second);

	// Get the offset for the target timezone at this date/time
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: false
	});

	// Parse the formatted date back
	const parts = formatter.formatToParts(tempDate);
	const getPart = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);

	const tzDate = new Date(
		getPart('year'),
		getPart('month') - 1,
		getPart('day'),
		getPart('hour'),
		getPart('minute'),
		getPart('second')
	);

	// Calculate offset and adjust
	const offset = tzDate.getTime() - tempDate.getTime();
	return new Date(tempDate.getTime() - offset);
}

/**
 * Get the user's local timezone.
 */
export function getLocalTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get timezone offset string (e.g., "+05:30", "-08:00").
 */
export function getTimezoneOffset(date: Date, timezone: string): string {
	const options: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
		timeZoneName: 'shortOffset'
	};
	const formatted = new Intl.DateTimeFormat('en-US', options).format(date);
	// eslint-disable-next-line security/detect-unsafe-regex -- Safe: bounded quantifiers, no backtracking risk
	const match = formatted.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
	if (match) {
		const offset = match[1];
		// Normalize to always have minutes
		if (!offset.includes(':')) {
			return offset + ':00';
		}
		return offset;
	}
	return '+00:00';
}
