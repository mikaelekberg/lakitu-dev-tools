import {
	FileKey,
	Braces,
	KeyRound,
	Fingerprint,
	Clock,
	Regex,
	Timer,
	FileCode2
} from 'lucide-svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = any;

export interface Tool {
	id: string;
	label: string;
	title: string;
	description: string;
	icon: IconComponent;
}

export const tools: Tool[] = [
	{
		id: 'base64',
		label: 'Base64',
		title: 'Base64 Encoder/Decoder',
		description:
			'Encode text to Base64 or decode Base64 back to text. Supports Unicode characters.',
		icon: FileKey
	},
	{
		id: 'json',
		label: 'JSON',
		title: 'JSON Formatter/Validator',
		description: 'Format, validate, and minify JSON with syntax highlighting and error detection.',
		icon: Braces
	},
	{
		id: 'jwt',
		label: 'JWT',
		title: 'JWT Decoder/Encoder',
		description: 'Decode, verify, and create JSON Web Tokens with HS256 signature support.',
		icon: KeyRound
	},
	{
		id: 'uuid',
		label: 'UUID',
		title: 'UUID/GUID Generator',
		description: 'Generate UUID v4, UUID v7, or ULID unique identifiers with customizable formats.',
		icon: Fingerprint
	},
	{
		id: 'cron',
		label: 'Cron',
		title: 'Cron Expression Parser',
		description:
			'Parse, validate, and build cron expressions with human-readable explanations and next run times.',
		icon: Clock
	},
	{
		id: 'regex',
		label: 'Regex',
		title: 'Regex Tester',
		description:
			'Test regular expressions with real-time matching, capture group highlighting, and common patterns library.',
		icon: Regex
	},
	{
		id: 'unix-time',
		label: 'Unix Time',
		title: 'Unix Time Converter',
		description:
			'Convert Unix timestamps to human-readable dates and vice versa. Supports seconds, milliseconds, and multiple timezones.',
		icon: Timer
	},
	{
		id: 'yaml',
		label: 'YAML',
		title: 'JSON to YAML Converter',
		description:
			'Convert between JSON and YAML formats with syntax highlighting and validation.',
		icon: FileCode2
	}
];

export function getToolHref(tool: Tool): string {
	return `/${tool.id}`;
}
