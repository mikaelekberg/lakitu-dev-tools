<script lang="ts">
	import {
		parseCIDR,
		ipToString,
		calculateTotalHosts,
		splitBlock,
		getColorForNetwork,
		DISPLAY_LIMIT,
		type ParsedCIDR,
		type SubnetBlock
	} from '$lib/utils/subnet';

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
	let supernetCidr = $state('');
	let blocks = $state<SubnetBlock[]>([]);
	let partitionError = $state<string | null>(null);
	let partitionWarning = $state<string | null>(null);
	let editingNoteIndex = $state<number | null>(null);

	function buildRange(
		prefix: number,
		network: number,
		broadcast: number
	): {
		range: string;
		hosts: number;
	} {
		if (prefix === 32) {
			return { range: ipToString(network), hosts: 1 };
		}
		if (prefix === 31) {
			return { range: `${ipToString(network)} - ${ipToString(broadcast)}`, hosts: 2 };
		}
		return {
			range: `${ipToString(network + 1)} - ${ipToString(broadcast - 1)}`,
			hosts: 2 ** (32 - prefix) - 2
		};
	}

	function handleLoad() {
		partitionError = null;
		partitionWarning = null;
		editingNoteIndex = null;

		const trimmed = supernetCidr.trim();
		if (!trimmed) {
			partitionError = 'Please enter a supernet CIDR.';
			return;
		}

		const parsed = parseCIDR(trimmed);
		if (!parsed) {
			partitionError = 'Invalid CIDR notation. Please enter a valid CIDR (e.g., 10.0.0.0/16).';
			return;
		}

		const blockSize = 2 ** (32 - parsed.prefix);
		const { range, hosts } = buildRange(parsed.prefix, parsed.network, parsed.broadcast);

		blocks = [
			{
				network: parsed.network,
				cidr: parsed.cidrStr,
				networkAddress: ipToString(parsed.network),
				broadcastAddress: ipToString(parsed.broadcast),
				usableRange: range,
				totalHosts: blockSize,
				usableHosts: hosts,
				prefix: parsed.prefix,
				isAllocated: false,
				color: getColorForNetwork(parsed.network, parsed.prefix),
				note: ''
			}
		];
	}

	function handleSplit(index: number, targetPrefix: number) {
		partitionError = null;

		const parent = blocks[index];
		if (targetPrefix <= parent.prefix) {
			partitionError = `Target prefix (/${targetPrefix}) must be larger than /${parent.prefix}.`;
			return;
		}

		const newCount = 2 ** (targetPrefix - parent.prefix);
		const totalAfter = blocks.length - 1 + newCount;
		if (totalAfter > DISPLAY_LIMIT) {
			partitionWarning = `Cannot split: would create ${totalAfter.toLocaleString()} blocks, exceeding the ${DISPLAY_LIMIT} display limit.`;
			return;
		}

		const result = splitBlock(parent.network, parent.prefix, targetPrefix);
		if (result.error) {
			partitionError = result.error;
			return;
		}

		if (parent.note) {
			result.blocks[0].note = parent.note;
		}
		if (parent.isAllocated) {
			for (const b of result.blocks) {
				b.isAllocated = true;
			}
		}

		blocks = [...blocks.slice(0, index), ...result.blocks, ...blocks.slice(index + 1)];
		partitionWarning = null;
	}

	function toggleAllocated(index: number) {
		blocks = blocks.map((b, i) => (i === index ? { ...b, isAllocated: !b.isAllocated } : b));
	}

	function handleNoteChange(index: number, note: string) {
		blocks = blocks.map((b, i) => (i === index ? { ...b, note } : b));
	}

	function handleSelectAll() {
		partitionError = null;
		partitionWarning = null;
		blocks = blocks.map((b) => ({ ...b, isAllocated: true }));
	}

	function handleClearAllocated() {
		partitionError = null;
		partitionWarning = null;
		blocks = blocks.map((b) => ({ ...b, isAllocated: false }));
	}

	function handlePartitionClear() {
		supernetCidr = '';
		blocks = [];
		partitionError = null;
		partitionWarning = null;
		editingNoteIndex = null;
	}

	function handlePartitionKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleLoad();
		}
	}
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
					<legend class="fieldset-legend">Supernet CIDR</legend>
					<input
						type="text"
						class="input input-bordered w-full font-mono"
						placeholder="10.0.0.0/16"
						bind:value={supernetCidr}
						onkeydown={handlePartitionKeydown}
					/>
				</fieldset>
				<p class="text-xs text-base-content/60 mt-2">
					Load a supernet, then split any block into smaller subnets. Add a note to any subnet for
					documentation.
				</p>
				<div class="flex flex-wrap gap-3 mt-4">
					<button class="btn btn-primary" onclick={handleLoad}>
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
						Load
					</button>
					<button class="btn btn-ghost" onclick={handlePartitionClear}>
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

		{#if partitionError}
			<div class="alert alert-error mb-6" role="alert">
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

		{#if blocks.length > 0}
			<div class="flex flex-wrap gap-3 mb-4 items-center">
				<button class="btn btn-sm btn-outline btn-primary" onclick={handleSelectAll}>
					Select All
				</button>
				<button class="btn btn-sm btn-outline btn-ghost" onclick={handleClearAllocated}>
					Clear All
				</button>
				<span class="text-sm text-base-content/70 ml-2">
					{blocks.filter((b) => b.isAllocated).length} of {blocks.length} blocks allocated
				</span>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each blocks as block, i (block.cidr + '-' + i)}
					<div
						class="card card-compact bg-base-200 transition-colors {block.isAllocated
							? 'ring-2 ring-primary'
							: ''}"
					>
						<div class="h-2 rounded-t-box {block.color}"></div>
						<div class="card-body p-3">
							<div class="font-mono text-sm font-medium">{block.cidr}</div>
							<div class="text-xs text-base-content/70">
								{block.usableHosts.toLocaleString()} usable hosts
							</div>
							<div class="text-xs text-base-content/70 truncate">{block.usableRange}</div>

							{#if block.note && editingNoteIndex !== i}
								<div
									class="text-xs text-base-content/60 mt-1 italic border-l-2 border-base-content/20 pl-2"
								>
									"{block.note}"
								</div>
							{/if}

							{#if editingNoteIndex === i}
								<textarea
									class="textarea textarea-bordered textarea-xs w-full mt-2"
									rows="2"
									placeholder="Note for this subnet..."
									value={block.note}
									oninput={(e) => handleNoteChange(i, e.currentTarget.value)}
								></textarea>
							{/if}

							<div class="flex flex-wrap gap-1 mt-2">
								{#if block.prefix < 32}
									<select
										class="select select-xs select-bordered"
										aria-label="Split {block.cidr} into a smaller prefix"
										onchange={(e) => {
											const v = e.currentTarget.value;
											const target = parseInt(v, 10);
											e.currentTarget.value = '';
											if (!isNaN(target) && target > block.prefix) {
												handleSplit(i, target);
											}
										}}
									>
										<option value="">Split to...</option>
										{#each Array.from({ length: 32 - block.prefix }, (_, k) => block.prefix + 1 + k) as targetPrefix}
											<option value={targetPrefix}
												>/{targetPrefix} ({2 ** (32 - targetPrefix)} addrs)</option
											>
										{/each}
									</select>
								{/if}
								<button
									class="btn btn-xs btn-ghost"
									aria-label={editingNoteIndex === i ? 'Close note' : 'Edit note'}
									onclick={() => (editingNoteIndex = editingNoteIndex === i ? null : i)}
								>
									{#if editingNoteIndex === i}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3.5 w-3.5"
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
											class="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									{/if}
								</button>
								<button
									class="btn btn-xs btn-ghost"
									aria-label="Toggle allocated"
									aria-pressed={block.isAllocated}
									onclick={() => toggleAllocated(i)}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3.5 w-3.5"
										fill={block.isAllocated ? 'currentColor' : 'none'}
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
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if !partitionError}
			<div class="card bg-base-200">
				<div class="card-body text-center py-12">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-12 w-12 mx-auto mb-4 text-base-content/30"
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
					<p class="text-base-content/50">Enter a supernet CIDR and click Load to begin.</p>
				</div>
			</div>
		{/if}
	{/if}
</div>
