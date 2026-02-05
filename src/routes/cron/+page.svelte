<script lang="ts">
	import {
		parseCronExpression,
		buildCronExpression,
		getDefaultFieldValues,
		formatNextRunDate,
		CRON_FIELDS_5,
		CRON_FIELDS_6,
		CRON_EXAMPLES,
		SPECIAL_STRINGS,
		type CronFormat,
		type CronParseResult,
		type FieldValue,
		type FieldValueType
	} from '$lib/utils/cron';
	import { copyToClipboard } from '$lib/utils/clipboard';

	// Tab state
	type Tab = 'parser' | 'builder';
	let activeTab = $state<Tab>('parser');

	// Parser state
	let expression = $state('0 9 * * 1-5');
	let nextRunCount = $state(5);
	let parseResult = $state<CronParseResult | null>(null);
	let copyExpressionSuccess = $state(false);
	let copyDescriptionSuccess = $state(false);

	// Builder state
	let builderFormat = $state<CronFormat>('5-field');
	let fieldValues = $state<FieldValue[]>(getDefaultFieldValues('5-field'));
	let builderExpression = $state('* * * * *');
	let builderParseResult = $state<CronParseResult | null>(null);
	let copyBuilderSuccess = $state(false);

	// Parse expression when it changes
	$effect(() => {
		if (expression.trim()) {
			parseResult = parseCronExpression(expression, { nextRunCount });
		} else {
			parseResult = null;
		}
	});

	// Update builder expression when field values change
	$effect(() => {
		builderExpression = buildCronExpression(fieldValues, builderFormat);
		if (builderExpression.trim()) {
			builderParseResult = parseCronExpression(builderExpression, { nextRunCount: 5 });
		}
	});

	// Update field values when format changes
	function handleFormatChange(format: CronFormat) {
		builderFormat = format;
		fieldValues = getDefaultFieldValues(format);
	}

	// Get the fields for the current builder format
	function getBuilderFields() {
		return builderFormat === '6-field' ? CRON_FIELDS_6 : CRON_FIELDS_5;
	}

	// Update a single field value
	function updateFieldValue(index: number, value: FieldValue) {
		fieldValues = fieldValues.map((v, i) => (i === index ? value : v));
	}

	// Copy handlers
	async function handleCopyExpression() {
		if (!expression) return;
		const success = await copyToClipboard(expression);
		if (success) {
			copyExpressionSuccess = true;
			setTimeout(() => {
				copyExpressionSuccess = false;
			}, 2000);
		}
	}

	async function handleCopyDescription() {
		if (!parseResult?.description) return;
		const success = await copyToClipboard(parseResult.description);
		if (success) {
			copyDescriptionSuccess = true;
			setTimeout(() => {
				copyDescriptionSuccess = false;
			}, 2000);
		}
	}

	async function handleCopyBuilderExpression() {
		if (!builderExpression) return;
		const success = await copyToClipboard(builderExpression);
		if (success) {
			copyBuilderSuccess = true;
			setTimeout(() => {
				copyBuilderSuccess = false;
			}, 2000);
		}
	}

	// Use builder expression in parser
	function useInParser() {
		expression = builderExpression;
		activeTab = 'parser';
	}

	// Load example
	function loadExample(expr: string) {
		expression = expr;
	}

	// Clear parser
	function handleClear() {
		expression = '';
		parseResult = null;
	}
</script>

<svelte:head>
	<title>Cron Expression Parser - Lakitu.dev</title>
	<meta
		name="description"
		content="Parse, validate, and build cron expressions with human-readable explanations. Supports both 5-field and 6-field (with seconds) cron formats. Free online tool."
	/>
</svelte:head>

<div class="max-w-5xl mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Cron Expression Parser</h1>
		<p class="text-base-content/70">
			Parse, validate, and build cron expressions. Get human-readable descriptions and see upcoming
			scheduled runs. Supports 5-field and 6-field (with seconds) formats.
		</p>
	</header>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-box mb-6">
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'parser'}
			onclick={() => (activeTab = 'parser')}
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
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
			Parser
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'builder'}
			onclick={() => (activeTab = 'builder')}
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
					d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
				/>
			</svg>
			Builder
		</button>
	</div>

	<!-- Parser Tab -->
	{#if activeTab === 'parser'}
		<div class="space-y-6">
			<!-- Input Section -->
			<div class="card bg-base-200">
				<div class="card-body">
					<div class="flex flex-col sm:flex-row gap-4">
						<fieldset class="fieldset flex-1">
							<legend class="fieldset-legend">Cron Expression</legend>
							<input
								type="text"
								class="input input-bordered w-full font-mono text-lg"
								placeholder="* * * * * or 0 */5 * * * *"
								bind:value={expression}
							/>
						</fieldset>
						<fieldset class="fieldset w-32">
							<legend class="fieldset-legend">Next Runs</legend>
							<select class="select select-bordered w-full" bind:value={nextRunCount}>
								{#each [1, 3, 5, 10, 15, 20] as count}
									<option value={count}>{count}</option>
								{/each}
							</select>
						</fieldset>
					</div>

					<!-- Quick Examples -->
					<div class="mt-4">
						<span class="text-sm text-base-content/60 mr-2">Try:</span>
						<div class="inline-flex flex-wrap gap-2">
							{#each ['* * * * *', '0 9 * * 1-5', '*/15 * * * *', '0 0 1 * *', '@daily', '@hourly'] as example}
								<button
									class="badge badge-outline cursor-pointer hover:badge-primary"
									onclick={() => loadExample(example)}
								>
									{example}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Validation Status -->
			{#if parseResult}
				{#if parseResult.valid}
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
							<span class="font-semibold">Valid</span>
							<span class="text-sm ml-2">
								({parseResult.format}{parseResult.isSpecialString ? ', special string' : ''})
							</span>
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
						<span>{parseResult.error || 'Invalid cron expression'}</span>
					</div>
				{/if}
			{/if}

			<!-- Description -->
			{#if parseResult?.valid && parseResult.description}
				<fieldset class="fieldset w-full">
					<legend class="fieldset-legend">Human-Readable Description</legend>
					<div class="bg-base-200 rounded-lg p-4 text-lg flex items-center justify-between gap-4">
						<p class="flex-1">{parseResult.description}</p>
						<button
							class="btn btn-sm btn-ghost"
							onclick={handleCopyDescription}
							aria-label="Copy description"
						>
							{#if copyDescriptionSuccess}
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
			{/if}

			<!-- Next Runs -->
			{#if parseResult?.valid && parseResult.nextRuns && parseResult.nextRuns.length > 0}
				<fieldset class="fieldset w-full">
					<legend class="fieldset-legend">
						Next {parseResult.nextRuns.length} Scheduled Run{parseResult.nextRuns.length === 1
							? ''
							: 's'}
					</legend>
					<div class="bg-base-200 rounded-lg p-4">
						<ul class="space-y-2">
							{#each parseResult.nextRuns as run, i}
								{@const formatted = formatNextRunDate(run)}
								<li class="flex items-center gap-3 font-mono text-sm">
									<span class="text-base-content/40 w-6 text-right">{i + 1}.</span>
									<span class="flex-1">{formatted.absolute}</span>
									<span class="text-base-content/60 text-xs">({formatted.relative})</span>
								</li>
							{/each}
						</ul>
					</div>
				</fieldset>
			{:else if parseResult?.valid && parseResult.isSpecialString && expression.toLowerCase() === '@reboot'}
				<div class="alert alert-warning" role="status">
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
					<span>@reboot runs once at system startup and cannot show scheduled future runs.</span>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex flex-wrap gap-3 justify-center">
				<button class="btn btn-outline" onclick={handleCopyExpression} disabled={!expression}>
					{#if copyExpressionSuccess}
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
						Copy Expression
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
		</div>
	{/if}

	<!-- Builder Tab -->
	{#if activeTab === 'builder'}
		<div class="space-y-6">
			<!-- Format Selection -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title text-base mb-4">Cron Format</h3>
					<div class="flex gap-4">
						<label class="label cursor-pointer gap-2">
							<input
								type="radio"
								name="format"
								class="radio radio-primary"
								checked={builderFormat === '5-field'}
								onchange={() => handleFormatChange('5-field')}
							/>
							<span class="label-text">5-field (standard)</span>
							<span class="text-xs text-base-content/50">min hour day month weekday</span>
						</label>
						<label class="label cursor-pointer gap-2">
							<input
								type="radio"
								name="format"
								class="radio radio-primary"
								checked={builderFormat === '6-field'}
								onchange={() => handleFormatChange('6-field')}
							/>
							<span class="label-text">6-field (with seconds)</span>
							<span class="text-xs text-base-content/50">sec min hour day month weekday</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Field Builders -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title text-base mb-4">Configure Fields</h3>
					<div class="space-y-4">
						{#each getBuilderFields() as field, i}
							{@const fieldValue = fieldValues[i] || { type: 'wildcard' }}
							<div class="border border-base-300 rounded-lg p-4">
								<div class="flex flex-wrap items-start gap-4">
									<div class="w-28">
										<span class="font-semibold">{field.label}</span>
										<div class="text-xs text-base-content/50">
											{field.min}-{field.max}
										</div>
									</div>

									<!-- Type Selector -->
									<select
										class="select select-bordered select-sm w-36"
										value={fieldValue.type}
										onchange={(e) => {
											const type = (e.target as HTMLSelectElement).value as FieldValueType;
											updateFieldValue(i, { type });
										}}
									>
										<option value="wildcard">Any (*)</option>
										<option value="specific">Specific value</option>
										<option value="range">Range (x-y)</option>
										<option value="list">List (x,y,z)</option>
										<option value="step">Every N (*/n)</option>
										<option value="rangeStep">Range + Step (x-y/n)</option>
									</select>

									<!-- Value Inputs based on type -->
									{#if fieldValue.type === 'specific'}
										<input
											type="number"
											class="input input-bordered input-sm w-20"
											min={field.min}
											max={field.max}
											value={fieldValue.specific ?? field.min}
											onchange={(e) => {
												updateFieldValue(i, {
													...fieldValue,
													specific: parseInt((e.target as HTMLInputElement).value) || field.min
												});
											}}
										/>
									{:else if fieldValue.type === 'range'}
										<div class="flex items-center gap-2">
											<input
												type="number"
												class="input input-bordered input-sm w-20"
												min={field.min}
												max={field.max}
												placeholder="from"
												value={fieldValue.rangeStart ?? field.min}
												onchange={(e) => {
													updateFieldValue(i, {
														...fieldValue,
														rangeStart: parseInt((e.target as HTMLInputElement).value) || field.min
													});
												}}
											/>
											<span>-</span>
											<input
												type="number"
												class="input input-bordered input-sm w-20"
												min={field.min}
												max={field.max}
												placeholder="to"
												value={fieldValue.rangeEnd ?? field.max}
												onchange={(e) => {
													updateFieldValue(i, {
														...fieldValue,
														rangeEnd: parseInt((e.target as HTMLInputElement).value) || field.max
													});
												}}
											/>
										</div>
									{:else if fieldValue.type === 'list'}
										<input
											type="text"
											class="input input-bordered input-sm w-40"
											placeholder="e.g., 1,3,5"
											value={(fieldValue.listValues ?? []).join(',')}
											onchange={(e) => {
												const values = (e.target as HTMLInputElement).value
													.split(',')
													.map((v) => parseInt(v.trim()))
													.filter((v) => !isNaN(v) && v >= field.min && v <= field.max);
												updateFieldValue(i, {
													...fieldValue,
													listValues: values.length > 0 ? values : [field.min]
												});
											}}
										/>
									{:else if fieldValue.type === 'step'}
										<div class="flex items-center gap-2">
											<span>*/</span>
											<input
												type="number"
												class="input input-bordered input-sm w-20"
												min={1}
												max={field.max}
												value={fieldValue.step ?? 1}
												onchange={(e) => {
													updateFieldValue(i, {
														...fieldValue,
														step: parseInt((e.target as HTMLInputElement).value) || 1
													});
												}}
											/>
										</div>
									{:else if fieldValue.type === 'rangeStep'}
										<div class="flex items-center gap-2">
											<input
												type="number"
												class="input input-bordered input-sm w-16"
												min={field.min}
												max={field.max}
												placeholder="from"
												value={fieldValue.rangeStart ?? field.min}
												onchange={(e) => {
													updateFieldValue(i, {
														...fieldValue,
														rangeStart: parseInt((e.target as HTMLInputElement).value) || field.min
													});
												}}
											/>
											<span>-</span>
											<input
												type="number"
												class="input input-bordered input-sm w-16"
												min={field.min}
												max={field.max}
												placeholder="to"
												value={fieldValue.rangeEnd ?? field.max}
												onchange={(e) => {
													updateFieldValue(i, {
														...fieldValue,
														rangeEnd: parseInt((e.target as HTMLInputElement).value) || field.max
													});
												}}
											/>
											<span>/</span>
											<input
												type="number"
												class="input input-bordered input-sm w-16"
												min={1}
												placeholder="step"
												value={fieldValue.step ?? 1}
												onchange={(e) => {
													updateFieldValue(i, {
														...fieldValue,
														step: parseInt((e.target as HTMLInputElement).value) || 1
													});
												}}
											/>
										</div>
									{/if}

									<!-- Alt labels hint -->
									{#if field.altLabels}
										<div class="text-xs text-base-content/50">
											{field.altLabels.join(', ')}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Generated Expression Preview -->
			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title text-base">Generated Expression</h3>
					<div class="flex items-center gap-4 mt-2">
						<code class="text-xl font-mono bg-base-300 px-4 py-2 rounded-lg flex-1">
							{builderExpression}
						</code>
						<button
							class="btn btn-sm btn-ghost"
							onclick={handleCopyBuilderExpression}
							aria-label="Copy expression"
						>
							{#if copyBuilderSuccess}
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

					{#if builderParseResult?.valid && builderParseResult.description}
						<p class="text-base-content/70 mt-2">{builderParseResult.description}</p>
					{:else if builderParseResult?.error}
						<p class="text-error mt-2">{builderParseResult.error}</p>
					{/if}
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-wrap gap-3 justify-center">
				<button class="btn btn-primary" onclick={useInParser}>
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
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
					Use in Parser
				</button>
				<button
					class="btn btn-ghost"
					onclick={() => {
						fieldValues = getDefaultFieldValues(builderFormat);
					}}
				>
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
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Reset
				</button>
			</div>
		</div>
	{/if}

	<!-- Info Section -->
	<section class="mt-12 prose prose-sm max-w-none">
		<h2 class="text-xl font-semibold mb-4">About Cron Expressions</h2>
		<p class="text-base-content/70">
			Cron expressions are used to schedule recurring tasks in Unix-like operating systems and many
			scheduling systems. They define when a job should run using a compact notation for time
			patterns.
		</p>

		<!-- Field Reference -->
		<h3 class="text-lg font-semibold mt-6 mb-3">Field Reference</h3>
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Field</th>
						<th>Values</th>
						<th>Special Characters</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Second (6-field only)</td>
						<td>0-59</td>
						<td>* , - /</td>
					</tr>
					<tr>
						<td>Minute</td>
						<td>0-59</td>
						<td>* , - /</td>
					</tr>
					<tr>
						<td>Hour</td>
						<td>0-23</td>
						<td>* , - /</td>
					</tr>
					<tr>
						<td>Day of Month</td>
						<td>1-31</td>
						<td>* , - / ? L W</td>
					</tr>
					<tr>
						<td>Month</td>
						<td>1-12 or JAN-DEC</td>
						<td>* , - /</td>
					</tr>
					<tr>
						<td>Day of Week</td>
						<td>0-6 or SUN-SAT</td>
						<td>* , - / ? L #</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Special Characters -->
		<h3 class="text-lg font-semibold mt-6 mb-3">Special Characters</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
			<div class="card bg-base-200 card-compact">
				<div class="card-body">
					<code class="text-lg">*</code>
					<p class="text-sm text-base-content/70">Any value (wildcard)</p>
				</div>
			</div>
			<div class="card bg-base-200 card-compact">
				<div class="card-body">
					<code class="text-lg">,</code>
					<p class="text-sm text-base-content/70">Value list separator (e.g., 1,3,5)</p>
				</div>
			</div>
			<div class="card bg-base-200 card-compact">
				<div class="card-body">
					<code class="text-lg">-</code>
					<p class="text-sm text-base-content/70">Range of values (e.g., 1-5)</p>
				</div>
			</div>
			<div class="card bg-base-200 card-compact">
				<div class="card-body">
					<code class="text-lg">/</code>
					<p class="text-sm text-base-content/70">Step values (e.g., */5 = every 5)</p>
				</div>
			</div>
		</div>

		<!-- Common Examples -->
		<h3 class="text-lg font-semibold mt-6 mb-3">Common Examples</h3>
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Expression</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					{#each CRON_EXAMPLES as example}
						<tr
							class="cursor-pointer hover:bg-base-200"
							onclick={() => {
								loadExample(example.expression);
								activeTab = 'parser';
							}}
						>
							<td><code>{example.expression}</code></td>
							<td>{example.description}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Special Strings -->
		<h3 class="text-lg font-semibold mt-6 mb-3">Special Strings</h3>
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>String</th>
						<th>Equivalent</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					{#each Object.entries(SPECIAL_STRINGS) as [key, value]}
						<tr
							class="cursor-pointer hover:bg-base-200"
							onclick={() => {
								loadExample(key);
								activeTab = 'parser';
							}}
						>
							<td><code>{key}</code></td>
							<td><code>{value.expression || 'N/A'}</code></td>
							<td>{value.description}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Features -->
		<h3 class="text-lg font-semibold mt-6 mb-2">Features</h3>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li>Parse and validate both 5-field and 6-field (with seconds) cron expressions</li>
			<li>Get human-readable descriptions of what the cron schedule means</li>
			<li>View upcoming scheduled run times in your local timezone</li>
			<li>Build expressions interactively with support for wildcards, ranges, lists, and steps</li>
			<li>Support for special strings like @daily, @weekly, @monthly, and more</li>
			<li>Click examples to try them instantly</li>
			<li>Client-side processing - your data never leaves your browser</li>
		</ul>
	</section>
</div>
