<script lang="ts">
	import {
		generateMultiple,
		extractTimestamp,
		generateUUIDv7,
		generateULID,
		type UUIDType,
		type FormatOptions,
		type TimestampExtractionResult
	} from '$lib/utils/uuid';
	import { copyToClipboard } from '$lib/utils/clipboard';

	// Tab state
	let activeTab = $state<'generate' | 'extract'>('generate');

	// Generate tab state
	let uuidType: UUIDType = $state('uuidv4');
	let count = $state(5);
	let uppercase = $state(false);
	let hyphens = $state(true);
	let output = $state<string[]>([]);
	let copySuccess = $state(false);

	// Extract tab state
	let extractInput = $state('');
	let extractResult = $state<TimestampExtractionResult | null>(null);
	let copiedField = $state<string | null>(null);

	// Type options for the dropdown
	const typeOptions: { value: UUIDType; label: string; description: string }[] = [
		{ value: 'uuidv4', label: 'UUID v4', description: 'Random' },
		{ value: 'uuidv7', label: 'UUID v7', description: 'Timestamp + Random' },
		{ value: 'ulid', label: 'ULID', description: 'Sortable' }
	];

	function handleGenerate() {
		const options: FormatOptions = { uppercase, hyphens };
		output = generateMultiple(uuidType, count, options);
	}

	async function handleCopy() {
		if (output.length === 0) return;
		const text = output.join('\n');
		const success = await copyToClipboard(text);
		if (success) {
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		}
	}

	function handleClear() {
		output = [];
		copySuccess = false;
	}

	// Extract tab functions
	function handleExtract() {
		extractResult = extractTimestamp(extractInput);
	}

	function handleExtractClear() {
		extractInput = '';
		extractResult = null;
		copiedField = null;
	}

	function loadSampleUUIDv7() {
		extractInput = generateUUIDv7();
		handleExtract();
	}

	function loadSampleULID() {
		extractInput = generateULID();
		handleExtract();
	}

	async function handleCopyField(value: string, fieldName: string) {
		const success = await copyToClipboard(value);
		if (success) {
			copiedField = fieldName;
			setTimeout(() => {
				copiedField = null;
			}, 2000);
		}
	}

	// Generate initial set on mount
	$effect(() => {
		if (output.length === 0) {
			handleGenerate();
		}
	});
</script>

<svelte:head>
	<title>UUID/GUID Generator - Lakitu.dev</title>
	<meta
		name="description"
		content="Generate UUIDs (v4, v7) and ULIDs online. Create random, timestamp-based, or lexicographically sortable unique identifiers. Free, client-side tool."
	/>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">UUID/GUID Generator</h1>
		<p class="text-base-content/70">
			Generate unique identifiers: UUID v4 (random), UUID v7 (timestamp-based), or ULID
			(lexicographically sortable). Extract timestamps from existing UUID v7 or ULID values.
		</p>
	</header>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-box mb-6">
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'generate'}
			onclick={() => (activeTab = 'generate')}
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
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
			Generate
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'extract'}
			onclick={() => (activeTab = 'extract')}
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
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			Extract Timestamp
		</button>
	</div>

	<!-- Generate Tab -->
	{#if activeTab === 'generate'}
		<!-- Options Section -->
		<div class="card bg-base-200 mb-6">
			<div class="card-body">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<!-- Type Selector -->
					<fieldset class="fieldset">
						<legend class="fieldset-legend">Type</legend>
						<select class="select select-bordered w-full" bind:value={uuidType}>
							{#each typeOptions as option}
								<option value={option.value}>{option.label} ({option.description})</option>
							{/each}
						</select>
					</fieldset>

					<!-- Count Selector -->
					<fieldset class="fieldset">
						<legend class="fieldset-legend">Count</legend>
						<input
							type="number"
							class="input input-bordered w-full"
							bind:value={count}
							min="1"
							max="10"
						/>
					</fieldset>

					<!-- Format Options -->
					<fieldset class="fieldset">
						<legend class="fieldset-legend">Case</legend>
						<div class="flex gap-4 h-12 items-center">
							<label class="label cursor-pointer gap-2">
								<input
									type="radio"
									name="case"
									class="radio radio-sm"
									checked={!uppercase}
									onchange={() => (uppercase = false)}
								/>
								<span class="label-text">lowercase</span>
							</label>
							<label class="label cursor-pointer gap-2">
								<input
									type="radio"
									name="case"
									class="radio radio-sm"
									checked={uppercase}
									onchange={() => (uppercase = true)}
								/>
								<span class="label-text">UPPERCASE</span>
							</label>
						</div>
					</fieldset>

					<!-- Hyphens Option (only for UUIDs) -->
					<fieldset class="fieldset">
						<legend class="fieldset-legend">Hyphens</legend>
						<div class="flex gap-4 h-12 items-center">
							<label class="label cursor-pointer gap-2">
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									bind:checked={hyphens}
									disabled={uuidType === 'ulid'}
								/>
								<span class="label-text {uuidType === 'ulid' ? 'opacity-50' : ''}">
									{uuidType === 'ulid' ? 'N/A for ULID' : 'Include hyphens'}
								</span>
							</label>
						</div>
					</fieldset>
				</div>
			</div>
		</div>

		<!-- Generate Button -->
		<div class="flex justify-center mb-6">
			<button class="btn btn-primary btn-lg" onclick={handleGenerate}>
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
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				Generate
			</button>
		</div>

		<!-- Output Section -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">
				Generated IDs <span class="font-normal text-base-content/50">{output.length} items</span>
			</legend>
			<div class="bg-base-200 rounded-lg p-4 font-mono text-sm min-h-48 max-h-96 overflow-y-auto">
				{#if output.length > 0}
					<ul class="space-y-1">
						{#each output as id, i}
							<li class="flex items-center gap-2 group">
								<span class="text-base-content/40 text-xs w-6 text-right">{i + 1}.</span>
								<code class="flex-1 select-all">{id}</code>
								<button
									class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
									onclick={async () => {
										await copyToClipboard(id);
									}}
									aria-label="Copy this ID"
								>
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
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-base-content/50 text-center py-8">
						Click "Generate" to create unique identifiers
					</p>
				{/if}
			</div>
		</fieldset>

		<!-- Action Buttons -->
		<div class="flex flex-wrap gap-3 mt-6 justify-center">
			<button class="btn btn-outline" onclick={handleCopy} disabled={output.length === 0}>
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
					Copy All
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
			<h2 class="text-xl font-semibold mb-4">About Unique Identifiers</h2>
			<p class="text-base-content/70">
				UUIDs (Universally Unique Identifiers) and ULIDs are used to create unique identifiers for
				database records, API resources, and distributed systems. This tool generates them entirely
				in your browser - no data is sent to any server.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 not-prose">
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">UUID v4</h3>
						<p class="text-sm text-base-content/70">
							Random UUIDs. Most widely used. 122 random bits provide virtually no chance of
							collision.
						</p>
						<code class="text-xs mt-2 opacity-70">550e8400-e29b-41d4-a716-446655440000</code>
					</div>
				</div>
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">UUID v7</h3>
						<p class="text-sm text-base-content/70">
							Timestamp-based + random. Sortable by creation time. Modern standard (RFC 9562).
						</p>
						<code class="text-xs mt-2 opacity-70">018f6b1a-7c3d-7000-8000-123456789abc</code>
					</div>
				</div>
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">ULID</h3>
						<p class="text-sm text-base-content/70">
							Lexicographically sortable. Compact 26-character format using Crockford's Base32.
						</p>
						<code class="text-xs mt-2 opacity-70">01ARZ3NDEKTSV4RRFFQ69G5FAV</code>
					</div>
				</div>
			</div>

			<h3 class="text-lg font-semibold mt-6 mb-2">Features</h3>
			<ul class="list-disc list-inside text-base-content/70 space-y-1">
				<li>Generate up to 10 unique identifiers at once</li>
				<li>Choose between UUID v4, UUID v7, or ULID formats</li>
				<li>Customize output: uppercase/lowercase, with or without hyphens</li>
				<li>Copy individual IDs or all at once</li>
				<li>Client-side generation - your data stays in your browser</li>
			</ul>
		</section>
	{/if}

	<!-- Extract Timestamp Tab -->
	{#if activeTab === 'extract'}
		<!-- Input Section -->
		<fieldset class="fieldset w-full mb-6">
			<legend class="fieldset-legend">Input</legend>
			<input
				type="text"
				class="input input-bordered w-full font-mono"
				placeholder="Paste UUID v7 or ULID here..."
				bind:value={extractInput}
				onkeydown={(e) => e.key === 'Enter' && handleExtract()}
			/>
		</fieldset>

		<!-- Action Buttons -->
		<div class="flex flex-wrap gap-3 mb-6 justify-center">
			<button class="btn btn-primary" onclick={handleExtract}>
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
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Extract
			</button>
			<button class="btn btn-outline" onclick={loadSampleUUIDv7}>Sample UUID v7</button>
			<button class="btn btn-outline" onclick={loadSampleULID}>Sample ULID</button>
			<button class="btn btn-ghost" onclick={handleExtractClear}>
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

		<!-- Error Alert -->
		{#if extractResult && !extractResult.valid}
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
				<span>{extractResult.error}</span>
			</div>
		{/if}

		<!-- Results Section -->
		{#if extractResult && extractResult.valid}
			<div class="card bg-base-200">
				<div class="card-body">
					<!-- Detected Type Badge -->
					<div class="flex items-center gap-2 mb-4">
						<span class="text-base-content/70">Detected Type:</span>
						<span
							class="badge badge-lg"
							class:badge-primary={extractResult.type === 'uuidv7'}
							class:badge-secondary={extractResult.type === 'ulid'}
						>
							{extractResult.type === 'uuidv7' ? 'UUID v7' : 'ULID'}
						</span>
					</div>

					<!-- Timestamp Results -->
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<tbody>
								<!-- Milliseconds -->
								<tr>
									<td class="font-medium w-40">Timestamp (ms)</td>
									<td class="font-mono">{extractResult.timestampMs}</td>
									<td class="text-right">
										<button
											class="btn btn-ghost btn-xs"
											onclick={() =>
												handleCopyField(String(extractResult?.timestampMs), 'timestampMs')}
											aria-label="Copy milliseconds timestamp"
										>
											{#if copiedField === 'timestampMs'}
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
									</td>
								</tr>
								<!-- Seconds -->
								<tr>
									<td class="font-medium">Timestamp (s)</td>
									<td class="font-mono">{extractResult.timestampSec}</td>
									<td class="text-right">
										<button
											class="btn btn-ghost btn-xs"
											onclick={() =>
												handleCopyField(String(extractResult?.timestampSec), 'timestampSec')}
											aria-label="Copy seconds timestamp"
										>
											{#if copiedField === 'timestampSec'}
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
									</td>
								</tr>
								<!-- ISO 8601 -->
								<tr>
									<td class="font-medium">ISO 8601 (UTC)</td>
									<td class="font-mono">{extractResult.iso8601}</td>
									<td class="text-right">
										<button
											class="btn btn-ghost btn-xs"
											onclick={() => handleCopyField(extractResult?.iso8601 ?? '', 'iso8601')}
											aria-label="Copy ISO 8601 timestamp"
										>
											{#if copiedField === 'iso8601'}
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
									</td>
								</tr>
								<!-- Local Time -->
								<tr>
									<td class="font-medium">Local Time</td>
									<td class="font-mono text-sm">{extractResult.localString}</td>
									<td class="text-right">
										<button
											class="btn btn-ghost btn-xs"
											onclick={() =>
												handleCopyField(extractResult?.localString ?? '', 'localString')}
											aria-label="Copy local time"
										>
											{#if copiedField === 'localString'}
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
									</td>
								</tr>
								<!-- Relative Time -->
								<tr>
									<td class="font-medium">Relative</td>
									<td class="text-base-content/70">{extractResult.relativeTime}</td>
									<td></td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}

		<!-- Info Section for Extract Tab -->
		<section class="mt-12 prose prose-sm max-w-none">
			<h2 class="text-xl font-semibold mb-4">About Timestamp Extraction</h2>
			<p class="text-base-content/70">
				UUID v7 and ULID both embed a timestamp in their structure, making them sortable by creation
				time. This tool extracts and displays that timestamp in various formats.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 not-prose">
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">UUID v7 Timestamp</h3>
						<p class="text-sm text-base-content/70">
							The first 48 bits (12 hex characters) contain the Unix timestamp in milliseconds. This
							allows UUIDs to be sorted chronologically.
						</p>
					</div>
				</div>
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">ULID Timestamp</h3>
						<p class="text-sm text-base-content/70">
							The first 10 characters encode a 48-bit Unix timestamp in milliseconds using
							Crockford's Base32 encoding.
						</p>
					</div>
				</div>
			</div>

			<div class="alert alert-info mt-6">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="stroke-current shrink-0 w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<span
					><strong>Note:</strong> UUID v4 does not contain a timestamp - it consists entirely of random
					bits.</span
				>
			</div>
		</section>
	{/if}
</div>
