import { describe, it, expect } from 'vitest';
import {
	parseCIDR,
	prefixToNetmask,
	calculateUsableHosts,
	calculateTotalHosts,
	partitionSubnet,
	getSubnetColor,
	ipToString,
	isValidCIDR,
	DISPLAY_LIMIT
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
		// 10.0.0.0/16 partitioned into /25 = 2^(25-16) = 512 subnets
		const { subnets, error } = partitionSubnet('10.0.0.0/16', 25);
		expect(error).toBeUndefined();
		expect(subnets).toHaveLength(DISPLAY_LIMIT);
		expect(DISPLAY_LIMIT).toBe(256);
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
