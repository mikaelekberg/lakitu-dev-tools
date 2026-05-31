<script lang="ts">
	import {
		parseCIDR,
		ipToString,
		prefixToNetmask,
		calculateUsableHosts,
		calculateTotalHosts,
		type ParsedCIDR
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
								<td class="font-mono">{result.hosts.toString()}</td>
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
				network boundaries, usable host ranges, and subnet masks from CIDR notation.
				All calculations are performed client-side - no data is sent to any server.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 not-prose">
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">CIDR Notation</h3>
						<p class="text-sm text-base-content/70">
							Classless Inter-Domain Routing (CIDR) uses a prefix length to specify the
							network mask. E.g., <code class="text-xs">/24</code> means 24 bits for the
							network portion.
						</p>
					</div>
				</div>
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">Special Prefixes</h3>
						<p class="text-sm text-base-content/70">
							<code class="text-xs">/31</code> subnets (RFC 3021) have 2 usable addresses
							for point-to-point links. <code class="text-xs">/32</code> has 1 usable
							address for single-host networks.
						</p>
					</div>
				</div>
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-base">Usable vs Total</h3>
						<p class="text-sm text-base-content/70">
							Total hosts include the network and broadcast addresses. Usable hosts exclude
							these reserved addresses (except for /31 and /32 subnets).
						</p>
					</div>
				</div>
			</div>
		</section>
	{/if}
</div>
