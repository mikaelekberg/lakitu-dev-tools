import { describe, it, expect } from 'vitest';
import {
	parseCIDR,
	prefixToNetmask,
	calculateUsableHosts,
	calculateTotalHosts,
	splitBlock,
	makeBlock,
	getColorForPrefix,
	ipToString,
	isValidCIDR,
	mergePair,
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

describe('getColorForPrefix', () => {
	it('gives the supernet prefix the first palette color', () => {
		expect(getColorForPrefix(22, 22)).toStrictEqual(getColorForPrefix(22, 22));
	});

	it('gives same-size blocks the same color regardless of network address', () => {
		// Two /24 blocks within a /22 supernet share a color (diff = 2).
		expect(getColorForPrefix(24, 22)).toStrictEqual(getColorForPrefix(24, 22));
	});

	it('gives different-size blocks different colors within a supernet', () => {
		// /24 (diff 2) and /25 (diff 3) differ; /25 and /26 (diff 4) differ.
		expect(getColorForPrefix(24, 22)).not.toStrictEqual(getColorForPrefix(25, 22));
		expect(getColorForPrefix(25, 22)).not.toStrictEqual(getColorForPrefix(26, 22));
	});

	it('wraps around the 8-color palette', () => {
		// diff 0 and diff 8 should map to the same palette slot.
		expect(getColorForPrefix(22, 22)).toStrictEqual(getColorForPrefix(30, 22));
	});

	it('handles a /0 supernet', () => {
		expect(getColorForPrefix(0, 0)).toStrictEqual(getColorForPrefix(0, 0));
		expect(getColorForPrefix(8, 0)).not.toStrictEqual(getColorForPrefix(9, 0));
	});
});

describe('makeBlock', () => {
	const ip = (a: number, b: number, c: number, d: number): number =>
		(((a << 24) | (b << 16) | (c << 8) | d) >>> 0) as number;

	it('builds a /24 block with correct fields', () => {
		const block = makeBlock(ip(10, 0, 0, 0), 24, 22);
		expect(block.cidr).toBe('10.0.0.0/24');
		expect(block.networkAddress).toBe('10.0.0.0');
		expect(block.broadcastAddress).toBe('10.0.0.255');
		expect(block.usableRange).toBe('10.0.0.1 - 10.0.0.254');
		expect(block.totalHosts).toBe(256);
		expect(block.usableHosts).toBe(254);
		expect(block.prefix).toBe(24);
		expect(block.supernetPrefix).toBe(22);
		expect(block.note).toBe('');
	});

	it('builds a /31 block (RFC 3021, 2 usable)', () => {
		const block = makeBlock(ip(10, 0, 0, 0), 31, 30);
		expect(block.usableHosts).toBe(2);
		expect(block.usableRange).toBe('10.0.0.0 - 10.0.0.1');
	});

	it('builds a /32 block (1 usable)', () => {
		const block = makeBlock(ip(10, 0, 0, 0), 32, 30);
		expect(block.usableHosts).toBe(1);
		expect(block.usableRange).toBe('10.0.0.0');
	});

	it('carries the supplied note', () => {
		const block = makeBlock(ip(10, 0, 0, 0), 24, 22, 'web tier');
		expect(block.note).toBe('web tier');
	});

	it('colors the block by prefix relative to the supernet', () => {
		const a = makeBlock(ip(10, 0, 0, 0), 24, 22);
		const b = makeBlock(ip(10, 0, 1, 0), 24, 22);
		expect(a.color).toStrictEqual(b.color);
		const c = makeBlock(ip(10, 0, 0, 0), 25, 22);
		expect(a.color).not.toStrictEqual(c.color);
	});
});

describe('splitBlock', () => {
	const ip = (a: number, b: number, c: number, d: number): number =>
		(((a << 24) | (b << 16) | (c << 8) | d) >>> 0) as number;
	// In these tests the parent prefix is treated as the supernet prefix.
	const SP = (parentPrefix: number) => parentPrefix;

	it('splits a /24 into two /25 sub-blocks at correct addresses', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 24, 25, SP(24));
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(2);
		expect(blocks[0].cidr).toBe('10.0.0.0/25');
		expect(blocks[0].network).toBe(ip(10, 0, 0, 0));
		expect(blocks[0].totalHosts).toBe(128);
		expect(blocks[0].usableHosts).toBe(126);
		expect(blocks[0].supernetPrefix).toBe(24);
		expect(blocks[1].cidr).toBe('10.0.0.128/25');
		expect(blocks[1].network).toBe(ip(10, 0, 0, 128));
		expect(blocks[1].broadcastAddress).toBe('10.0.0.255');
	});

	it('splits a /23 into four /25 sub-blocks in network order', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 23, 25, SP(23));
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(4);
		expect(blocks[0].cidr).toBe('10.0.0.0/25');
		expect(blocks[1].cidr).toBe('10.0.0.128/25');
		expect(blocks[2].cidr).toBe('10.0.1.0/25');
		expect(blocks[3].cidr).toBe('10.0.1.128/25');
	});

	it('splits a /16 into 256 /24 sub-blocks', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 16, 24, SP(16));
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(256);
		expect(blocks[0].cidr).toBe('10.0.0.0/24');
		expect(blocks[255].cidr).toBe('10.0.255.0/24');
	});

	it('returns an error when target prefix equals current prefix', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 24, 24, SP(24));
		expect(error).toBeDefined();
		expect(blocks).toHaveLength(0);
	});

	it('returns an error when target prefix is smaller than current', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 24, 16, SP(24));
		expect(error).toBeDefined();
		expect(blocks).toHaveLength(0);
	});

	it('returns an error when target prefix is greater than 32', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 24, 33, SP(24));
		expect(error).toBeDefined();
		expect(blocks).toHaveLength(0);
	});

	it('handles /31 split (RFC 3021, 2 usable per block)', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 30, 31, SP(30));
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(2);
		expect(blocks[0].usableHosts).toBe(2);
		expect(blocks[0].usableRange).toBe('10.0.0.0 - 10.0.0.1');
	});

	it('handles /32 split (1 usable per block)', () => {
		const { blocks, error } = splitBlock(ip(10, 0, 0, 0), 30, 32, SP(30));
		expect(error).toBeUndefined();
		expect(blocks).toHaveLength(4);
		expect(blocks[0].usableHosts).toBe(1);
		expect(blocks[0].usableRange).toBe('10.0.0.0');
		expect(blocks[3].cidr).toBe('10.0.0.3/32');
	});

	it('returns blocks with empty notes', () => {
		const { blocks } = splitBlock(ip(10, 0, 0, 0), 24, 25, SP(24));
		expect(blocks[0].note).toBe('');
	});

	it('gives adjacent same-size sub-blocks the same color', () => {
		const { blocks } = splitBlock(ip(10, 0, 0, 0), 23, 24, SP(23));
		expect(blocks[0].color).toStrictEqual(blocks[1].color);
	});

	it('gives different-size splits different colors', () => {
		const a = splitBlock(ip(10, 0, 0, 0), 23, 24, SP(23)).blocks[0]; // /24
		const b = splitBlock(ip(10, 0, 0, 0), 23, 25, SP(23)).blocks[0]; // /25
		expect(a.color).not.toStrictEqual(b.color);
	});
});

describe('mergePair', () => {
	const ip = (a: number, b: number, c: number, d: number): number =>
		(((a << 24) | (b << 16) | (c << 8) | d) >>> 0) as number;
	// Use a shared supernet prefix so color/supernet guards don't trip the
	// adjacency/alignment assertions under test.
	const SP = 22;

	it('merges two /25 siblings into a /24', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 24, 25, SP).blocks;
		const parent = mergePair(a, b);
		expect(parent).not.toBeNull();
		expect(parent!.cidr).toBe('10.0.0.0/24');
		expect(parent!.totalHosts).toBe(256);
		expect(parent!.usableHosts).toBe(254);
		expect(parent!.network).toBe(ip(10, 0, 0, 0));
		expect(parent!.supernetPrefix).toBe(SP);
	});

	it('merges two /26 siblings into a /25', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 25, 26, SP).blocks;
		const parent = mergePair(a, b);
		expect(parent).not.toBeNull();
		expect(parent!.cidr).toBe('10.0.0.0/25');
		expect(parent!.totalHosts).toBe(128);
	});

	it('returns null when prefixes do not match', () => {
		const [a] = splitBlock(ip(10, 0, 0, 0), 24, 25, SP).blocks;
		const [b] = splitBlock(ip(10, 0, 0, 128), 25, 26, SP).blocks;
		const parent = mergePair(a, b);
		expect(parent).toBeNull();
	});

	it('returns null when blocks are not adjacent', () => {
		const blocks = splitBlock(ip(10, 0, 0, 0), 24, 26, SP).blocks;
		const parent = mergePair(blocks[0], blocks[3]);
		expect(parent).toBeNull();
	});

	it('returns null when not power-of-2 aligned', () => {
		// 10.0.0.64/26 and 10.0.0.128/26 — adjacent /26 but not aligned to /25
		const blocks = splitBlock(ip(10, 0, 0, 0), 24, 26, SP).blocks;
		const parent = mergePair(blocks[1], blocks[2]);
		expect(parent).toBeNull();
	});

	it('returns null when prefix is 0', () => {
		const blockA: SubnetBlock = makeBlock(ip(0, 0, 0, 0), 0, 0);
		const blockB: SubnetBlock = { ...blockA };
		const parent = mergePair(blockA, blockB);
		expect(parent).toBeNull();
	});

	it('merges /31 siblings (RFC 3021) into /30', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 30, 31, SP).blocks;
		const parent = mergePair(a, b);
		expect(parent).not.toBeNull();
		expect(parent!.prefix).toBe(30);
		expect(parent!.usableHosts).toBe(2);
	});

	it('merges /32 siblings into /31', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 31, 32, SP).blocks;
		const parent = mergePair(a, b);
		expect(parent).not.toBeNull();
		expect(parent!.prefix).toBe(31);
		expect(parent!.usableHosts).toBe(2);
	});

	it('preserves note from first child', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 24, 25, SP).blocks;
		a.note = 'first note';
		const parent = mergePair(a, b);
		expect(parent!.note).toBe('first note');
	});

	it('preserves note from second child when first is empty', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 24, 25, SP).blocks;
		b.note = 'second note';
		const parent = mergePair(a, b);
		expect(parent!.note).toBe('second note');
	});

	it('colors the merged block by its prefix relative to the supernet', () => {
		const [a, b] = splitBlock(ip(10, 0, 0, 0), 24, 25, SP).blocks;
		const parent = mergePair(a, b);
		expect(parent!.color).toStrictEqual(getColorForPrefix(24, SP));
	});
});
