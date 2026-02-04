<script lang="ts">
	import { validateJSON, formatJSON, minifyJSON } from '$lib/utils/json';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import Prism from 'prismjs';
	import 'prismjs/components/prism-json';

	let input = $state('');
	let output = $state('');
	let highlightedOutput = $state('');
	let error = $state('');
	let errorLine = $state<number | undefined>(undefined);
	let errorColumn = $state<number | undefined>(undefined);
	let indentSize = $state(2);
	let copySuccess = $state(false);
	let isValid = $state<boolean | null>(null);

	function updateHighlighting() {
		if (output && typeof Prism !== 'undefined') {
			highlightedOutput = Prism.highlight(output, Prism.languages.json, 'json');
		} else {
			highlightedOutput = '';
		}
	}

	function handleValidate() {
		error = '';
		errorLine = undefined;
		errorColumn = undefined;
		output = '';
		highlightedOutput = '';

		if (!input.trim()) {
			error = 'Please enter some JSON to validate.';
			isValid = null;
			return;
		}

		const result = validateJSON(input);
		isValid = result.valid;

		if (result.valid) {
			error = '';
		} else {
			error = result.error || 'Invalid JSON';
			errorLine = result.line;
			errorColumn = result.column;
		}
	}

	function handleFormat() {
		error = '';
		errorLine = undefined;
		errorColumn = undefined;
		isValid = null;

		if (!input.trim()) {
			error = 'Please enter some JSON to format.';
			return;
		}

		try {
			output = formatJSON(input, indentSize);
			isValid = true;
			updateHighlighting();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to format JSON.';
			isValid = false;
			output = '';
			highlightedOutput = '';
		}
	}

	function handleMinify() {
		error = '';
		errorLine = undefined;
		errorColumn = undefined;
		isValid = null;

		if (!input.trim()) {
			error = 'Please enter some JSON to minify.';
			return;
		}

		try {
			output = minifyJSON(input);
			isValid = true;
			updateHighlighting();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to minify JSON.';
			isValid = false;
			output = '';
			highlightedOutput = '';
		}
	}

	async function handleCopy() {
		if (!output) return;
		const success = await copyToClipboard(output);
		if (success) {
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		}
	}

	function handleClear() {
		input = '';
		output = '';
		highlightedOutput = '';
		error = '';
		errorLine = undefined;
		errorColumn = undefined;
		isValid = null;
		copySuccess = false;
	}

	function handleUseOutput() {
		if (output) {
			input = output;
			output = '';
			highlightedOutput = '';
			error = '';
			isValid = null;
		}
	}

	function loadSampleJSON() {
		input = JSON.stringify(
			{
				name: 'Lakitu.dev',
				description: 'Developer utility tools',
				features: ['Base64 encoding', 'JSON formatting', 'Syntax highlighting'],
				settings: {
					darkMode: true,
					indentSize: 2
				},
				version: 1.0
			},
			null,
			2
		);
		error = '';
		isValid = null;
	}
</script>

<svelte:head>
	<title>JSON Formatter/Validator - Lakitu.dev</title>
	<meta
		name="description"
		content="Free online JSON formatter, validator, and minifier with syntax highlighting. Validate JSON and get detailed error messages."
	/>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">JSON Formatter/Validator</h1>
		<p class="text-base-content/70">
			Format, validate, and minify JSON with syntax highlighting and detailed error messages.
		</p>
	</header>

	<!-- Validation Status -->
	{#if isValid !== null}
		<div class="mb-4">
			{#if isValid}
				<div class="alert alert-success" role="status">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>Valid JSON</span>
				</div>
			{:else}
				<div class="alert alert-error" role="alert">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div>
						<span class="font-semibold">Invalid JSON</span>
						{#if error}
							<span class="block text-sm">{error}</span>
						{/if}
						{#if errorLine !== undefined && errorColumn !== undefined}
							<span class="block text-sm">Line {errorLine}, Column {errorColumn}</span>
						{/if}
					</div>
					<button
						class="btn btn-sm btn-ghost"
						onclick={() => {
							isValid = null;
							error = '';
						}}
						aria-label="Dismiss"
					>
						&times;
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Error Alert (for other errors) -->
	{#if error && isValid === null}
		<div class="alert alert-warning mb-4" role="alert">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="stroke-current shrink-0 h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<span>{error}</span>
			<button class="btn btn-sm btn-ghost" onclick={() => (error = '')} aria-label="Dismiss">
				&times;
			</button>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Input Section -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend"
				>Input JSON <span class="font-normal text-base-content/50">{input.length} characters</span
				></legend
			>
			<textarea
				id="json-input"
				class="textarea textarea-bordered h-120 font-mono text-sm w-full"
				placeholder={'Enter JSON here, e.g. {"key": "value"}'}
				bind:value={input}
			></textarea>
			<div class="mt-2">
				<button class="btn btn-xs btn-ghost" onclick={loadSampleJSON}> Load sample JSON </button>
			</div>
		</fieldset>

		<!-- Output Section -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend"
				>Output <span class="font-normal text-base-content/50">{output.length} characters</span
				></legend
			>
			<div class="relative">
				{#if highlightedOutput}
					<!-- Safe to use {@html} here because:
						 1. Input is parsed with JSON.parse() which validates JSON structure
						 2. Output is generated by JSON.stringify() which escapes special characters
						 3. Prism.highlight() only wraps tokens in <span> elements
						 Invalid/malicious input fails at JSON.parse() before reaching here -->
					<pre
						class="h-80 overflow-auto rounded-lg border border-base-300 bg-base-200 p-4 font-mono text-sm"><code
							class="language-json">{@html highlightedOutput}</code
						></pre>
				{:else}
					<textarea
						id="json-output"
						class="textarea textarea-bordered h-120 font-mono text-sm bg-base-200 w-full"
						placeholder="Formatted JSON will appear here..."
						readonly
						value={output}
					></textarea>
				{/if}
			</div>
		</fieldset>
	</div>

	<!-- Options Bar -->
	<div class="flex flex-wrap items-center gap-4 mt-6 p-4 bg-base-200 rounded-lg">
		<label class="select">
			<span class="label">Indent:</span>
			<select bind:value={indentSize}>
				<option value={2}>2 spaces</option>
				<option value={4}>4 spaces</option>
			</select>
		</label>
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-wrap gap-3 mt-6 justify-center">
		<button class="btn btn-primary" onclick={handleFormat}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-1"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16m-7 6h7"
				/>
			</svg>
			Format
		</button>
		<button class="btn btn-secondary" onclick={handleMinify}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-1"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
			Minify
		</button>
		<button class="btn btn-accent" onclick={handleValidate}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-1"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			Validate
		</button>
		<button class="btn btn-outline" onclick={handleUseOutput} disabled={!output}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-1"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
				/>
			</svg>
			Use Output
		</button>
		<button class="btn btn-outline" onclick={handleCopy} disabled={!output}>
			{#if copySuccess}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 mr-1 text-success"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				Copied!
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 mr-1"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
					/>
				</svg>
				Copy
			{/if}
		</button>
		<button class="btn btn-ghost" onclick={handleClear}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-1"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
				/>
			</svg>
			Clear
		</button>
	</div>

	<!-- Info Section -->
	<section class="mt-12 prose prose-sm max-w-none">
		<h2 class="text-xl font-semibold mb-4">About JSON Formatting</h2>
		<p class="text-base-content/70">
			JSON (JavaScript Object Notation) is a lightweight data interchange format that's easy for
			humans to read and write. This tool helps you format messy JSON into readable, properly
			indented structure.
		</p>
		<h3 class="text-lg font-semibold mt-4 mb-2">Features</h3>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li>Format/prettify JSON with customizable indentation (2 or 4 spaces)</li>
			<li>Minify JSON by removing all unnecessary whitespace</li>
			<li>Validate JSON with detailed error messages including line and column numbers</li>
			<li>Syntax highlighting for easy reading</li>
			<li>Client-side processing - your data never leaves your browser</li>
		</ul>
	</section>
</div>
