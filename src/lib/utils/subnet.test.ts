import { describe, it, expect } from 'vitest';
import {
	parseCIDR,
	prefixToNetmask,
	calculateUsableHosts,
	calculateTotalHosts,
	partitionSubnet,
	splitBlock,
	getSubnetColor,
	getColorForNetwork,
	ipToString,
	isValidCIDR,
	mergePair,
	DISPLAY_LIMIT,
	type SubnetBlock
} from './subnet';

describe('ipToString', () => {
	it('converts 0 to 0.0.0.0', () => {
		expect(ipToString(0)).toBe('0.0.0.0');
	});

	it('converts 0xFFFFFFFF to 255.255.255.255', () => {
		expect(ipToString(0xffffffff)).toBe('255.255.255.255');
	});

	it('converts 10.0.0.1 correctly', () => {
		const ip = ((10 << 24) | (0 << 16) | (0 << 8) | 1) >>> 0;
		expect(ipToString(ip)).toBe('10.0.0.1');
	});
});

describe('prefixToNetmask', () => {
	it('returns 0 for /0', () => {
		expect(prefixToNetmask(0)).toBe(0);
	});

	it('returns 0xFFFFFFFF for /32', () => {
		expect(prefixToNetmask(32)).toBe(0xffffffff);
	});

	it('returns 0xFFFFFF00 for /24', () => {
		expect(prefixToNetmask(24)).toBe(0xffffff00);
	});

	it('returns 0xFFFF0000 for /16', () => {
		expect(prefixToNetmask(16)).toBe(0xffff0000);
	});

	it('returns 0x80000000 for /1', () => {
		expect(prefixToNetmask(1)).toBe(0x80000000);
	});
});

describe('calculateUsableHosts', () => {
	it('returns 2 for /31 (RFC 3021)', () => {
		expect(calculateUsableHosts(31)).toBe(2);
	});

	it('returns 1 for /32 (single-host)', () => {
		expect(calculateUsableHosts(32)).toBe(1);
	});

	it('returns 254 for /24', () => {
		expect(calculateUsableHosts(24)).toBe(254);
	});

	it('returns 14 for /28', () => {
		expect(calculateUsableHosts(28)).toBe(14);
	});

	it('returns 2^32 - 2 for /0', () => {
		expect(calculateUsableHosts(0)).toBe(2 ** 32 - 2);
	});
});

describe('calculateTotalHosts', () => {
	it('returns 256 for /24', () => {
		expect(calculateTotalHosts(24)).toBe(256);
	});

	it('returns 2^32 for /0', () => {
		expect(calculateTotalHosts(0)).toBe(2 ** 32);
	});

	it('returns 1 for /32', () => {
		expect(calculateTotalHosts(32)).toBe(1);
	});
});

describe('getSubnetColor', () => {
	it('cycles through the palette', () => {
		const palette = [
			'bg-primary/30',
			'bg-secondary/30',
			'bg-accent/30',
			'bg-info/30',
			'bg-success/30',
			'bg-warning/30',
			'bg-error/30',
			'bg-neutral/30'
		];
		expect(getSubnetColor(0)).toBe(palette[0]);
		expect(getSubnetColor(7)).toBe(palette[7]);
		expect(getSubnetColor(8)).toBe(palette[0]);
	});
});

describe('isValidCIDR', () => {
	it('accepts a valid CIDR', () => {
		expect(isValidCIDR('10.0.0.0/24')).toBe(true);
	});

	it('rejects an invalid CIDR', () => {
		expect(isValidCIDR('not-a-cidr')).toBe(false);
	});

	it('rejects an empty string', () => {
		expect(isValidCIDR('')).toBe(false);
	});
});

describe('parseCIDR - valid inputs', () => {
	it('parses 10.0.0.0/24', () => {
		const r = parseCIDR('10.0.0.0/24');
		expect(r).not.toBeNull();
		expect(r!.network).toBe(((10 << 24) | (0 << 16) | (0 << 8) | 0) >>> 0);
		expect(r!.broadcast).toBe(((10 << 24) | (0 << 16) | (0 << 8) | 255) >>> 0);
		expect(r!.netmask).toBe(0xffffff00);
		expect(r!.wildcard).toBe(0x000000ff);
		expect(r!.prefix).toBe(24);
		expect(r!.hosts).toBe(254);
		expect(r!.cidrStr).toBe('10.0.0.0/24');
	});

	it('parses 192.168.1.0/28 (16 addresses, 14 usable)', () => {
		const r = parseCIDR('192.168.1.0/28');
		expect(r).not.toBeNull();
		expect(r!.hosts).toBe(14);
		expect(calculateTotalHosts(r!.prefix)).toBe(16);
	});

	it('normalizes 192.168.1.123/16 to 192.168.0.0/16', () => {
		const r = parseCIDR('192.168.1.123/16');
		expect(r).not.toBeNull();
		expect(r!.cidrStr).toBe('192.168.0.0/16');
	});

	it('parses 172.16.0.0/12', () => {
		const r = parseCIDR('172.16.0.0/12');
		expect(r).not.toBeNull();
		expect(r!.prefix).toBe(12);
		expect(r!.netmask).toBe(0xfff00000);
	});

	it('parses 0.0.0.0/0 with 2^32-2 hosts', () => {
		const r = parseCIDR('0.0.0.0/0');
		expect(r).not.toBeNull();
		expect(r!.prefix).toBe(0);
		expect(r!.netmask).toBe(0);
		expect(r!.hosts).toBe(2 ** 32 - 2);
	});

	it('parses 255.255.255.255/32 with 1 host', () => {
		const r = parseCIDR('255.255.255.255/32');
		expect(r).not.toBeNull();
		expect(r!.prefix).toBe(32);
		expect(r!.netmask).toBe(0xffffffff);
		expect(r!.hosts).toBe(1);
	});

	it('parses 10.0.0.0/31 with 2 hosts (RFC 3021)', () => {
		const r = parseCIDR('10.0.0.0/31');
		expect(r).not.toBeNull();
		expect(r!.hosts).toBe(2);
	});
});

describe('parseCIDR - invalid inputs return null', () => {
	it('returns null for empty string', () => {
		expect(parseCIDR('')).toBeNull();
	});

	it('returns null for missing slash', () => {
		expect(parseCIDR('10.0.0.0')).toBeNull();
	});

	it('returns null for empty prefix', () => {
		expect(parseCIDR('10.0.0.0/')).toBeNull();
	});

	it('returns null for empty IP', () => {
		expect(parseCIDR('/24')).toBeNull();
	});

	it('returns null for prefix > 32', () => {
		expect(parseCIDR('10.0.0.0/33')).toBeNull();
	});

	it('returns null for prefix < 0', () => {
		expect(parseCIDR('10.0.0.0/-1')).toBeNull();
	});

	it('returns null for octet > 255', () => {
		expect(parseCIDR('256.0.0.0/24')).toBeNull();
	});

	it('returns null for too many octets', () => {
		expect(parseCIDR('10.0.0.0.0/24')).toBeNull();
	});

	it('returns null for non-numeric octet', () => {
		expect(parseCIDR('10.0.0.a/24')).toBeNull();
	});

	it('returns null for trailing characters in prefix', () => {
		expect(parseCIDR('10.0.0.0/24extra')).toBeNull();
	});

	it('returns null for non-numeric prefix', () => {
		expect(parseCIDR('10.0.0.0/abc')).toBeNull();
	});
});

describe('partitionSubnet', () => {
	it('partitions 10.0.0.0/24 into a single /24', () => {
		const { subnets, error } = partitionSubnet('10.0.0.0/24', 24);
		expect(error).toBeUndefined();
		expect(subnets).toHaveLength(1);
		expect(subnets[0].cidr).toBe('10.0.0.0/24');
		expect(subnets[0].usableHosts).toBe(254);
	});

	it('partitions 10.0.0.0/16 into 256 /24 subnets', () => {
		const { subnets, error } = partitionSubnet('10.0.0.0/16', 24);
		expect(error).toBeUndefined();
		expect(subnets).toHaveLength(256);
		expect(subnets[0].cidr).toBe('10.0.0.0/24');
		expect(subnets[1].cidr).toBe('10.0.1.0/24');
		expect(subnets[255].cidr).toBe('10.0.255.0/24');
	});

	it('marks allocated indices', () => {
		const { subnets, error } = partitionSubnet('10.0.0.0/16', 24, [0, 2]);
		expect(error).toBeUndefined();
		expect(subnets[0].isAllocated).toBe(true);
		expect(subnets[1].isAllocated).toBe(false);
		expect(subnets[2].isAllocated).toBe(true);
		expect(subnets[3].isAllocated).toBe(false);
	});

	it('assigns rotating colors per index', () => {
		const { subnets } = partitionSubnet('10.0.0.0/16', 24);
		expect(subnets[0].color).not.toBe(subnets[1].color);
		expect(subnets[0].color).toBe(getSubnetColor(0));
		expect(subnets[8].color).toBe(getSubnetColor(0));
	});

	it('caps the result at DISPLAY_LIMIT for very large partitions', () => {
		// 10.0.0.0/16 partitioned into /27 = 2^(27-16) = 2048 subnets
		const { subnets, error } = partitionSubnet('10.0.0.0/16', 27);
		expect(error).toBeUndefined();
		expect(subnets).toHaveLength(DISPLAY_LIMIT);
		expect(DISPLAY_LIMIT).toBe(1024);
	});

	it('returns an error when target prefix is smaller than supernet prefix', () => {
		const { subnets, error } = partitionSubnet('10.0.0.0/16', 8);
		expect(error).toBeDefined();
		expect(error).toMatch(/larger than or equal/);
		expect(subnets).toHaveLength(0);
	});

	it('returns an error for invalid CIDR input', () => {
		const { subnets, error } = partitionSubnet('not-a-cidr', 24);
		expect(error).toBe('Invalid CIDR notation.');
		expect(subnets).toHaveLength(0);
	});

	it('returns an error for target prefix > 32', () => {
		const { subnets, error } = partitionSubnet('10.0.0.0/24', 33);
		expect(error).toBeDefined();
		expect(subnets).toHaveLength(0);
	});

	it('handles /31 partitions (2 usable per subnet)', () => {
		const { subnets, error } = partitionSubnet('10.0.0.0/30', 31);
		expect(error).toBeUndefined();
		expect(subnets).toHaveLength(2);
		expect(subnets[0].usableHosts).toBe(2);
	});

	it('handles /32 partitions (1 usable per subnet)', () => {
		const { subnets, error } = partitionSubnet('10.0.0.0/30', 32);
		expect(error).toBeUndefined();
		expect(subnets).toHaveLength(4);
		expect(subnets[0].usableHosts).toBe(1);
	});
});

describe('getColorForNetwork', () => {
	it('gives the first child of a split the same color as the parent', () => {
		const parentColor = getColorForNetwork(0x0a000000, 24);
		const firstChildColor = getColorForNetwork(0x0a000000, 25);
		expect(firstChildColor).toBe(parentColor);
	});

	it('gives the second child a different color from the first', () => {
		const firstChild = getColorForNetwork(0x0a000000, 25);
		const secondChild = getColorForNetwork(0x0a000080, 25);
		expect(secondChild).not.toBe(firstChild);
	});

	it('cycles through the palette across many subnets', () => {
		const colors = new Set<string>();
		for (let i = 0; i < 8; i++) {
			colors.add(getColorForNetwork(i * 256, 24));
		}
		expect(colors.size).toBe(8);
	});
});

describe('splitBlock', () => {
	const ip = (a: number, b: number, c: number, d: number): number =>
		(((a << 24) | (b << 16) | (c << 8) | d) >>> 0) as number;

	it('splits a /24 into two /25 sub-blocks at correct addresses', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 24, 25);
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(2);
		expect(blocks[0].cidr).toBe('10.0.0.0/25');
		expect(blocks[0].network).toBe(ip(10, 0, 0, 0));
		expect(blocks[0].totalHosts).toBe(128);
		expect(blocks[0].usableHosts).toBe(126);
		expect(blocks[1].cidr).toBe('10.0.0.128/25');
		expect(blocks[1].network).toBe(ip(10, 0, 0, 128));
		expect(blocks[1].broadcastAddress).toBe('10.0.0.255');
	});

	it('splits a /23 into four /25 sub-blocks in network order', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 23, 25);
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(4);
		expect(blocks[0].cidr).toBe('10.0.0.0/25');
		expect(blocks[1].cidr).toBe('10.0.0.128/25');
		expect(blocks[2].cidr).toBe('10.0.1.0/25');
		expect(blocks[3].cidr).toBe('10.0.1.128/25');
	});

	it('splits a /16 into 256 /24 sub-blocks', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 16, 24);
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(256);
		expect(blocks[0].cidr).toBe('10.0.0.0/24');
		expect(blocks[255].cidr).toBe('10.0.255.0/24');
	});

	it('returns an error when target prefix equals current prefix', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 24, 24);
		expect(error).toBeDefined();
		expect(blocks).toHaveLength(0);
	});

	it('returns an error when target prefix is smaller than current', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 24, 16);
		expect(error).toBeDefined();
		expect(blocks).toHaveLength(0);
	});

	it('returns an error when target prefix is greater than 32', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 24, 33);
		expect(error).toBeDefined();
		expect(blocks).toHaveLength(0);
	});

	it('handles /31 split (RFC 3021, 2 usable per block)', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 30, 31);
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(2);
		expect(blocks[0].usableHosts).toBe(2);
		expect(blocks[0].usableRange).toBe('10.0.0.0 - 10.0.0.1');
	});

	it('handles /32 split (1 usable per block)', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 30, 32);
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(4);
		expect(blocks[0].usableHosts).toBe(1);
		expect(blocks[0].usableRange).toBe('10.0.0.0');
		expect(blocks[3].cidr).toBe('10.0.0.3/32');
	});

	it('returns blocks with empty notes', () => {
		const { blocks } = splitBlock(ip(10, 0, 0, 0), 24, 25);
		expect(blocks[0].note).toBe('');
	});

	it('assigns distinct colors to adjacent sub-blocks', () => {
		const { blocks } = splitBlock(ip(10, 0, 0, 0), 23, 24);
		expect(blocks[0].color).not.toBe(blocks[1].color);
	});
});

describe('mergePair', () => {
	const ip = (a: number, b: number, c: number, d: number): number =>
		(((a << 24) | (b << 16) | (c << 8) | d) >>> 0) as number;

	it('merges two /25 siblings into a /24', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 24, 25).blocks;
		const parent = mergePair(a, b);
		expect(parent).not.toBeNull();
		expect(parent!.cidr).toBe('10.0.0.0/24');
		expect(parent!.totalHosts).toBe(256);
		expect(parent!.usableHosts).toBe(254);
		expect(parent!.network).toBe(ip(10, 0, 0, 0));
	});

	it('merges two /26 siblings into a /25', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 25, 26).blocks;
		const parent = mergePair(a, b);
		expect(parent).not.toBeNull();
		expect(parent!.cidr).toBe('10.0.0.0/25');
		expect(parent!.totalHosts).toBe(128);
	});

	it('returns null when prefixes do not match', () => {
		const [a] = splitBlock(ip(10, 0, 0, 0), 24, 25).blocks;
		const [b] = splitBlock(ip(10, 0, 0, 128), 25, 26).blocks;
		const parent = mergePair(a, b);
		expect(parent).toBeNull();
	});

	it('returns null when blocks are not adjacent', () => {
		const blocks = splitBlock(ip(10, 0, 0, 0), 24, 26).blocks;
		const parent = mergePair(blocks[0], blocks[3]);
		expect(parent).toBeNull();
	});

	it('returns null when not power-of-2 aligned', () => {
		// 10.0.0.64/26 and 10.0.0.128/26 — adjacent /26 but not aligned to /25
		const blocks = splitBlock(ip(10, 0, 0, 0), 24, 26).blocks;
		const parent = mergePair(blocks[1], blocks[2]);
		expect(parent).toBeNull();
	});

	it('returns null when prefix is 0', () => {
		const blockA: SubnetBlock = {
			network: ip(0, 0, 0, 0),
			cidr: '0.0.0.0/0',
			networkAddress: '0.0.0.0',
			broadcastAddress: '255.255.255.255',
			usableRange: '0.0.0.1 - 255.255.255.254',
			totalHosts: 2 ** 32,
			usableHosts: 2 ** 32 - 2,
			prefix: 0,
			color: 'bg-primary/30',
			note: ''
		};
		const blockB = { ...blockA };
		const parent = mergePair(blockA, blockB);
		expect(parent).toBeNull();
	});

	it('merges /31 siblings (RFC 3021) into /30', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 30, 31).blocks;
		const parent = mergePair(a, b);
		expect(parent).not.toBeNull();
		expect(parent!.prefix).toBe(30);
		expect(parent!.usableHosts).toBe(2);
	});

	it('merges /32 siblings into /31', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 31, 32).blocks;
		const parent = mergePair(a, b);
		expect(parent).not.toBeNull();
		expect(parent!.prefix).toBe(31);
		expect(parent!.usableHosts).toBe(2);
	});

	it('preserves note from first child', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 24, 25).blocks;
		a.note = 'first note';
		const parent = mergePair(a, b);
		expect(parent!.note).toBe('first note');
	});

	it('preserves note from second child when first is empty', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 24, 25).blocks;
		b.note = 'second note';
		const parent = mergePair(a, b);
		expect(parent!.note).toBe('second note');
	});
});
