/**
 * CIDR / Subnet Calculation Utilities
 *
 * Provides parsing, splitting, merging, and display helpers
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

export interface SubnetColors {
	bar: string; // fill for the proportional size bar
	border: string; // border class for the row / bar
	text: string; // text color for labels
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
	supernetPrefix: number; // prefix of the root supernet (drives color)
	color: SubnetColors;
	note: string;
}

export const DISPLAY_LIMIT = 1024;

// 8-color DaisyUI palette. Color is chosen by (prefix - supernetPrefix) mod 8,
// so every block of the same size shares a color and different sizes differ.
const PALETTE = [
	{ bar: 'bg-primary/70', border: 'border-primary/40', text: 'text-primary' },
	{ bar: 'bg-secondary/70', border: 'border-secondary/40', text: 'text-secondary' },
	{ bar: 'bg-accent/70', border: 'border-accent/40', text: 'text-accent' },
	{ bar: 'bg-info/70', border: 'border-info/40', text: 'text-info' },
	{ bar: 'bg-success/70', border: 'border-success/40', text: 'text-success' },
	{ bar: 'bg-warning/70', border: 'border-warning/40', text: 'text-warning' },
	{ bar: 'bg-error/70', border: 'border-error/40', text: 'text-error' },
	{ bar: 'bg-neutral/70', border: 'border-neutral/40', text: 'text-neutral' }
] as const satisfies readonly SubnetColors[];

/**
 * Returns a stable color for a block based on its prefix relative to the
 * supernet. Blocks of the same size always share a color; different sizes
 * get different colors (wrapping every 8 levels).
 */
export function getColorForPrefix(prefix: number, supernetPrefix: number): SubnetColors {
	const diff = prefix - supernetPrefix;
	const idx = ((diff % PALETTE.length) + PALETTE.length) % PALETTE.length;
	return PALETTE[idx];
}

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
 * Builds a single SubnetBlock at the given network/prefix, colored relative to
 * the supernet prefix. Used for the initial supernet block and internally by
 * splitBlock / mergePair.
 */
export function makeBlock(
	network: number,
	prefix: number,
	supernetPrefix: number,
	note = ''
): SubnetBlock {
	const blockSize = 2 ** (32 - prefix);
	const broadcast = network + blockSize - 1;
	const netAddr = ipToString(network);
	const bcastAddr = ipToString(broadcast);

	let usableRange: string;
	let usableHosts: number;

	if (prefix === 32) {
		usableRange = netAddr;
		usableHosts = 1;
	} else if (prefix === 31) {
		usableRange = `${netAddr} - ${bcastAddr}`;
		usableHosts = 2;
	} else {
		usableRange = `${ipToString(network + 1)} - ${ipToString(broadcast - 1)}`;
		usableHosts = blockSize - 2;
	}

	return {
		network,
		cidr: `${netAddr}/${prefix}`,
		networkAddress: netAddr,
		broadcastAddress: bcastAddr,
		usableRange,
		totalHosts: blockSize,
		usableHosts,
		prefix,
		supernetPrefix,
		color: getColorForPrefix(prefix, supernetPrefix),
		note
	};
}

/**
 * Splits a single subnet block into smaller sub-blocks of a given target prefix.
 * Returns the new child blocks (in network-address order). Caller is responsible
 * for replacing the parent block in its own state.
 *
 * @param network         - The parent block's network address (32-bit unsigned)
 * @param currentPrefix   - The parent block's prefix length
 * @param targetPrefix    - The desired child prefix length (must be > currentPrefix and <= 32)
 * @param supernetPrefix  - The root supernet prefix (for stable coloring)
 */
export function splitBlock(
	network: number,
	currentPrefix: number,
	targetPrefix: number,
	supernetPrefix: number
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
		blocks.push(makeBlock(childNetwork, targetPrefix, supernetPrefix));
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
	if (a.supernetPrefix !== b.supernetPrefix) return null;

	const childSize = 2 ** (32 - a.prefix);
	const lower = Math.min(a.network, b.network);
	const upper = Math.max(a.network, b.network);

	if (upper - lower !== childSize) return null;

	const mergedPrefix = a.prefix - 1;
	const mergedSize = childSize * 2;
	if (lower % mergedSize !== 0) return null;

	const firstNote = [a, b].find((c) => c.note)?.note ?? '';
	return makeBlock(lower, mergedPrefix, a.supernetPrefix, firstNote);
}
