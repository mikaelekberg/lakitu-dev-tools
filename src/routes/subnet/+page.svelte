<script lang="ts">
	import {
		parseCIDR,
		ipToString,
		calculateTotalHosts,
		splitBlock,
		makeBlock,
		mergePair,
		DISPLAY_LIMIT,
		type ParsedCIDR,
		type SubnetBlock
	} from '$lib/utils/subnet';
	import { Split, Merge } from 'lucide-svelte';

	let input = $state('');
	let result = $state<ParsedCIDR | null>(null);
	let error = $state<string | null>(null);

	function handleCalculate() {
		error = null;
		result = null;

		const trimmed = input.trim();
		if (!trimmed) {
			error = 'Please enter a CIDR notation.';
			return;
		}

		const parsed = parseCIDR(trimmed);
		if (!parsed) {
			error = 'Invalid CIDR notation. Please enter a valid CIDR (e.g., 10.0.0.0/24).';
			return;
		}

		result = parsed;
	}

	function handleClear() {
		input = '';
		result = null;
		error = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleCalculate();
		}
	}

	function getUsableIpRange(parsed: ParsedCIDR): string {
		if (parsed.prefix === 32) {
			return ipToString(parsed.network);
		}
		if (parsed.prefix === 31) {
			return `${ipToString(parsed.network)} - ${ipToString(parsed.broadcast)}`;
		}
		const first = ipToString(parsed.network + 1);
		const last = ipToString(parsed.broadcast - 1);
		return `${first} - ${last}`;
	}

	// Tab state
	let activeTab = $state<'single' | 'partition'>('single');

	// Partition tab state
	let supernetIp = $state('10.0.0.0');
	let supernetPrefix = $state(22);
	let supernet = $state<ParsedCIDR | null>(null);
	let blocks = $state<SubnetBlock[]>([]);
	let partitionError = $state<string | null>(null);
	let partitionWarning = $state<string | null>(null);

	const supernetTotalHosts = $derived(calculateTotalHosts(supernetPrefix));

	// Split options for a block: 2, 4, 8, 16 sub-blocks (prefix+1 .. +4), capped
	// by /32 and the display limit. Returns [{targetPrefix, count, label}].
	function splitOptions(block: SubnetBlock): { targetPrefix: number; count: number }[] {
		const opts: { targetPrefix: number; count: number }[] = [];
		const room = blocks.length - 1; // removing the parent frees one slot
		for (let step = 1; step <= 4; step++) {
			const targetPrefix = block.prefix + step;
			if (targetPrefix > 32) break;
			const count = 2 ** step;
			if (room + count > DISPLAY_LIMIT) break;
			opts.push({ targetPrefix, count });
		}
		return opts;
	}

	// Finds a mergeable neighbor for the block at index i (forward first, then
	// backward). Returns the neighbor index, or -1 if none.
	function mergeNeighbor(i: number): number {
		const block = blocks[i];
		if (block.prefix === 0) return -1;
		const childSize = 2 ** (32 - block.prefix);
		const mergedSize = childSize * 2;

		const next = blocks[i + 1];
		if (
			next &&
			next.prefix === block.prefix &&
			block.network % mergedSize === 0 &&
			next.network - block.network === childSize
		) {
			return i + 1;
		}

		const prev = blocks[i - 1];
		if (
			prev &&
			prev.prefix === block.prefix &&
			prev.network % mergedSize === 0 &&
			block.network - prev.network === childSize
		) {
			return i - 1;
		}

		return -1;
	}

	function handleLoad() {
		partitionError = null;
		partitionWarning = null;

		const trimmed = supernetIp.trim();
		if (!trimmed) {
			partitionError = 'Please enter a supernet IP.';
			return;
		}

		if (supernetPrefix < 0 || supernetPrefix > 32) {
			partitionError = `Supernet prefix /${supernetPrefix} is out of range (must be 0-32).`;
			return;
		}

		const fullCidr = `${trimmed}/${supernetPrefix}`;
		const parsed = parseCIDR(fullCidr);
		if (!parsed) {
			partitionError = `Invalid CIDR notation: ${fullCidr}`;
			return;
		}

		supernet = parsed;
		blocks = [makeBlock(parsed.network, parsed.prefix, parsed.prefix)];
	}

	function handleSplit(index: number, targetPrefix: number) {
		partitionError = null;
		partitionWarning = null;

		const parent = blocks[index];
		if (targetPrefix <= parent.prefix || targetPrefix > 32) return;

		const newCount = 2 ** (targetPrefix - parent.prefix);
		const totalAfter = blocks.length - 1 + newCount;
		if (totalAfter > DISPLAY_LIMIT) {
			partitionWarning = `Cannot split: would create ${totalAfter.toLocaleString()} blocks, exceeding the ${DISPLAY_LIMIT} display limit.`;
			return;
		}

		const sp = parent.supernetPrefix;
		const result = splitBlock(parent.network, parent.prefix, targetPrefix, sp);
		if (result.error) {
			partitionError = result.error;
			return;
		}

		if (parent.note) result.blocks[0].note = parent.note;

		blocks = [...blocks.slice(0, index), ...result.blocks, ...blocks.slice(index + 1)];

		// Close the split dropdown (focus-based) after an action.
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
	}

	function handleMerge(index: number) {
		partitionError = null;
		partitionWarning = null;

		const neighborIdx = mergeNeighbor(index);
		if (neighborIdx < 0) return;

		const merged = mergePair(blocks[index], blocks[neighborIdx]);
		if (!merged) {
			partitionWarning = 'Cannot merge: blocks are not aligned to a power-of-2 boundary.';
			return;
		}

		const firstIdx = Math.min(index, neighborIdx);
		const lastIdx = Math.max(index, neighborIdx);
		blocks = [...blocks.slice(0, firstIdx), merged, ...blocks.slice(lastIdx + 1)];
	}

	function handleNoteChange(index: number, note: string) {
		blocks = blocks.map((b, i) => (i === index ? { ...b, note } : b));
	}

	function handlePartitionClear() {
		supernetIp = '10.0.0.0';
		supernetPrefix = 22;
		supernet = null;
		blocks = [];
		partitionError = null;
		partitionWarning = null;
	}

	function handlePartitionKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleLoad();
		}
	}

	// Size of a block as a percentage of the supernet (for the proportional bar).
	function sizePct(block: SubnetBlock): number {
		if (!supernet) return 100;
		const total = calculateTotalHosts(supernet.prefix);
		return Math.max((block.totalHosts / total) * 100, 0.5);
	}

	// Summary: blocks grouped by prefix, in ascending prefix (largest size) order.
	const summary = $derived.by(() => {
		const acc: { prefix: number; count: number }[] = [];
		for (const b of blocks) {
			const existing = acc.find((x) => x.prefix === b.prefix);
			if (existing) existing.count += 1;
			else acc.push({ prefix: b.prefix, count: 1 });
		}
		return acc.sort((a, b) => a.prefix - b.prefix);
	});

	const allocatedHosts = $derived(blocks.reduce((sum, b) => sum + b.totalHosts, 0));
</script>

<svelte:head>
	<title>Visual Subnet Calculator - Lakitu.dev</title>
	<meta
		name="description"
		content="Calculate subnet details from CIDR notation. Get network address, broadcast address, usable IP range, netmask, wildcard mask, total hosts, and usable hosts. Free, client-side tool."
	/>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<header class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Visual Subnet Calculator</h1>
		<p class="text-base-content/70">
			Enter a CIDR notation to calculate detailed subnet information, including network address,
			broadcast address, usable IP range, and more.
		</p>
	</header>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-box mb-6">
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'single'}
			onclick={() => (activeTab = 'single')}
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
					d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
				/>
			</svg>
			Single Subnet
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'partition'}
			onclick={() => (activeTab = 'partition')}
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
					d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
				/>
			</svg>
			Partition Subnet
		</button>
	</div>

	{#if activeTab === 'single'}
		<!-- Input Section -->
		<div class="card bg-base-200 mb-6">
			<div class="card-body">
				<fieldset class="fieldset">
					<legend class="fieldset-legend">CIDR Notation</legend>
					<input
						type="text"
						class="input input-bordered w-full font-mono"
						placeholder="10.0.0.0/24"
						bind:value={input}
						onkeydown={handleKeydown}
					/>
				</fieldset>

				<div class="flex flex-wrap gap-3 mt-4">
					<button class="btn btn-primary" onclick={handleCalculate}>
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
						Calculate
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
			</div>
		{/if}

		<!-- Results Section -->
		{#if result}
			<div class="card bg-base-200 mb-6">
				<div class="card-body">
					<h2 class="card-title text-xl mb-4">Subnet Details</h2>

					<div class="overflow-x-auto">
						<table class="table table-sm">
							<tbody>
								<tr>
									<td class="font-medium w-48">CIDR Notation</td>
									<td class="font-mono">{result.cidrStr}</td>
								</tr>
								<tr>
									<td class="font-medium">Network Address</td>
									<td class="font-mono">{ipToString(result.network)}</td>
								</tr>
								<tr>
									<td class="font-medium">Broadcast Address</td>
									<td class="font-mono">{ipToString(result.broadcast)}</td>
								</tr>
								<tr>
									<td class="font-medium">Usable IP Range</td>
									<td class="font-mono">{getUsableIpRange(result)}</td>
								</tr>
								<tr>
									<td class="font-medium">Netmask</td>
									<td class="font-mono">{ipToString(result.netmask)}</td>
								</tr>
								<tr>
									<td class="font-medium">Wildcard Mask</td>
									<td class="font-mono">{ipToString(result.wildcard)}</td>
								</tr>
								<tr>
									<td class="font-medium">Total Hosts</td>
									<td class="font-mono">{calculateTotalHosts(result.prefix).toLocaleString()}</td>
								</tr>
								<tr>
									<td class="font-medium">Usable Hosts</td>
									<td class="font-mono">{result.hosts.toLocaleString()}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- Info Section -->
			<section class="mt-12 prose prose-sm max-w-none">
				<h2 class="text-xl font-semibold mb-4">About Subnet Calculator</h2>
				<p class="text-base-content/70">
					A subnet calculator helps network administrators and DevOps engineers quickly determine
					network boundaries, usable host ranges, and subnet masks from CIDR notation. All
					calculations are performed client-side - no data is sent to any server.
				</p>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 not-prose">
					<div class="card bg-base-200">
						<div class="card-body">
							<h3 class="card-title text-base">CIDR Notation</h3>
							<p class="text-sm text-base-content/70">
								Classless Inter-Domain Routing (CIDR) uses a prefix length to specify the network
								mask. E.g., <code class="text-xs">/24</code> means 24 bits for the network portion.
							</p>
						</div>
					</div>
					<div class="card bg-base-200">
						<div class="card-body">
							<h3 class="card-title text-base">Special Prefixes</h3>
							<p class="text-sm text-base-content/70">
								<code class="text-xs">/31</code> subnets (RFC 3021) have 2 usable addresses for
								point-to-point links. <code class="text-xs">/32</code> has 1 usable address for single-host
								networks.
							</p>
						</div>
					</div>
					<div class="card bg-base-200">
						<div class="card-body">
							<h3 class="card-title text-base">Usable vs Total</h3>
							<p class="text-sm text-base-content/70">
								Total hosts include the network and broadcast addresses. Usable hosts exclude these
								reserved addresses (except for /31 and /32 subnets).
							</p>
						</div>
					</div>
				</div>
			</section>
		{/if}
	{/if}

	{#if activeTab === 'partition'}
		<!-- Partition Input Section -->
		<div class="card bg-base-200 mb-6">
			<div class="card-body">
				<fieldset class="fieldset">
					<legend class="fieldset-legend">Supernet</legend>
					<div class="flex flex-wrap gap-2 items-center">
						<input
							type="text"
							class="input input-bordered font-mono flex-1 min-w-32"
							placeholder="10.0.0.0"
							bind:value={supernetIp}
							onkeydown={handlePartitionKeydown}
						/>
						<span class="text-base-content/60">/</span>
						<select class="select select-bordered w-24" bind:value={supernetPrefix}>
							{#each Array.from({ length: 33 }, (_, k) => k) as p (p)}
								<option value={p}>/{p}</option>
							{/each}
						</select>
					</div>
				</fieldset>
				<p class="text-xs text-base-content/60 mt-2">
					Load a supernet to start with one block covering the whole range. Then split blocks into
					smaller subnets or merge adjacent same-size blocks back together. Add a note to label any
					block.
				</p>
				<div class="flex flex-wrap gap-3 mt-4">
					<button class="btn btn-primary" onclick={handleLoad}>Load</button>
					<button class="btn btn-ghost" onclick={handlePartitionClear}>Clear</button>
				</div>
			</div>
		</div>

		{#if partitionError}
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
				<span>{partitionError}</span>
			</div>
		{/if}

		{#if partitionWarning}
			<div class="alert alert-warning mb-6" role="alert">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<span>{partitionWarning}</span>
			</div>
		{/if}

		{#if blocks.length > 0 && supernet}
			<!-- Summary -->
			<div class="card bg-base-200 mb-4">
				<div class="card-body !p-4 gap-3">
					<div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
						<span class="font-mono text-sm font-semibold">{supernet.cidrStr}</span>
						<span class="text-xs text-base-content/60">
							{supernetTotalHosts.toLocaleString()} total addresses
						</span>
						<span class="text-xs text-base-content/60">
							{allocatedHosts.toLocaleString()} allocated ·
							{(supernetTotalHosts - allocatedHosts).toLocaleString()} remaining
						</span>
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each summary as s (s.prefix)}
							<span
								class="badge badge-sm font-mono text-xs {s.prefix === supernet.prefix
									? 'badge-ghost'
									: ''}"
							>
								{s.count}× /{s.prefix}
							</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- Block list -->
			<div class="flex flex-col gap-2">
				{#each blocks as block, i (block.cidr + '-' + i)}
					{@const opts = splitOptions(block)}
					{@const neighbor = mergeNeighbor(i)}
					<div
						class="rounded-lg border {block.color
							.border} bg-base-200/40 px-3 py-2 transition-colors hover:bg-base-200"
					>
						<!-- Top row: CIDR + size bar + hosts badge -->
						<div class="flex items-center gap-3">
							<span class="font-mono text-sm font-medium min-w-0 truncate" title={block.cidr}>
								{block.cidr}
							</span>
							<div class="flex-1 min-w-8 h-2.5 rounded-full bg-base-300/60 overflow-hidden">
								<div
									class="h-full rounded-full {block.color.bar}"
									style="width: {sizePct(block)}%"
									title="{block.totalHosts.toLocaleString()} of {supernetTotalHosts.toLocaleString()} addresses ({sizePct(
										block
									)
										.toFixed(1)
										.replace(/\\.0+$/, '')}%)"
								></div>
							</div>
							<span class="badge badge-sm badge-ghost font-mono text-xs whitespace-nowrap">
								{block.usableHosts.toLocaleString()} usable
							</span>
						</div>

						<!-- Metadata row -->
						<div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
							<span class="font-mono text-base-content/70 truncate" title={block.usableRange}>
								<span class="text-base-content/40">range</span>
								{block.usableRange}
							</span>
							<span class="font-mono text-base-content/50">
								<span class="text-base-content/40">bcast</span>
								{block.broadcastAddress}
							</span>
							<span class="font-mono {block.color.text}">
								1/{(supernetTotalHosts / block.totalHosts).toLocaleString()} of supernet
							</span>
						</div>

						<!-- Controls row -->
						<div class="mt-2 flex flex-wrap items-center gap-2">
							<input
								type="text"
								class="input input-xs input-ghost flex-1 min-w-32 text-xs"
								placeholder="add a note…"
								value={block.note}
								oninput={(e) => handleNoteChange(i, e.currentTarget.value)}
							/>
							{#if block.prefix < 32 && opts.length > 0}
								<div class="dropdown dropdown-end">
									<button
										class="btn btn-xs btn-ghost"
										title="Split into smaller subnets"
										tabindex="0"
										onclick={(e) => e.currentTarget.focus()}
									>
										<Split class="h-3.5 w-3.5" />
										Split
									</button>
									<ul
										class="dropdown-content z-10 menu p-1 shadow-lg bg-base-100 rounded-box w-44 mt-1"
									>
										{#each opts as o (o.targetPrefix)}
											<li>
												<button onclick={() => handleSplit(i, o.targetPrefix)}>
													<span class="font-mono">/{o.targetPrefix}</span>
													<span class="text-base-content/50 text-xs">
														({o.count} block{o.count > 1 ? 's' : ''})
													</span>
												</button>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
							{#if neighbor >= 0}
								<button
									class="btn btn-xs btn-ghost"
									title="Merge with {blocks[neighbor].cidr} → /{block.prefix - 1}"
									onclick={() => handleMerge(i)}
								>
									<Merge class="h-3.5 w-3.5" />
									Merge
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else if !partitionError}
			<div class="card bg-base-200">
				<div class="card-body text-center py-12">
					<p class="text-base-content/50">Enter a supernet CIDR and click Load to begin.</p>
				</div>
			</div>
		{/if}
	{/if}
</div>
