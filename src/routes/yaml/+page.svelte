<script lang="ts">
	import { jsonToYaml, yamlToJson } from '$lib/utils/yaml';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import Prism from 'prismjs';
	import 'prismjs/components/prism-json';
	import 'prismjs/components/prism-yaml';

	let jsonInput = $state('');
	let yamlInput = $state('');
	let highlightedJson = $state('');
	let highlightedYaml = $state('');
	let error = $state('');
	let errorLine = $state<number | undefined>(undefined);
	let errorColumn = $state<number | undefined>(undefined);
	let indentSize = $state(2);
	let sortKeys = $state(false);
	let copyJsonSuccess = $state(false);
	let copyYamlSuccess = $state(false);

	function updateJsonHighlighting() {
		if (jsonInput && typeof Prism !== 'undefined') {
			highlightedJson = Prism.highlight(jsonInput, Prism.languages.json, 'json');
		} else {
			highlightedJson = '';
		}
	}

	function updateYamlHighlighting() {
		if (yamlInput && typeof Prism !== 'undefined') {
			highlightedYaml = Prism.highlight(yamlInput, Prism.languages.yaml, 'yaml');
		} else {
			highlightedYaml = '';
		}
	}

	function handleJsonToYaml() {
		error = '';
		errorLine = undefined;
		errorColumn = undefined;

		const result = jsonToYaml(jsonInput, {
			indent: indentSize,
			sortKeys: sortKeys
		});

		if (result.success && result.data) {
			yamlInput = result.data;
			updateYamlHighlighting();
		} else {
			error = result.error || 'Failed to convert JSON to YAML';
			errorLine = result.line;
			errorColumn = result.column;
		}
	}

	function handleYamlToJson() {
		error = '';
		errorLine = undefined;
		errorColumn = undefined;

		const result = yamlToJson(yamlInput, indentSize);

		if (result.success && result.data) {
			jsonInput = result.data;
			updateJsonHighlighting();
		} else {
			error = result.error || 'Failed to convert YAML to JSON';
			errorLine = result.line;
			errorColumn = result.column;
		}
	}

	async function handleCopyJson() {
		if (!jsonInput) return;
		const success = await copyToClipboard(jsonInput);
		if (success) {
			copyJsonSuccess = true;
			setTimeout(() => {
				copyJsonSuccess = false;
			}, 2000);
		}
	}

	async function handleCopyYaml() {
		if (!yamlInput) return;
		const success = await copyToClipboard(yamlInput);
		if (success) {
			copyYamlSuccess = true;
			setTimeout(() => {
				copyYamlSuccess = false;
			}, 2000);
		}
	}

	function handleClear() {
		jsonInput = '';
		yamlInput = '';
		highlightedJson = '';
		highlightedYaml = '';
		error = '';
		errorLine = undefined;
		errorColumn = undefined;
		copyJsonSuccess = false;
		copyYamlSuccess = false;
	}

	function loadSample() {
		jsonInput = JSON.stringify(
			{
				name: 'Lakitu.dev',
				description: 'Developer utility tools',
				features: ['Base64 encoding', 'JSON formatting', 'YAML conversion'],
				settings: {
					darkMode: true,
					indentSize: 2
				},
				version: 1.0,
				active: true
			},
			null,
			indentSize
		);
		updateJsonHighlighting();
		error = '';
		errorLine = undefined;
		errorColumn = undefined;
	}
</script>

<svelte:head>
	<title>JSON to YAML Converter - Lakitu.dev</title>
	<meta
		name="description"
		content="Free online JSON to YAML converter and YAML to JSON converter with syntax highlighting, validation, and error detection."
	/>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">JSON to YAML Converter</h1>
		<p class="text-base-content/70">
			Convert between JSON and YAML formats with syntax highlighting and detailed error messages.
		</p>
	</header>

	<!-- Error Alert -->
	{#if error}
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
			<div>
				<span class="font-semibold">Conversion Error</span>
				<span class="block text-sm">{error}</span>
				{#if errorLine !== undefined}
					<span class="block text-sm">
						Line {errorLine}{#if errorColumn !== undefined}, Column {errorColumn}{/if}
					</span>
				{/if}
			</div>
			<button
				class="btn btn-sm btn-ghost"
				onclick={() => {
					error = '';
					errorLine = undefined;
					errorColumn = undefined;
				}}
				aria-label="Dismiss error"
			>
				&times;
			</button>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- JSON Section -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">
				JSON <span class="font-normal text-base-content/50">{jsonInput.length} characters</span>
			</legend>
			{#if highlightedJson}
				<pre
					class="h-96 overflow-auto rounded-lg border border-base-300 bg-base-200 p-4 font-mono text-sm"><code
						class="language-json">{@html highlightedJson}</code
					></pre>
				<div class="mt-2 flex gap-2">
					<button
						class="btn btn-sm btn-ghost"
						onclick={() => {
							highlightedJson = '';
						}}
					>
						Edit
					</button>
					<button class="btn btn-sm btn-outline" onclick={handleCopyJson} disabled={!jsonInput}>
						{#if copyJsonSuccess}
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
							Copy JSON
						{/if}
					</button>
				</div>
			{:else}
				<textarea
					id="json-input"
					class="textarea textarea-bordered h-96 font-mono text-sm w-full"
					placeholder={'Enter JSON here, e.g. {"key": "value"}'}
					bind:value={jsonInput}
				></textarea>
				<div class="mt-2 flex gap-2">
					<button class="btn btn-sm btn-outline" onclick={handleCopyJson} disabled={!jsonInput}>
						{#if copyJsonSuccess}
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
							Copy JSON
						{/if}
					</button>
				</div>
			{/if}
		</fieldset>

		<!-- YAML Section -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">
				YAML <span class="font-normal text-base-content/50">{yamlInput.length} characters</span>
			</legend>
			{#if highlightedYaml}
				<pre
					class="h-96 overflow-auto rounded-lg border border-base-300 bg-base-200 p-4 font-mono text-sm"><code
						class="language-yaml">{@html highlightedYaml}</code
					></pre>
				<div class="mt-2 flex gap-2">
					<button
						class="btn btn-sm btn-ghost"
						onclick={() => {
							highlightedYaml = '';
						}}
					>
						Edit
					</button>
					<button class="btn btn-sm btn-outline" onclick={handleCopyYaml} disabled={!yamlInput}>
						{#if copyYamlSuccess}
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
							Copy YAML
						{/if}
					</button>
				</div>
			{:else}
				<textarea
					id="yaml-input"
					class="textarea textarea-bordered h-96 font-mono text-sm w-full"
					placeholder="Enter YAML here, e.g. key: value"
					bind:value={yamlInput}
				></textarea>
				<div class="mt-2 flex gap-2">
					<button class="btn btn-sm btn-outline" onclick={handleCopyYaml} disabled={!yamlInput}>
						{#if copyYamlSuccess}
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
							Copy YAML
						{/if}
					</button>
				</div>
			{/if}
		</fieldset>
	</div>

	<!-- Conversion Buttons -->
	<div class="flex flex-wrap gap-3 mt-6 justify-center">
		<button class="btn btn-primary" onclick={handleJsonToYaml} disabled={!jsonInput}>
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
					d="M17 8l4 4m0 0l-4 4m4-4H3"
				/>
			</svg>
			JSON to YAML
		</button>
		<button class="btn btn-primary" onclick={handleYamlToJson} disabled={!yamlInput}>
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
					d="M7 16l-4-4m0 0l4-4m-4 4h18"
				/>
			</svg>
			YAML to JSON
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

	<!-- Options Bar -->
	<div class="flex flex-wrap items-center gap-4 mt-6 p-4 bg-base-200 rounded-lg justify-center">
		<label class="select">
			<span class="label">Indent:</span>
			<select bind:value={indentSize}>
				<option value={2}>2 spaces</option>
				<option value={4}>4 spaces</option>
			</select>
		</label>

		<label class="flex items-center gap-2 cursor-pointer">
			<input type="checkbox" class="checkbox checkbox-sm" bind:checked={sortKeys} />
			<span class="text-sm">Sort keys</span>
		</label>

		<button class="btn btn-sm btn-ghost" onclick={loadSample}> Load sample </button>
	</div>

	<!-- Info Section -->
	<section class="mt-12 prose prose-sm max-w-none">
		<h2 class="text-xl font-semibold mb-4">About JSON and YAML</h2>
		<p class="text-base-content/70">
			JSON (JavaScript Object Notation) and YAML (YAML Ain't Markup Language) are both popular data
			serialization formats. JSON is widely used for APIs and configuration, while YAML is often
			preferred for configuration files due to its human-readable syntax.
		</p>
		<h3 class="text-lg font-semibold mt-4 mb-2">Features</h3>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li>Bidirectional conversion between JSON and YAML</li>
			<li>Configurable indentation (2 or 4 spaces)</li>
			<li>Optional alphabetical key sorting</li>
			<li>Detailed error messages with line and column numbers</li>
			<li>Client-side processing - your data never leaves your browser</li>
		</ul>
		<h3 class="text-lg font-semibold mt-4 mb-2">JSON vs YAML</h3>
		<div class="overflow-x-auto">
			<table class="table table-zebra">
				<thead>
					<tr>
						<th>Feature</th>
						<th>JSON</th>
						<th>YAML</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Syntax</td>
						<td>Braces and brackets</td>
						<td>Indentation-based</td>
					</tr>
					<tr>
						<td>Comments</td>
						<td>Not supported</td>
						<td>Supported (#)</td>
					</tr>
					<tr>
						<td>Readability</td>
						<td>Good</td>
						<td>Excellent</td>
					</tr>
					<tr>
						<td>Common use</td>
						<td>APIs, web services</td>
						<td>Config files, DevOps</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
