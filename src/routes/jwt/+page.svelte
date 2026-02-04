<script lang="ts">
	import {
		decodeJWT,
		encodeJWT,
		verifyJWTSignature,
		validateJWTClaims,
		formatDate,
		getTimeRemaining,
		type DecodedJWT,
		type JWTValidationResult
	} from '$lib/utils/jwt';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import Prism from 'prismjs';
	import 'prismjs/components/prism-json';

	// Tab state
	let activeTab = $state<'decode' | 'encode'>('decode');

	// Decode tab state
	let tokenInput = $state('');
	let decodedJWT = $state<DecodedJWT | null>(null);
	let validationResult = $state<JWTValidationResult | null>(null);
	let decodeError = $state('');
	let headerHighlighted = $state('');
	let payloadHighlighted = $state('');

	// Signature verification state
	let verifySecret = $state('');
	let signatureValid = $state<boolean | null>(null);
	let signatureVerifying = $state(false);

	// Encode tab state
	let encodeHeader = $state('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
	let encodePayload = $state(
		'{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": ' +
			Math.floor(Date.now() / 1000) +
			'\n}'
	);
	let encodeSecret = $state('');
	let encodedToken = $state('');
	let encodeError = $state('');
	let isEncoding = $state(false);

	// Copy state
	let copyHeaderSuccess = $state(false);
	let copyPayloadSuccess = $state(false);
	let copyTokenSuccess = $state(false);

	function highlightJSON(json: string): string {
		if (typeof Prism !== 'undefined') {
			return Prism.highlight(json, Prism.languages.json, 'json');
		}
		return json;
	}

	function handleDecode() {
		decodeError = '';
		decodedJWT = null;
		validationResult = null;
		headerHighlighted = '';
		payloadHighlighted = '';
		signatureValid = null;

		if (!tokenInput.trim()) {
			decodeError = 'Please enter a JWT token to decode.';
			return;
		}

		try {
			const decoded = decodeJWT(tokenInput);
			decodedJWT = decoded;

			// Format and highlight JSON
			const headerJson = JSON.stringify(decoded.header, null, 2);
			const payloadJson = JSON.stringify(decoded.payload, null, 2);
			headerHighlighted = highlightJSON(headerJson);
			payloadHighlighted = highlightJSON(payloadJson);

			// Validate claims
			validationResult = validateJWTClaims(decoded.payload);
		} catch (e) {
			decodeError = e instanceof Error ? e.message : 'Failed to decode JWT.';
		}
	}

	async function handleVerifySignature() {
		if (!tokenInput.trim() || !verifySecret.trim()) {
			return;
		}

		signatureVerifying = true;
		try {
			signatureValid = await verifyJWTSignature(tokenInput.trim(), verifySecret);
		} catch {
			signatureValid = false;
		} finally {
			signatureVerifying = false;
		}
	}

	async function handleEncode() {
		encodeError = '';
		encodedToken = '';

		if (!encodeSecret.trim()) {
			encodeError = 'Please enter a secret for signing the token.';
			return;
		}

		let headerObj;
		let payloadObj;

		try {
			headerObj = JSON.parse(encodeHeader);
		} catch {
			encodeError = 'Invalid JSON in header. Please check the syntax.';
			return;
		}

		try {
			payloadObj = JSON.parse(encodePayload);
		} catch {
			encodeError = 'Invalid JSON in payload. Please check the syntax.';
			return;
		}

		if (headerObj.alg !== 'HS256') {
			encodeError = 'Only HS256 algorithm is supported. Please set "alg": "HS256" in the header.';
			return;
		}

		isEncoding = true;
		try {
			encodedToken = await encodeJWT(headerObj, payloadObj, encodeSecret);
		} catch (e) {
			encodeError = e instanceof Error ? e.message : 'Failed to encode JWT.';
		} finally {
			isEncoding = false;
		}
	}

	async function handleCopyHeader() {
		if (!decodedJWT) return;
		const success = await copyToClipboard(JSON.stringify(decodedJWT.header, null, 2));
		if (success) {
			copyHeaderSuccess = true;
			setTimeout(() => {
				copyHeaderSuccess = false;
			}, 2000);
		}
	}

	async function handleCopyPayload() {
		if (!decodedJWT) return;
		const success = await copyToClipboard(JSON.stringify(decodedJWT.payload, null, 2));
		if (success) {
			copyPayloadSuccess = true;
			setTimeout(() => {
				copyPayloadSuccess = false;
			}, 2000);
		}
	}

	async function handleCopyToken() {
		if (!encodedToken) return;
		const success = await copyToClipboard(encodedToken);
		if (success) {
			copyTokenSuccess = true;
			setTimeout(() => {
				copyTokenSuccess = false;
			}, 2000);
		}
	}

	function handleDecodeClear() {
		tokenInput = '';
		decodedJWT = null;
		validationResult = null;
		decodeError = '';
		headerHighlighted = '';
		payloadHighlighted = '';
		verifySecret = '';
		signatureValid = null;
		copyHeaderSuccess = false;
		copyPayloadSuccess = false;
	}

	function handleEncodeClear() {
		encodeHeader = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
		encodePayload =
			'{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": ' +
			Math.floor(Date.now() / 1000) +
			'\n}';
		encodeSecret = '';
		encodedToken = '';
		encodeError = '';
		copyTokenSuccess = false;
	}

	function loadSampleToken() {
		// Sample expired token for testing (generated with secret "secret")
		tokenInput =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';
		handleDecode();
	}
</script>

<svelte:head>
	<title>JWT Decoder & Encoder - Lakitu.dev</title>
	<meta
		name="description"
		content="Free online JWT decoder and encoder. Decode, verify, and create JSON Web Tokens with HS256 signature support."
	/>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">JWT Decoder & Encoder</h1>
		<p class="text-base-content/70">
			Decode, verify, and create JSON Web Tokens. Supports HS256 signature algorithm.
		</p>
	</header>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-box mb-6">
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'decode'}
			onclick={() => (activeTab = 'decode')}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-2"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
				/>
			</svg>
			Decode
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'encode'}
			onclick={() => (activeTab = 'encode')}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 mr-2"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
			Encode
		</button>
	</div>

	<!-- Decode Tab -->
	{#if activeTab === 'decode'}
		<!-- Error Alert -->
		{#if decodeError}
			<div class="alert alert-error mb-6" role="alert">
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
				<span>{decodeError}</span>
				<button
					class="btn btn-sm btn-ghost"
					onclick={() => (decodeError = '')}
					aria-label="Dismiss error"
				>
					&times;
				</button>
			</div>
		{/if}

		<!-- Token Input -->
		<fieldset class="fieldset w-full mb-6">
			<legend class="fieldset-legend">JWT Token</legend>
			<textarea
				class="textarea textarea-bordered h-32 font-mono text-sm w-full"
				placeholder="Paste your JWT token here (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
				bind:value={tokenInput}
			></textarea>
			<div class="mt-2">
				<button class="btn btn-xs btn-ghost" onclick={loadSampleToken}> Load sample token </button>
			</div>
		</fieldset>

		<!-- Action Buttons -->
		<div class="flex flex-wrap gap-3 mb-6 justify-center">
			<button class="btn btn-primary" onclick={handleDecode}>
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
						d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
					/>
				</svg>
				Decode Token
			</button>
			<button class="btn btn-ghost" onclick={handleDecodeClear}>
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

		<!-- Decoded Result -->
		{#if decodedJWT}
			<!-- Token Status -->
			{#if validationResult}
				<div class="mb-6">
					{#if validationResult.valid}
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
							<div>
								<span class="font-semibold">Token claims are valid</span>
								{#if validationResult.expiresAt}
									<span class="block text-sm">
										Expires: {formatDate(validationResult.expiresAt)} ({getTimeRemaining(
											validationResult.expiresAt
										)})
									</span>
								{/if}
							</div>
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
								<span class="font-semibold">Token validation failed</span>
								{#each validationResult.errors as error}
									<span class="block text-sm">{error}</span>
								{/each}
							</div>
						</div>
					{/if}
					{#if validationResult.warnings.length > 0}
						<div class="alert alert-warning mt-2" role="status">
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
							<div>
								{#each validationResult.warnings as warning}
									<span class="block text-sm">{warning}</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Token Info -->
			{#if validationResult?.issuedAt || validationResult?.notBefore}
				<div class="stats stats-vertical lg:stats-horizontal shadow mb-6 w-full">
					{#if validationResult.issuedAt}
						<div class="stat">
							<div class="stat-title">Issued At (iat)</div>
							<div class="stat-value text-lg">{formatDate(validationResult.issuedAt)}</div>
						</div>
					{/if}
					{#if validationResult.notBefore}
						<div class="stat">
							<div class="stat-title">Not Before (nbf)</div>
							<div class="stat-value text-lg">{formatDate(validationResult.notBefore)}</div>
						</div>
					{/if}
					{#if validationResult.expiresAt}
						<div class="stat">
							<div class="stat-title">Expires At (exp)</div>
							<div class="stat-value text-lg">{formatDate(validationResult.expiresAt)}</div>
							<div class="stat-desc">{getTimeRemaining(validationResult.expiresAt)}</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Signature Verification -->
			<div class="p-4 bg-base-200 rounded-lg mb-6">
				<h3 class="font-semibold mb-3">Signature Verification</h3>
				<div class="flex flex-wrap gap-3 items-end">
					<div class="form-control flex-1 min-w-48">
						<label class="label" for="verify-secret">
							<span class="label-text">Secret (for HS256)</span>
						</label>
						<input
							id="verify-secret"
							type="password"
							class="input input-bordered w-full font-mono"
							placeholder="Enter your secret key"
							bind:value={verifySecret}
						/>
					</div>
					<button
						class="btn btn-secondary"
						onclick={handleVerifySignature}
						disabled={!verifySecret.trim() || signatureVerifying}
					>
						{#if signatureVerifying}
							<span class="loading loading-spinner loading-sm"></span>
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
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						{/if}
						Verify Signature
					</button>
					{#if signatureValid !== null}
						{#if signatureValid}
							<div class="badge badge-success gap-1">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
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
								Valid signature
							</div>
						{:else}
							<div class="badge badge-error gap-1">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
								Invalid signature
							</div>
						{/if}
					{/if}
				</div>
			</div>

			<!-- Header and Payload -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Header -->
				<fieldset class="fieldset w-full">
					<legend class="fieldset-legend">Header</legend>
					<div class="relative">
						<!-- Safe to use {@html} here because:
							 1. decodedJWT.header is parsed JSON object
							 2. JSON.stringify escapes special characters
							 3. Prism.highlight only wraps tokens in <span> elements -->
						<pre
							class="h-160 overflow-auto rounded-lg border border-base-300 bg-base-200 p-4 font-mono text-sm"><code
								class="language-json">{@html headerHighlighted}</code
							></pre>
						<button
							class="btn btn-sm btn-ghost absolute top-2 right-2"
							onclick={handleCopyHeader}
							aria-label="Copy header"
						>
							{#if copyHeaderSuccess}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-success"
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
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
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
							{/if}
						</button>
					</div>
				</fieldset>

				<!-- Payload -->
				<fieldset class="fieldset w-full">
					<legend class="fieldset-legend">Payload</legend>
					<div class="relative">
						<!-- Safe to use {@html} here because:
							 1. decodedJWT.payload is parsed JSON object
							 2. JSON.stringify escapes special characters
							 3. Prism.highlight only wraps tokens in <span> elements -->
						<pre
							class="h-160 overflow-auto rounded-lg border border-base-300 bg-base-200 p-4 font-mono text-sm"><code
								class="language-json">{@html payloadHighlighted}</code
							></pre>
						<button
							class="btn btn-sm btn-ghost absolute top-2 right-2"
							onclick={handleCopyPayload}
							aria-label="Copy payload"
						>
							{#if copyPayloadSuccess}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-success"
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
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
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
							{/if}
						</button>
					</div>
				</fieldset>
			</div>

			<!-- Signature -->
			<fieldset class="fieldset w-full mt-6">
				<legend class="fieldset-legend">Signature (Base64URL encoded)</legend>
				<div class="p-4 bg-base-200 rounded-lg font-mono text-sm break-all">
					{decodedJWT.signature}
				</div>
			</fieldset>
		{/if}
	{/if}

	<!-- Encode Tab -->
	{#if activeTab === 'encode'}
		<!-- Error Alert -->
		{#if encodeError}
			<div class="alert alert-error mb-6" role="alert">
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
				<span>{encodeError}</span>
				<button
					class="btn btn-sm btn-ghost"
					onclick={() => (encodeError = '')}
					aria-label="Dismiss error"
				>
					&times;
				</button>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- Header Input -->
			<fieldset class="fieldset w-full">
				<legend class="fieldset-legend">Header (JSON)</legend>
				<textarea
					class="textarea textarea-bordered h-140 font-mono text-sm w-full"
					placeholder={'{\n  "alg": "HS256",\n  "typ": "JWT"\n}'}
					bind:value={encodeHeader}
				></textarea>
			</fieldset>

			<!-- Payload Input -->
			<fieldset class="fieldset w-full">
				<legend class="fieldset-legend">Payload (JSON)</legend>
				<textarea
					class="textarea textarea-bordered h-140 font-mono text-sm w-full"
					placeholder={'{\n  "sub": "1234567890",\n  "name": "John Doe"\n}'}
					bind:value={encodePayload}
				></textarea>
			</fieldset>
		</div>

		<!-- Secret Input -->
		<div class="form-control mb-6">
			<label class="label" for="encode-secret">
				<span class="label-text font-semibold">Secret (for HS256 signing)</span>
			</label>
			<input
				id="encode-secret"
				type="password"
				class="input input-bordered w-full font-mono"
				placeholder="Enter your secret key for signing"
				bind:value={encodeSecret}
			/>
			<div class="label">
				<span class="label-text-alt text-warning"
					>Never share your secret key. This tool runs entirely in your browser.</span
				>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-wrap gap-3 mb-6 justify-center">
			<button class="btn btn-primary" onclick={handleEncode} disabled={isEncoding}>
				{#if isEncoding}
					<span class="loading loading-spinner loading-sm"></span>
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
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
				{/if}
				Generate Token
			</button>
			<button class="btn btn-ghost" onclick={handleEncodeClear}>
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

		<!-- Generated Token -->
		{#if encodedToken}
			<fieldset class="fieldset w-full">
				<legend class="fieldset-legend">Generated JWT Token</legend>
				<div class="relative">
					<textarea
						class="textarea textarea-bordered h-32 font-mono text-sm bg-base-200 w-full"
						readonly
						value={encodedToken}
					></textarea>
					<button class="btn btn-sm btn-outline absolute top-2 right-2" onclick={handleCopyToken}>
						{#if copyTokenSuccess}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4 text-success"
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
								class="h-4 w-4 mr-1"
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
				</div>
			</fieldset>
		{/if}
	{/if}

	<!-- Info Section -->
	<section class="mt-12 prose prose-sm max-w-none">
		<h2 class="text-xl font-semibold mb-4">About JSON Web Tokens (JWT)</h2>
		<p class="text-base-content/70">
			JWT (JSON Web Token) is an open standard (RFC 7519) for securely transmitting information
			between parties as a JSON object. JWTs are commonly used for authentication and information
			exchange in web applications.
		</p>
		<h3 class="text-lg font-semibold mt-4 mb-2">Features</h3>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li>Decode any JWT token to view its header and payload</li>
			<li>Verify HS256 signatures with your secret key</li>
			<li>Validate standard claims (exp, iat, nbf, iss, sub, aud, jti)</li>
			<li>Check token expiration status with human-readable dates</li>
			<li>Generate new JWT tokens with HS256 signing</li>
			<li>Client-side processing - your tokens and secrets never leave your browser</li>
		</ul>
		<h3 class="text-lg font-semibold mt-4 mb-2">JWT Structure</h3>
		<p class="text-base-content/70">A JWT consists of three parts separated by dots:</p>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li><strong>Header</strong> - Contains the token type and signing algorithm</li>
			<li><strong>Payload</strong> - Contains the claims (data) about the user or entity</li>
			<li><strong>Signature</strong> - Ensures the token hasn't been tampered with</li>
		</ul>
	</section>
</div>
