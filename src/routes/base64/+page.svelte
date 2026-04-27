<script lang="ts">
	import { encodeBase64, decodeBase64 } from '$lib/utils/base64';
	import {
		encodeImageToBase64,
		decodeBase64ToImage,
		SUPPORTED_IMAGE_TYPES,
		MAX_IMAGE_SIZE,
		formatBytes,
		type ImageEncodeResult
	} from '$lib/utils/base64';
	import { copyToClipboard } from '$lib/utils/clipboard';

	// Tab state
	let activeTab = $state<'text' | 'image'>('text');

	// ── Text tab ──────────────────────────────────────────────
	let input = $state('');
	let output = $state('');
	let error = $state('');
	let copySuccess = $state(false);

	function handleEncode() {
		error = '';
		if (!input.trim()) { error = 'Please enter some text to encode.'; return; }
		try { output = encodeBase64(input); } catch (e) {
			error = e instanceof Error ? e.message : 'Failed to encode text.';
		}
	}

	function handleDecode() {
		error = '';
		if (!input.trim()) { error = 'Please enter Base64 text to decode.'; return; }
		try { output = decodeBase64(input); } catch (e) {
			error = e instanceof Error ? e.message : 'Failed to decode Base64.';
		}
	}

	async function handleCopy() {
		if (!output) return;
		const success = await copyToClipboard(output);
		if (success) { copySuccess = true; setTimeout(() => { copySuccess = false; }, 2000); }
	}

	function handleClear() { input = ''; output = ''; error = ''; copySuccess = false; }

	function handleSwap() {
		if (output) { input = output; output = ''; error = ''; }
	}

	// ── Image tab ─────────────────────────────────────────────
	let imageMode = $state<'encode' | 'decode'>('encode');

	// Encode state
	let dragOver = $state(false);
	let imageError = $state('');
	let imageWarning = $state('');
	let encodeResult = $state<ImageEncodeResult | null>(null);
	let includeDataPrefix = $state(true);
	let imageCopySuccess = $state(false);
	let fileInputEl = $state<HTMLInputElement>(null!);

	// Decode state
	let decodeInput = $state('');
	let decodedImageUri = $state('');
	let decodedMimeType = $state('');
	let decodeError = $state('');

	function resetImageState() {
		imageError = '';
		imageWarning = '';
		encodeResult = null;
		imageCopySuccess = false;
	}

	async function processFile(file: File) {
		resetImageState();

		if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
			imageError = `Unsupported file type "${file.type}". Supported: PNG, JPEG, GIF, WebP, SVG.`;
			return;
		}
		if (file.size > MAX_IMAGE_SIZE) {
			imageWarning = `File is ${formatBytes(file.size)}, which exceeds the 5 MB soft limit. Processing anyway, but results may be large.`;
		}

		try {
			encodeResult = await encodeImageToBase64(file);
		} catch (e) {
			imageError = e instanceof Error ? e.message : 'Failed to encode image.';
		}
	}

	function handleFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) processFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) processFile(file);
	}

	function handleDragOver(e: DragEvent) { e.preventDefault(); dragOver = true; }
	function handleDragLeave() { dragOver = false; }

	function encodedOutput(): string {
		if (!encodeResult) return '';
		return includeDataPrefix ? encodeResult.dataUri : encodeResult.base64;
	}

	async function handleImageCopy() {
		const val = encodedOutput();
		if (!val) return;
		const success = await copyToClipboard(val);
		if (success) { imageCopySuccess = true; setTimeout(() => { imageCopySuccess = false; }, 2000); }
	}

	function handleImageDecode() {
		decodeError = '';
		decodedImageUri = '';
		decodedMimeType = '';
		if (!decodeInput.trim()) { decodeError = 'Please paste a Base64 string or data URI.'; return; }
		try {
			const result = decodeBase64ToImage(decodeInput.trim());
			decodedImageUri = result.dataUri;
			decodedMimeType = result.mimeType;
		} catch (e) {
			decodeError = e instanceof Error ? e.message : 'Failed to decode.';
		}
	}

	function handleDownload() {
		if (!decodedImageUri) return;
		const ext = decodedMimeType.split('/')[1]?.replace('svg+xml', 'svg') ?? 'png';
		const a = document.createElement('a');
		a.href = decodedImageUri;
		a.download = `decoded-image.${ext}`;
		a.click();
	}

	function resetImageTab() {
		resetImageState();
		decodeInput = '';
		decodedImageUri = '';
		decodedMimeType = '';
		decodeError = '';
		if (fileInputEl) fileInputEl.value = '';
	}
</script>

<svelte:head>
	<title>Base64 Encoder/Decoder - Lakitu.dev</title>
	<meta
		name="description"
		content="Free online Base64 encoder and decoder. Convert text or images to Base64 or decode Base64 back. Supports Unicode, PNG, JPEG, GIF, WebP, SVG."
	/>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<header class="mb-6">
		<h1 class="text-3xl font-bold mb-2">Base64 Encoder/Decoder</h1>
		<p class="text-base-content/70">
			Encode and decode text or images. All processing happens in your browser.
		</p>
	</header>

	<!-- Tab switcher -->
	<div role="tablist" class="tabs tabs-bordered mb-6">
		<button
			role="tab"
			class="tab {activeTab === 'text' ? 'tab-active' : ''}"
			onclick={() => { activeTab = 'text'; }}
		>Text</button>
		<button
			role="tab"
			class="tab {activeTab === 'image' ? 'tab-active' : ''}"
			onclick={() => { activeTab = 'image'; }}
		>Image</button>
	</div>

	<!-- ── TEXT TAB ─────────────────────────────────────────── -->
	{#if activeTab === 'text'}
		{#if error}
			<div class="alert alert-error mb-6" role="alert">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>{error}</span>
				<button class="btn btn-sm btn-ghost" onclick={() => (error = '')} aria-label="Dismiss error">&times;</button>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<fieldset class="fieldset w-full">
				<legend class="fieldset-legend">Input <span class="font-normal text-base-content/50">{input.length} characters</span></legend>
				<textarea
					class="textarea textarea-bordered h-64 font-mono text-sm w-full"
					placeholder="Enter text to encode or Base64 to decode..."
					bind:value={input}
				></textarea>
			</fieldset>

			<fieldset class="fieldset w-full">
				<legend class="fieldset-legend">Output <span class="font-normal text-base-content/50">{output.length} characters</span></legend>
				<textarea
					class="textarea textarea-bordered h-64 font-mono text-sm bg-base-200 w-full"
					placeholder="Result will appear here..."
					readonly
					value={output}
				></textarea>
			</fieldset>
		</div>

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

		<section class="mt-12 prose prose-sm max-w-none">
			<h2 class="text-xl font-semibold mb-4">About Base64 Encoding</h2>
			<p class="text-base-content/70">
				Base64 is a binary-to-text encoding scheme that represents binary data as an ASCII string.
				It's commonly used for encoding data in URLs, emails, and storing complex data in text-based
				formats like JSON or XML.
			</p>
			<h3 class="text-lg font-semibold mt-4 mb-2">Features</h3>
			<ul class="list-disc list-inside text-base-content/70 space-y-1">
				<li>Full Unicode support including emojis and special characters</li>
				<li>Handles multiline text preserving line breaks</li>
				<li>Client-side processing - your data never leaves your browser</li>
			</ul>
		</section>
	{/if}

	<!-- ── IMAGE TAB ─────────────────────────────────────────── -->
	{#if activeTab === 'image'}
		<!-- Mode toggle -->
		<div class="flex gap-2 mb-6">
			<button
				class="btn btn-sm {imageMode === 'encode' ? 'btn-primary' : 'btn-outline'}"
				onclick={() => { imageMode = 'encode'; resetImageTab(); }}
			>Encode (Image → Base64)</button>
			<button
				class="btn btn-sm {imageMode === 'decode' ? 'btn-primary' : 'btn-outline'}"
				onclick={() => { imageMode = 'decode'; resetImageTab(); }}
			>Decode (Base64 → Image)</button>
		</div>

		<!-- ENCODE MODE -->
		{#if imageMode === 'encode'}
			{#if imageError}
				<div class="alert alert-error mb-4" role="alert">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{imageError}</span>
					<button class="btn btn-sm btn-ghost" onclick={() => (imageError = '')} aria-label="Dismiss">&times;</button>
				</div>
			{/if}
			{#if imageWarning}
				<div class="alert alert-warning mb-4" role="alert">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<span>{imageWarning}</span>
				</div>
			{/if}

			<!-- Drop zone -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
					{dragOver ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}"
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
				onclick={() => fileInputEl.click()}
				onkeydown={(e) => e.key === 'Enter' && fileInputEl.click()}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<p class="text-base-content/60 mb-2">Drag & drop an image here, or click to browse</p>
				<p class="text-base-content/40 text-sm">PNG, JPEG, GIF, WebP, SVG · Max 5 MB recommended</p>
				<input
					bind:this={fileInputEl}
					type="file"
					accept={SUPPORTED_IMAGE_TYPES.join(',')}
					class="hidden"
					onchange={handleFileInput}
				/>
			</div>

			{#if encodeResult}
				<!-- Metadata -->
				<div class="mt-6 grid grid-cols-3 gap-4">
					<div class="stat bg-base-200 rounded-xl p-4">
						<div class="stat-title text-xs">MIME type</div>
						<div class="stat-value text-sm font-mono">{encodeResult.mimeType}</div>
					</div>
					<div class="stat bg-base-200 rounded-xl p-4">
						<div class="stat-title text-xs">Original size</div>
						<div class="stat-value text-sm">{formatBytes(encodeResult.originalSize)}</div>
					</div>
					<div class="stat bg-base-200 rounded-xl p-4">
						<div class="stat-title text-xs">Encoded size</div>
						<div class="stat-value text-sm">{formatBytes(encodeResult.encodedSize)}</div>
					</div>
				</div>

				<!-- Options -->
				<div class="mt-4 flex items-center gap-3">
					<label class="label cursor-pointer gap-2">
						<input type="checkbox" class="toggle toggle-sm toggle-primary" bind:checked={includeDataPrefix} />
						<span class="label-text">Include <code>data:</code> URI prefix</span>
					</label>
				</div>

				<!-- Output -->
				<fieldset class="fieldset w-full mt-4">
					<legend class="fieldset-legend">Base64 output</legend>
					<textarea
						class="textarea textarea-bordered h-40 font-mono text-xs bg-base-200 w-full"
						readonly
						value={encodedOutput()}
					></textarea>
				</fieldset>

				<div class="flex gap-3 mt-4">
					<button class="btn btn-primary" onclick={handleImageCopy}>
						{#if imageCopySuccess}
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
					<button class="btn btn-ghost" onclick={resetImageTab}>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
						Clear
					</button>
				</div>
			{/if}
		{/if}

		<!-- DECODE MODE -->
		{#if imageMode === 'decode'}
			{#if decodeError}
				<div class="alert alert-error mb-4" role="alert">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{decodeError}</span>
					<button class="btn btn-sm btn-ghost" onclick={() => (decodeError = '')} aria-label="Dismiss">&times;</button>
				</div>
			{/if}

			<fieldset class="fieldset w-full">
				<legend class="fieldset-legend">Paste Base64 or data URI</legend>
				<textarea
					class="textarea textarea-bordered h-40 font-mono text-xs w-full"
					placeholder="data:image/png;base64,iVBORw0KGgo... or raw Base64"
					bind:value={decodeInput}
				></textarea>
			</fieldset>

			<div class="flex gap-3 mt-4">
				<button class="btn btn-primary" onclick={handleImageDecode}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					Preview Image
				</button>
				<button class="btn btn-ghost" onclick={resetImageTab}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
					Clear
				</button>
			</div>

			{#if decodedImageUri}
				<div class="mt-6">
					<div class="mb-3 flex items-center gap-4">
						<span class="badge badge-outline font-mono">{decodedMimeType}</span>
						<button class="btn btn-sm btn-secondary" onclick={handleDownload}>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							Download
						</button>
					</div>
					<div class="border border-base-300 rounded-xl p-4 bg-base-200 flex items-center justify-center min-h-48">
						<img src={decodedImageUri} alt="Decoded" class="max-w-full max-h-96 object-contain rounded" />
					</div>
				</div>
			{/if}
		{/if}
	{/if}
</div>
