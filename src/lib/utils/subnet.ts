/**
 * CIDR / Subnet Calculation Utilities
 *
 * Provides parsing, partitioning, and display helpers
 * for IPv4 CIDR notation and subnet math.
 */

export interface ParsedCIDR {
	ip: number; // IP as 32-bit unsigned int
	prefix: number; // prefix length (0-32)
	netmask: number; // subnet mask as 32-bit int
	wildcard: number; // wildcard mask (inverted netmask)
	network: number; // network address
	broadcast: number; // broadcast address
	hosts: number; // number of usable hosts
	ipStr: string; // original IP string
	cidrStr: string; // normalized CIDR string
}

export interface SubnetPartition {
	cidr: string; // e.g. "10.0.0.0/24"
	networkAddress: string;
	broadcastAddress: string;
	usableRange: string; // e.g. "10.0.1.1 - 10.0.1.254"
	totalHosts: number;
	usableHosts: number;
	isAllocated: boolean; // user-marked as in-use
	color: string; // visual color class
}

export interface SubnetBlock {
	network: number; // 32-bit unsigned network address (for math)
	cidr: string; // e.g. "10.0.0.0/24"
	networkAddress: string;
	broadcastAddress: string;
	usableRange: string;
	totalHosts: number;
	usableHosts: number;
	prefix: number;
	color: SubnetColors;
	note: string;
}

export interface SubnetColors {
	bg: string;
	border: string;
}

export const DISPLAY_LIMIT = 1024;

const SUBNET_BG_COLORS = [
	'bg-primary/30',
	'bg-secondary/30',
	'bg-accent/30',
	'bg-info/30',
	'bg-success/30',
	'bg-warning/30',
	'bg-error/30',
	'bg-neutral/30'
] as const;

const SUBNET_BORDER_COLORS = [
	'border-primary/30',
	'border-secondary/30',
	'border-accent/30',
	'border-info/30',
	'border-success/30',
	'border-warning/30',
	'border-error/30',
	'border-neutral/30'
] as const;

/**
 * Converts a 32-bit unsigned integer to dotted-decimal notation.
 */
export function ipToString(ip: number): string {
	const octet1 = (ip >>> 24) & 0xff;
	const octet2 = (ip >>> 16) & 0xff;
	const octet3 = (ip >>> 8) & 0xff;
	const octet4 = ip & 0xff;
	return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

/**
 * Converts a prefix length (0-32) to a 32-bit subnet mask.
 *
 * Examples:
 *   /24 -> 255.255.255.0  (0xFFFFFF00)
 *   /16 -> 255.255.0.0    (0xFFFF0000)
 *   /32 -> 255.255.255.255
 *   /0  -> 0.0.0.0
 */
export function prefixToNetmask(prefix: number): number {
	if (prefix === 0) return 0;
	return ~(2 ** (32 - prefix) - 1) >>> 0;
}

/**
 * Returns the number of usable host addresses for a given prefix.
 *
 * Special cases:
 *   /31 -> 2 (RFC 3021, both addresses usable)
 *   /32 -> 1 (single-host subnet)
 *   otherwise -> 2^(32-prefix) - 2
 */
export function calculateUsableHosts(prefix: number): number {
	if (prefix === 31) return 2;
	if (prefix === 32) return 1;
	return 2 ** (32 - prefix) - 2;
}

/**
 * Returns the total number of IP addresses in a subnet of the given prefix.
 */
export function calculateTotalHosts(prefix: number): number {
	return 2 ** (32 - prefix);
}

/**
 * Returns a Tailwind background colour class for a subnet at the given index.
 */
export function getSubnetColor(index: number): string {
	return SUBNET_BG_COLORS[index % SUBNET_BG_COLORS.length];
}

/**
 * Returns a stable colour for a block at the given network address and prefix.
 * Color is derived from the block's position within its supernet, so adjacent
 * blocks of equal size always get distinct colors.
 */
export function getColorForNetwork(network: number, prefix: number): SubnetColors {
	const blockIndex = Math.floor(network / 2 ** (32 - prefix));
	const idx = Math.floor(blockIndex / 2) % SUBNET_BG_COLORS.length;
	return { bg: SUBNET_BG_COLORS[idx], border: SUBNET_BORDER_COLORS[idx] };
}

/**
 * Checks whether a string is a valid CIDR notation.
 */
export function isValidCIDR(input: string): boolean {
	return parseCIDR(input) !== null;
}

/**
 * Parses a CIDR string (e.g. "10.0.0.0/16") into its components.
 *
 * Returns null when the input is malformed.
 */
export function parseCIDR(input: string): ParsedCIDR | null {
	const parts = input.split('/');
	if (parts.length !== 2) return null;

	const [ipStr, prefixStr] = parts;

	// Parse prefix length
	const prefix = parseInt(prefixStr, 10);
	if (!/^\d+$/.test(prefixStr) || isNaN(prefix) || prefix < 0 || prefix > 32) return null;

	// Parse the four octets
	const octets = ipStr.split('.');
	if (octets.length !== 4) return null;

	const ipOctets = octets.map((o) => parseInt(o, 10));
	for (const octet of ipOctets) {
		if (isNaN(octet) || octet < 0 || octet > 255) return null;
	}

	// Build 32-bit unsigned IP
	const ip = ((ipOctets[0] << 24) | (ipOctets[1] << 16) | (ipOctets[2] << 8) | ipOctets[3]) >>> 0;

	const netmask = prefixToNetmask(prefix);
	const wildcard = ~netmask >>> 0;
	const network = (ip & netmask) >>> 0;
	const broadcast = (network | wildcard) >>> 0;
	const hosts = calculateUsableHosts(prefix);

	return {
		ip,
		prefix,
		netmask,
		wildcard,
		network,
		broadcast,
		hosts,
		ipStr,
		cidrStr: `${ipToString(network)}/${prefix}`
	};
}

/**
 * Partitions a CIDR supernet into smaller subnets of a given prefix length.
 *
 * @param cidr          - The supernet CIDR (e.g. "10.0.0.0/16")
 * @param targetPrefix  - Desired subnet prefix length (must be >= supernet prefix)
 * @param allocatedIndices - Optional set of subnet indices to mark as allocated
 * @returns An object with an array of subnets and an optional error message
 */
export function partitionSubnet(
	cidr: string,
	targetPrefix: number,
	allocatedIndices?: number[]
): { subnets: SubnetPartition[]; error?: string } {
	const parsed = parseCIDR(cidr);
	if (!parsed) {
		return { subnets: [], error: 'Invalid CIDR notation.' };
	}

	if (targetPrefix < parsed.prefix) {
		return {
			subnets: [],
			error: `Target prefix (/${targetPrefix}) must be larger than or equal to the supernet prefix (/${parsed.prefix}).`
		};
	}

	if (targetPrefix > 32) {
		return {
			subnets: [],
			error: 'Prefix length must be between 0 and 32.'
		};
	}

	const subnetSize = 2 ** (32 - targetPrefix);
	// The loop runs at least once when targetPrefix >= parsed.prefix, producing
	// exactly 2^(targetPrefix - parsed.prefix) subnets. When targetPrefix <
	// parsed.prefix we return early above.
	const totalSubnets = 2 ** (targetPrefix - parsed.prefix);

	const allocated = new Set(allocatedIndices ?? []);
	const subnets: SubnetPartition[] = [];
	const maxSubnets = Math.min(totalSubnets, DISPLAY_LIMIT);

	for (let i = 0; i < maxSubnets; i++) {
		const subnetNetwork = parsed.network + i * subnetSize;
		const subnetBroadcast = subnetNetwork + subnetSize - 1;

		const netAddr = ipToString(subnetNetwork);
		const bcastAddr = ipToString(subnetBroadcast);

		let usableRange: string;
		let usableHosts: number;

		if (targetPrefix === 32) {
			usableRange = netAddr;
			usableHosts = 1;
		} else if (targetPrefix === 31) {
			usableRange = `${ipToString(subnetNetwork)} - ${ipToString(subnetBroadcast)}`;
			usableHosts = 2;
		} else {
			const firstUsable = ipToString(subnetNetwork + 1);
			const lastUsable = ipToString(subnetBroadcast - 1);
			usableRange = `${firstUsable} - ${lastUsable}`;
			usableHosts = subnetSize - 2;
		}

		subnets.push({
			cidr: `${netAddr}/${targetPrefix}`,
			networkAddress: netAddr,
			broadcastAddress: bcastAddr,
			usableRange,
			totalHosts: subnetSize,
			usableHosts,
			isAllocated: allocated.has(i),
			color: getSubnetColor(i)
		});
	}

	return { subnets };
}

/**
 * Splits a single subnet block into smaller sub-blocks of a given target prefix.
 * Returns the new child blocks (in network-address order). Caller is responsible
 * for replacing the parent block in its own state.
 *
 * @param network       - The parent block's network address (32-bit unsigned)
 * @param currentPrefix - The parent block's prefix length
 * @param targetPrefix  - The desired child prefix length (must be > currentPrefix and <= 32)
 */
export function splitBlock(
	network: number,
	currentPrefix: number,
	targetPrefix: number
): { blocks: SubnetBlock[]; error?: string } {
	if (targetPrefix <= currentPrefix) {
		return {
			blocks: [],
			error: `Target prefix (/${targetPrefix}) must be larger than the current prefix (/${currentPrefix}).`
		};
	}

	if (targetPrefix > 32) {
		return {
			blocks: [],
			error: 'Target prefix must be between 0 and 32.'
		};
	}

	const blockSize = 2 ** (32 - targetPrefix);
	const totalChildren = 2 ** (targetPrefix - currentPrefix);
	const blocks: SubnetBlock[] = [];

	for (let i = 0; i < totalChildren; i++) {
		const childNetwork = network + i * blockSize;
		const childBroadcast = childNetwork + blockSize - 1;
		const netAddr = ipToString(childNetwork);
		const bcastAddr = ipToString(childBroadcast);

		let usableRange: string;
		let usableHosts: number;

		if (targetPrefix === 32) {
			usableRange = netAddr;
			usableHosts = 1;
		} else if (targetPrefix === 31) {
			usableRange = `${netAddr} - ${bcastAddr}`;
			usableHosts = 2;
		} else {
			usableRange = `${ipToString(childNetwork + 1)} - ${ipToString(childBroadcast - 1)}`;
			usableHosts = blockSize - 2;
		}

		blocks.push({
			network: childNetwork,
			cidr: `${netAddr}/${targetPrefix}`,
			networkAddress: netAddr,
			broadcastAddress: bcastAddr,
			usableRange,
			totalHosts: blockSize,
			usableHosts,
			prefix: targetPrefix,
			color: getColorForNetwork(childNetwork, targetPrefix),
			note: ''
		});
	}

	return { blocks };
}

/**
 * Merges two adjacent same-prefix subnet blocks into a single parent block.
 * The two blocks must be adjacent (lower, lower + childSize), share the same
 * prefix, and be aligned to a power-of-2 boundary for the merged prefix.
 *
 * @param a - First subnet block
 * @param b - Second subnet block (must be adjacent to a)
 * @returns The merged parent block at prefix-1, or null if invalid
 */
export function mergePair(a: SubnetBlock, b: SubnetBlock): SubnetBlock | null {
	if (a.prefix !== b.prefix || a.prefix === 0) return null;

	const childSize = 2 ** (32 - a.prefix);
	const lower = Math.min(a.network, b.network);
	const upper = Math.max(a.network, b.network);

	if (upper - lower !== childSize) return null;

	const mergedPrefix = a.prefix - 1;
	const mergedSize = childSize * 2;
	if (lower % mergedSize !== 0) return null;

	const blockSize = 2 ** (32 - mergedPrefix);
	const broadcast = lower + blockSize - 1;
	let usableRange: string;
	let usableHosts: number;
	if (mergedPrefix === 32) {
		usableRange = ipToString(lower);
		usableHosts = 1;
	} else if (mergedPrefix === 31) {
		usableRange = `${ipToString(lower)} - ${ipToString(broadcast)}`;
		usableHosts = 2;
	} else {
		usableRange = `${ipToString(lower + 1)} - ${ipToString(broadcast - 1)}`;
		usableHosts = blockSize - 2;
	}

	const firstNote = [a, b].find((c) => c.note)?.note ?? '';

	return {
		network: lower,
		cidr: `${ipToString(lower)}/${mergedPrefix}`,
		networkAddress: ipToString(lower),
		broadcastAddress: ipToString(broadcast),
		usableRange,
		totalHosts: blockSize,
		usableHosts,
		prefix: mergedPrefix,
		color: getColorForNetwork(lower, mergedPrefix),
		note: firstNote
	};
}
