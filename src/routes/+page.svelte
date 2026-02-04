<script lang="ts">
	import ToolCard from '$lib/components/ToolCard.svelte';
	import { FileKey, Braces, KeyRound, Fingerprint, Clock, Regex } from 'lucide-svelte';

	const tools = [
		{
			title: 'Base64 Encoder/Decoder',
			description:
				'Encode text to Base64 or decode Base64 back to text. Supports Unicode characters.',
			href: '/base64',
			icon: FileKey
		},
		{
			title: 'JSON Formatter/Validator',
			description:
				'Format, validate, and minify JSON with syntax highlighting and error detection.',
			href: '/json',
			icon: Braces
		},
		{
			title: 'JWT Decoder/Encoder',
			description: 'Decode, verify, and create JSON Web Tokens with HS256 signature support.',
			href: '/jwt',
			icon: KeyRound
		},
		{
			title: 'UUID/GUID Generator',
			description:
				'Generate UUID v4, UUID v7, or ULID unique identifiers with customizable formats.',
			href: '/uuid',
			icon: Fingerprint
		},
		{
			title: 'Cron Expression Parser',
			description:
				'Parse, validate, and build cron expressions with human-readable explanations and next run times.',
			href: '/cron',
			icon: Clock
		},
		{
			title: 'Regex Tester',
			description:
				'Test regular expressions with real-time matching, capture group highlighting, and common patterns library.',
			href: '/regex',
			icon: Regex
		}
	];
</script>

<svelte:head>
	<title>Lakitu.dev - Developer Utility Tools</title>
	<meta
		name="description"
		content="Free online developer utility tools including Base64 encoder/decoder, JSON formatter/validator, and more. All tools run client-side for privacy."
	/>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<!-- Hero Section -->
	<section class="text-center mb-12">
		<h1 class="text-4xl md:text-5xl font-bold mb-4">Developer Utility Tools</h1>
		<p class="text-lg text-base-content/70 max-w-2xl mx-auto">
			Free, fast, and privacy-focused tools for developers. All processing happens in your browser -
			your data never leaves your device.
		</p>
	</section>

	<!-- Tools Grid -->
	<section aria-label="Available tools">
		<h2 class="text-2xl font-semibold mb-6">Available Tools</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each tools as tool}
				<ToolCard
					title={tool.title}
					description={tool.description}
					href={tool.href}
					icon={tool.icon}
				/>
			{/each}
		</div>
	</section>
</div>
