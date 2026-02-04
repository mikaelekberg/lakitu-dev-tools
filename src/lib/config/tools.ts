import type { Component } from 'svelte';
import { FileKey, Braces, KeyRound, Fingerprint, Clock, Regex } from 'lucide-svelte';

export interface Tool {
	id: string;
	label: string;
	title: string;
	description: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: Component<any>;
}

export const tools: Tool[] = [
	{
		id: 'base64',
		label: 'Base64',
		title: 'Base64 Encoder/Decoder',
		description: 'Encode text to Base64 or decode Base64 back to text. Supports Unicode characters.',
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
		description:
			'Generate UUID v4, UUID v7, or ULID unique identifiers with customizable formats.',
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
	}
];

export function getToolHref(tool: Tool): string {
	return `/${tool.id}`;
}
