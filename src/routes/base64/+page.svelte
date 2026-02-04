<script lang="ts">
	import { encodeBase64, decodeBase64 } from '$lib/utils/base64';
	import { copyToClipboard } from '$lib/utils/clipboard';

	let input = $state('');
	let output = $state('');
	let error = $state('');
	let copySuccess = $state(false);

	function handleEncode() {
		error = '';
		if (!input.trim()) {
			error = 'Please enter some text to encode.';
			return;
		}
		try {
			output = encodeBase64(input);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to encode text.';
		}
	}

	function handleDecode() {
		error = '';
		if (!input.trim()) {
			error = 'Please enter Base64 text to decode.';
			return;
		}
		try {
			output = decodeBase64(input);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to decode Base64.';
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
		error = '';
		copySuccess = false;
	}

	function handleSwap() {
		if (output) {
			input = output;
			output = '';
			error = '';
		}
	}
</script>

<svelte:head>
	<title>Base64 Encoder/Decoder - Lakitu.dev</title>
	<meta name="description" content="Free online Base64 encoder and decoder. Convert text to Base64 or decode Base64 back to text. Supports Unicode characters." />
</svelte:head>

<div class="max-w-4xl mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Base64 Encoder/Decoder</h1>
		<p class="text-base-content/70">
			Encode text to Base64 or decode Base64 back to plain text. Fully supports Unicode characters.
		</p>
	</header>

	<!-- Error Alert -->
	{#if error}
		<div class="alert alert-error mb-6" role="alert">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span>{error}</span>
			<button class="btn btn-sm btn-ghost" onclick={() => error = ''} aria-label="Dismiss error">
				&times;
			</button>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Input Section -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">Input <span class="font-normal text-base-content/50">{input.length} characters</span></legend>
			<textarea
				id="input-text"
				class="textarea textarea-bordered h-64 font-mono text-sm w-full"
				placeholder="Enter text to encode or Base64 to decode..."
				bind:value={input}
			></textarea>
		</fieldset>

		<!-- Output Section -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">Output <span class="font-normal text-base-content/50">{output.length} characters</span></legend>
			<textarea
				id="output-text"
				class="textarea textarea-bordered h-64 font-mono text-sm bg-base-200 w-full"
				placeholder="Result will appear here..."
				readonly
				value={output}
			></textarea>
		</fieldset>
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-wrap gap-3 mt-6 justify-center">
		<button class="btn btn-primary" onclick={handleEncode}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
			</svg>
			Encode
		</button>
		<button class="btn btn-secondary" onclick={handleDecode}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
			</svg>
			Decode
		</button>
		<button class="btn btn-outline" onclick={handleSwap} disabled={!output}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
			</svg>
			Swap
		</button>
		<button class="btn btn-outline" onclick={handleCopy} disabled={!output}>
			{#if copySuccess}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				Copied!
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
				</svg>
				Copy
			{/if}
		</button>
		<button class="btn btn-ghost" onclick={handleClear}>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
			</svg>
			Clear
		</button>
	</div>

	<!-- Info Section -->
	<section class="mt-12 prose prose-sm max-w-none">
		<h2 class="text-xl font-semibold mb-4">About Base64 Encoding</h2>
		<p class="text-base-content/70">
			Base64 is a binary-to-text encoding scheme that represents binary data as an ASCII string. 
			It's commonly used for encoding data in URLs, emails, and storing complex data in text-based formats like JSON or XML.
		</p>
		<h3 class="text-lg font-semibold mt-4 mb-2">Features</h3>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li>Full Unicode support including emojis and special characters</li>
			<li>Handles multiline text preserving line breaks</li>
			<li>Client-side processing - your data never leaves your browser</li>
		</ul>
	</section>
</div>
