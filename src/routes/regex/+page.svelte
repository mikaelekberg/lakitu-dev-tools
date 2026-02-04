<script lang="ts">
	import {
		testRegex,
		validatePattern,
		commonPatterns,
		sampleText,
		generateHighlightedHtml,
		formatMatchesForCopy,
		type RegexMatch
	} from '$lib/utils/regex';
	import { copyToClipboard } from '$lib/utils/clipboard';

	// State
	let pattern = $state('');
	let testString = $state(sampleText);
	let error = $state('');
	let copySuccess = $state(false);

	// Regex flags
	let flagGlobal = $state(true);
	let flagCaseInsensitive = $state(false);
	let flagMultiline = $state(false);
	let flagDotAll = $state(false);
	let flagUnicode = $state(false);

	// Computed values
	let flags = $derived(
		(flagGlobal ? 'g' : '') +
			(flagCaseInsensitive ? 'i' : '') +
			(flagMultiline ? 'm' : '') +
			(flagDotAll ? 's' : '') +
			(flagUnicode ? 'u' : '')
	);

	let result = $derived.by(() => {
		if (!pattern.trim()) {
			return { valid: true, matches: [] as RegexMatch[], matchCount: 0 };
		}

		const validation = validatePattern(pattern);
		if (!validation.valid) {
			return { valid: false, error: validation.error, matches: [] as RegexMatch[], matchCount: 0 };
		}

		return testRegex(pattern, flags, testString);
	});

	let highlightedText = $derived(
		result.valid ? generateHighlightedHtml(testString, result.matches) : ''
	);

	// Update error state when result changes
	$effect(() => {
		if (!result.valid && result.error) {
			error = result.error;
		} else {
			error = '';
		}
	});

	// Handlers
	function loadCommonPattern(event: Event) {
		const select = event.target as HTMLSelectElement;
		const selectedPattern = commonPatterns.find((p) => p.name === select.value);
		if (selectedPattern) {
			pattern = selectedPattern.pattern;
			// Set flags from the common pattern
			flagGlobal = selectedPattern.flags.includes('g');
			flagCaseInsensitive = selectedPattern.flags.includes('i');
			flagMultiline = selectedPattern.flags.includes('m');
			flagDotAll = selectedPattern.flags.includes('s');
			flagUnicode = selectedPattern.flags.includes('u');
		}
		// Reset select
		select.value = '';
	}

	function loadSampleText() {
		testString = sampleText;
	}

	async function handleCopy() {
		if (result.matchCount === 0) return;
		const text = formatMatchesForCopy(result.matches);
		const success = await copyToClipboard(text);
		if (success) {
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		}
	}

	function handleClear() {
		pattern = '';
		testString = '';
		error = '';
		copySuccess = false;
		flagGlobal = true;
		flagCaseInsensitive = false;
		flagMultiline = false;
		flagDotAll = false;
		flagUnicode = false;
	}
</script>

<svelte:head>
	<title>Regex Tester - Lakitu.dev</title>
	<meta
		name="description"
		content="Test regular expressions with real-time matching, syntax highlighting, and capture group support. Free online regex tester."
	/>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<!-- Header -->
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Regex Tester</h1>
		<p class="text-base-content/70">
			Test regular expressions with real-time matching and capture group highlighting.
		</p>
	</header>

	<!-- Error Alert -->
	{#if error}
		<div class="alert alert-error mb-6" role="alert">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5 shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<span>Invalid pattern: {error}</span>
			<button class="btn btn-sm btn-ghost" onclick={() => (error = '')} aria-label="Dismiss error"
				>&times;</button
			>
		</div>
	{/if}

	<!-- Pattern Section -->
	<div class="card bg-base-200 mb-6">
		<div class="card-body p-4 md:p-6">
			<div class="flex flex-col md:flex-row md:items-start gap-4">
				<!-- Pattern Input -->
				<div class="flex-1">
					<label for="pattern-input" class="label">
						<span class="label-text font-semibold">Regex Pattern</span>
						<span class="label-text-alt">{pattern.length} chars</span>
					</label>
					<div class="flex gap-2">
						<span class="flex items-center text-base-content/50 font-mono text-lg">/</span>
						<input
							id="pattern-input"
							type="text"
							class="input input-bordered flex-1 font-mono"
							placeholder="Enter regex pattern..."
							bind:value={pattern}
						/>
						<span class="flex items-center text-base-content/50 font-mono text-lg">/{flags}</span>
					</div>
				</div>

				<!-- Common Patterns Dropdown -->
				<div class="md:w-56">
					<label for="common-patterns" class="label">
						<span class="label-text font-semibold">Common Patterns</span>
					</label>
					<select
						id="common-patterns"
						class="select select-bordered w-full"
						onchange={loadCommonPattern}
					>
						<option value="" disabled selected>Select a pattern...</option>
						{#each commonPatterns as cp}
							<option value={cp.name}>{cp.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Flags -->
			<div class="flex flex-wrap gap-4 mt-4">
				<span class="text-sm font-semibold text-base-content/70 self-center">Flags:</span>
				<label class="label cursor-pointer gap-2">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={flagGlobal} />
					<span class="label-text">Global (g)</span>
				</label>
				<label class="label cursor-pointer gap-2">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={flagCaseInsensitive} />
					<span class="label-text">Case insensitive (i)</span>
				</label>
				<label class="label cursor-pointer gap-2">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={flagMultiline} />
					<span class="label-text">Multiline (m)</span>
				</label>
				<label class="label cursor-pointer gap-2">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={flagDotAll} />
					<span class="label-text">DotAll (s)</span>
				</label>
				<label class="label cursor-pointer gap-2">
					<input type="checkbox" class="checkbox checkbox-sm" bind:checked={flagUnicode} />
					<span class="label-text">Unicode (u)</span>
				</label>
			</div>
		</div>
	</div>

	<!-- Test String and Results -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
		<!-- Test String Input -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend flex justify-between w-full">
				<span>Test String</span>
				<span class="text-base-content/50">{testString.length} chars</span>
			</legend>
			<textarea
				class="textarea textarea-bordered h-64 font-mono text-sm w-full resize-none"
				placeholder="Enter text to test against..."
				bind:value={testString}
			></textarea>
			<div class="flex justify-end mt-2">
				<button class="btn btn-sm btn-ghost" onclick={loadSampleText}>Load Sample</button>
			</div>
		</fieldset>

		<!-- Highlighted Results -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend flex justify-between w-full">
				<span>Highlighted Matches</span>
				<span class="text-base-content/50">
					{result.matchCount}
					{result.matchCount === 1 ? 'match' : 'matches'}
				</span>
			</legend>
			<div
				class="bg-base-100 border border-base-300 rounded-lg p-3 h-64 overflow-auto font-mono text-sm whitespace-pre-wrap break-words"
			>
				{#if pattern.trim() && result.valid}
					{@html highlightedText}
				{:else if !pattern.trim()}
					<span class="text-base-content/50">Enter a pattern to see matches...</span>
				{:else}
					<span class="text-error">Invalid pattern</span>
				{/if}
			</div>
		</fieldset>
	</div>

	<!-- Match Details -->
	{#if result.matchCount > 0}
		<div class="card bg-base-200 mb-6">
			<div class="card-body p-4">
				<h3 class="font-semibold mb-3">
					Match Details ({result.matchCount}
					{result.matchCount === 1 ? 'match' : 'matches'})
				</h3>
				<div class="overflow-x-auto max-h-64 overflow-y-auto">
					<table class="table table-sm">
						<thead>
							<tr>
								<th class="w-16">#</th>
								<th>Match</th>
								<th class="w-24">Position</th>
								<th>Capture Groups</th>
							</tr>
						</thead>
						<tbody>
							{#each result.matches as match, i}
								<tr>
									<td class="font-mono text-base-content/70">{i + 1}</td>
									<td class="font-mono">
										<code class="bg-base-300 px-1 rounded break-all">{match.match}</code>
									</td>
									<td class="font-mono text-sm text-base-content/70">{match.start}-{match.end}</td>
									<td class="font-mono text-sm">
										{#if match.groups.length > 0}
											{#each match.groups as group, j}
												<span class="inline-block bg-primary/30 px-1 rounded mr-1 mb-1">
													[{j + 1}] {group}
												</span>
											{/each}
										{:else}
											<span class="text-base-content/50">-</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Action Buttons -->
	<div class="flex flex-wrap gap-3 justify-center mb-8">
		<button
			class="btn btn-outline"
			onclick={handleCopy}
			disabled={result.matchCount === 0}
			aria-label="Copy matches to clipboard"
		>
			{#if copySuccess}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-success"
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
					class="h-5 w-5"
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
				Copy Matches
			{/if}
		</button>
		<button class="btn btn-ghost" onclick={handleClear} aria-label="Clear all fields">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
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
		<h2 class="text-xl font-semibold mb-4">About This Tool</h2>
		<p class="text-base-content/70">
			Test and debug your regular expressions in real-time. Enter a pattern and see matches
			highlighted instantly in your test string.
		</p>

		<h3 class="text-lg font-semibold mt-6 mb-2">Features</h3>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li>Real-time matching as you type</li>
			<li>Support for all JavaScript regex flags (g, i, m, s, u)</li>
			<li>Capture group extraction and display</li>
			<li>Color-coded match highlighting</li>
			<li>Library of common regex patterns</li>
			<li>Copy match results to clipboard</li>
			<li>Client-side processing - your data never leaves your browser</li>
		</ul>

		<h3 class="text-lg font-semibold mt-6 mb-2">Regex Flags Explained</h3>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li><strong>Global (g)</strong> - Find all matches instead of stopping after the first</li>
			<li><strong>Case insensitive (i)</strong> - Match letters regardless of case</li>
			<li><strong>Multiline (m)</strong> - ^ and $ match start/end of each line</li>
			<li><strong>DotAll (s)</strong> - Dot (.) matches newline characters</li>
			<li><strong>Unicode (u)</strong> - Enable Unicode features and strict syntax</li>
		</ul>
	</section>
</div>
