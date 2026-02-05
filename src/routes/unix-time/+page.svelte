<script lang="ts">
	import { onMount } from 'svelte';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import {
		COMMON_TIMEZONES,
		detectTimestampUnit,
		timestampToDate,
		dateToTimestampSeconds,
		dateToTimestampMilliseconds,
		formatISO8601,
		formatRFC2822,
		formatLocal,
		getRelativeTime,
		isValidTimestamp,
		getCurrentTimestampSeconds,
		dateToDatetimeLocalValue,
		datetimeLocalValueToDate,
		getLocalTimezone,
		getTimezoneOffset
	} from '$lib/utils/unix-time';

	// Input state
	let timestampInput = $state('');
	let datetimeInput = $state('');
	let selectedTimezone = $state('UTC');
	let localTimezone = $state('UTC');

	// Output state
	let resultDate: Date | null = $state(null);
	let error = $state('');
	let copiedField = $state('');

	// Current time display
	let currentTimestamp = $state(0);
	let currentTimeInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		localTimezone = getLocalTimezone();
		// Update current time every second
		currentTimestamp = getCurrentTimestampSeconds();
		currentTimeInterval = setInterval(() => {
			currentTimestamp = getCurrentTimestampSeconds();
		}, 1000);

		return () => {
			if (currentTimeInterval) {
				clearInterval(currentTimeInterval);
			}
		};
	});

	function handleTimestampInput() {
		error = '';
		if (!timestampInput.trim()) {
			resultDate = null;
			return;
		}

		if (!isValidTimestamp(timestampInput)) {
			error = 'Invalid timestamp. Please enter a valid Unix timestamp.';
			resultDate = null;
			return;
		}

		const num = Number(timestampInput);
		resultDate = timestampToDate(num);
		// Update datetime input to match
		datetimeInput = dateToDatetimeLocalValue(resultDate, selectedTimezone);
	}

	function handleDatetimeInput() {
		error = '';
		if (!datetimeInput) {
			resultDate = null;
			return;
		}

		try {
			resultDate = datetimeLocalValueToDate(datetimeInput, selectedTimezone);
			// Update timestamp input to match
			timestampInput = dateToTimestampSeconds(resultDate).toString();
		} catch {
			error = 'Invalid date/time format.';
			resultDate = null;
		}
	}

	function handleTimezoneChange() {
		// Recalculate if we have a result
		if (resultDate && datetimeInput) {
			// Update the datetime display for the new timezone
			datetimeInput = dateToDatetimeLocalValue(resultDate, selectedTimezone);
		}
	}

	function handleNow() {
		const now = new Date();
		resultDate = now;
		timestampInput = dateToTimestampSeconds(now).toString();
		datetimeInput = dateToDatetimeLocalValue(now, selectedTimezone);
		error = '';
	}

	function handleClear() {
		timestampInput = '';
		datetimeInput = '';
		resultDate = null;
		error = '';
		copiedField = '';
	}

	async function handleCopy(value: string, fieldName: string) {
		if (!value) return;
		const success = await copyToClipboard(value);
		if (success) {
			copiedField = fieldName;
			setTimeout(() => {
				copiedField = '';
			}, 2000);
		}
	}

	// Computed values
	let detectedUnit = $derived(
		timestampInput ? detectTimestampUnit(Number(timestampInput)) : null
	);
	let timestampSeconds = $derived(resultDate ? dateToTimestampSeconds(resultDate) : null);
	let timestampMilliseconds = $derived(
		resultDate ? dateToTimestampMilliseconds(resultDate) : null
	);
	let iso8601 = $derived(resultDate ? formatISO8601(resultDate, 'UTC') : null);
	let rfc2822 = $derived(resultDate ? formatRFC2822(resultDate, selectedTimezone) : null);
	let localFormat = $derived(resultDate ? formatLocal(resultDate, selectedTimezone) : null);
	let relativeTime = $derived(resultDate ? getRelativeTime(resultDate) : null);
	let timezoneOffset = $derived(
		resultDate ? getTimezoneOffset(resultDate, selectedTimezone) : null
	);
</script>

<svelte:head>
	<title>Unix Time Converter - Lakitu.dev</title>
	<meta
		name="description"
		content="Free online Unix timestamp converter. Convert Unix timestamps to human-readable dates and vice versa. Supports seconds, milliseconds, multiple timezones, and various date formats."
	/>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Unix Time Converter</h1>
		<p class="text-base-content/70">
			Convert Unix timestamps to human-readable dates and vice versa. Supports seconds and
			milliseconds with automatic detection.
		</p>
	</header>

	<!-- Current Time Display -->
	<div class="alert alert-info mb-6">
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
				d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<div>
			<span class="font-medium">Current Unix Time:</span>
			<code class="ml-2 font-mono">{currentTimestamp}</code>
			<span class="text-sm opacity-70 ml-2">({localTimezone})</span>
		</div>
		<button
			class="btn btn-sm btn-ghost"
			onclick={() => handleCopy(currentTimestamp.toString(), 'current')}
		>
			{copiedField === 'current' ? 'Copied!' : 'Copy'}
		</button>
	</div>

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
			<span>{error}</span>
			<button class="btn btn-sm btn-ghost" onclick={() => (error = '')} aria-label="Dismiss error">
				&times;
			</button>
		</div>
	{/if}

	<!-- Input Section -->
	<div class="card bg-base-200 mb-6">
		<div class="card-body">
			<h2 class="card-title text-lg">Input</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Timestamp Input -->
				<fieldset class="fieldset">
					<legend class="fieldset-legend">
						Unix Timestamp
						{#if detectedUnit}
							<span class="badge badge-sm badge-primary ml-2">{detectedUnit}</span>
						{/if}
					</legend>
					<input
						type="text"
						class="input input-bordered w-full font-mono"
						placeholder="e.g., 1704067200 or 1704067200000"
						bind:value={timestampInput}
						oninput={handleTimestampInput}
					/>
				</fieldset>

				<!-- Date/Time Input -->
				<fieldset class="fieldset">
					<legend class="fieldset-legend">Date & Time</legend>
					<input
						type="datetime-local"
						class="input input-bordered w-full"
						step="1"
						bind:value={datetimeInput}
						oninput={handleDatetimeInput}
					/>
				</fieldset>
			</div>

			<!-- Timezone Selector -->
			<div class="mt-4">
				<fieldset class="fieldset">
					<legend class="fieldset-legend">Timezone</legend>
					<select
						class="select select-bordered w-full max-w-xs"
						bind:value={selectedTimezone}
						onchange={handleTimezoneChange}
					>
						<option value={localTimezone}>Local ({localTimezone})</option>
						{#each COMMON_TIMEZONES as tz}
							{#if tz.value !== localTimezone}
								<option value={tz.value}>{tz.label}</option>
							{/if}
						{/each}
					</select>
				</fieldset>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-wrap gap-3 mt-4">
				<button class="btn btn-primary" onclick={handleNow}>
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
					Now
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
	</div>

	<!-- Output Section -->
	{#if resultDate}
		<div class="card bg-base-200">
			<div class="card-body">
				<h2 class="card-title text-lg">
					Converted Date
					{#if relativeTime}
						<span class="badge badge-secondary ml-2">{relativeTime}</span>
					{/if}
				</h2>

				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<tbody>
							<!-- Unix Timestamp (seconds) -->
							<tr>
								<td class="font-medium w-40">Unix (seconds)</td>
								<td class="font-mono">{timestampSeconds}</td>
								<td class="text-right">
									<button
										class="btn btn-sm btn-ghost"
										onclick={() => handleCopy(timestampSeconds?.toString() || '', 'seconds')}
									>
										{copiedField === 'seconds' ? 'Copied!' : 'Copy'}
									</button>
								</td>
							</tr>

							<!-- Unix Timestamp (milliseconds) -->
							<tr>
								<td class="font-medium">Unix (milliseconds)</td>
								<td class="font-mono">{timestampMilliseconds}</td>
								<td class="text-right">
									<button
										class="btn btn-sm btn-ghost"
										onclick={() => handleCopy(timestampMilliseconds?.toString() || '', 'ms')}
									>
										{copiedField === 'ms' ? 'Copied!' : 'Copy'}
									</button>
								</td>
							</tr>

							<!-- ISO 8601 -->
							<tr>
								<td class="font-medium">ISO 8601 (UTC)</td>
								<td class="font-mono">{iso8601}</td>
								<td class="text-right">
									<button
										class="btn btn-sm btn-ghost"
										onclick={() => handleCopy(iso8601 || '', 'iso')}
									>
										{copiedField === 'iso' ? 'Copied!' : 'Copy'}
									</button>
								</td>
							</tr>

							<!-- RFC 2822 -->
							<tr>
								<td class="font-medium">RFC 2822</td>
								<td class="font-mono text-sm">{rfc2822}</td>
								<td class="text-right">
									<button
										class="btn btn-sm btn-ghost"
										onclick={() => handleCopy(rfc2822 || '', 'rfc')}
									>
										{copiedField === 'rfc' ? 'Copied!' : 'Copy'}
									</button>
								</td>
							</tr>

							<!-- Local Format -->
							<tr>
								<td class="font-medium">Local Format</td>
								<td>{localFormat}</td>
								<td class="text-right">
									<button
										class="btn btn-sm btn-ghost"
										onclick={() => handleCopy(localFormat || '', 'local')}
									>
										{copiedField === 'local' ? 'Copied!' : 'Copy'}
									</button>
								</td>
							</tr>

							<!-- Timezone Offset -->
							<tr>
								<td class="font-medium">Timezone Offset</td>
								<td class="font-mono">GMT{timezoneOffset}</td>
								<td class="text-right">
									<button
										class="btn btn-sm btn-ghost"
										onclick={() => handleCopy(`GMT${timezoneOffset}`, 'offset')}
									>
										{copiedField === 'offset' ? 'Copied!' : 'Copy'}
									</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick Reference -->
	<section class="mt-12 prose prose-sm max-w-none">
		<h2 class="text-xl font-semibold mb-4">About Unix Time</h2>
		<p class="text-base-content/70">
			Unix time (also known as POSIX time or Epoch time) is a system for describing points in time,
			defined as the number of seconds that have elapsed since 00:00:00 UTC on January 1, 1970
			(the Unix epoch), not counting leap seconds.
		</p>

		<h3 class="text-lg font-semibold mt-4 mb-2">Quick Reference</h3>
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Time Unit</th>
						<th>Seconds</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>1 minute</td>
						<td class="font-mono">60</td>
					</tr>
					<tr>
						<td>1 hour</td>
						<td class="font-mono">3,600</td>
					</tr>
					<tr>
						<td>1 day</td>
						<td class="font-mono">86,400</td>
					</tr>
					<tr>
						<td>1 week</td>
						<td class="font-mono">604,800</td>
					</tr>
					<tr>
						<td>1 year (365 days)</td>
						<td class="font-mono">31,536,000</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3 class="text-lg font-semibold mt-4 mb-2">Features</h3>
		<ul class="list-disc list-inside text-base-content/70 space-y-1">
			<li>Auto-detects seconds vs milliseconds based on timestamp magnitude</li>
			<li>Supports multiple timezone conversions</li>
			<li>Shows relative time (e.g., "3 days ago")</li>
			<li>Multiple output formats: ISO 8601, RFC 2822, and locale-specific</li>
			<li>Client-side processing - your data never leaves your browser</li>
		</ul>
	</section>
</div>
