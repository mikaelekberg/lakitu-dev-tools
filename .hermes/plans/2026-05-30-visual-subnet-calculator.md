# Visual Subnet Calculator Implementation Plan

> **For Hermes:** Use subagent-driven-development to implement this plan task-by-task.

**Goal:** Add a visual subnet calculator to lakitu.dev — input a CIDR block, partition it into subnets, see a visual tree/grid of allocated vs. free space, and view calculation details.

**Architecture:** Pure client-side (no server). SvelteKit route page at `/subnet` with a utility module for all CIDR math. Tab-based UI: one tab for the visual partitioner, one for a simple single-subnet details calculator.

**Tech Stack:** Svelte 5 (runes), TypeScript, TailwindCSS 4, DaisyUI 5, lucide-svelte (`Network` icon).

**Existing patterns to follow:**

- Utility module at `src/lib/utils/subnet.ts`
- Route page at `src/routes/subnet/+page.svelte`
- Tool entry in `src/lib/config/tools.ts`
- No changes to Navigation or +layout — they iterate `tools` automatically
- Same code style: Tabs, single quotes, no trailing commas, 100 char width

**Files to create/modify:**

- Create: `src/lib/utils/subnet.ts`
- Create: `src/routes/subnet/+page.svelte`
- Modify: `src/lib/config/tools.ts`

---

### Task 1: Create CIDR utility module

**Objective:** Build a pure-function utility module with all CIDR subnet math.

**Files:**

- Create: `src/lib/utils/subnet.ts`

**CIDR math functions needed:**

```typescript
// Parse a CIDR string like "10.0.0.0/16" into its components
// Returns null on invalid input
export interface ParsedCIDR {
	ip: number; // IP as 32-bit unsigned int
	prefix: number; // prefix length (0-32)
	netmask: number; // subnet mask as 32-bit int
	wildcard: number; // wildcard mask (inverted netmask)
	network: number; // network address
	broadcast: number; // broadcast address
	hosts: bigint; // number of usable hosts
	ipStr: string; // original IP string
	cidrStr: string; // normalized CIDR string
}

export function parseCIDR(input: string): ParsedCIDR | null;

// Partition a CIDR block into smaller subnets of a given prefix length
export interface SubnetPartition {
	cidr: string; // e.g. "10.0.0.0/24"
	networkAddress: string;
	broadcastAddress: string;
	usableRange: string; // e.g. "10.0.0.1 - 10.0.0.254"
	totalHosts: number;
	usableHosts: number;
	isAllocated: boolean; // user-marked as in-use
	color: string; // visual color class
}

export function partitionSubnet(
	cidr: string,
	targetPrefix: number,
	allocatedIndices?: number[]
): { subnets: SubnetPartition[]; error?: string };

// Visual helpers for the tree/grid
export function ipToString(ip: number): string;
export function prefixToNetmask(prefix: number): number;
export function calculateUsableHosts(prefix: number): number;
export function calculateTotalHosts(prefix: number): number;

// Color assignment for visual grid — cycles through a palette
export function getSubnetColor(index: number): string;

// Validate a CIDR string
export function isValidCIDR(input: string): boolean;
```

**Step 1: Write the utility module**

Write `src/lib/utils/subnet.ts` with complete implementations for all functions above.

Key implementation details:

- IPs stored as 32-bit unsigned integers (use `>>> 0` for unsigned shift)
- `parseCIDR`: split on `/`, validate two parts, validate IP octets (0-255), validate prefix (0-32), compute network by masking IP with netmask, compute broadcast by ORing network with wildcard
- `partitionSubnet`: iterate through the supernet's address space in steps of the target subnet size, create a SubnetPartition for each
- `prefixToNetmask`: `~(2 ** (32 - prefix) - 1) >>> 0`
- `calculateUsableHosts`: for /31 = 2, for /32 = 1, otherwise `2 ** (32 - prefix) - 2`
- Color palette: array of Tailwind bg classes (e.g. `['bg-primary/20', 'bg-secondary/20', 'bg-accent/20', 'bg-info/20', 'bg-success/20', 'bg-warning/20', 'bg-error/20']`)

Edge cases:

- Invalid CIDR (bad format, IP out of range, prefix > 32)
- /31 and /32 subnets (no usable hosts ≠ broadcast calculations)
- Target prefix smaller than supernet prefix (error)
- Huge subnets (e.g. /8 partitioned into /24s — should work but might produce many subnets; cap at 256 displayable subnets)

**Step 2: Commit**

```bash
git add src/lib/utils/subnet.ts
git commit -m "feat(subnet): add CIDR parsing and subnet calculation utilities"
```

---

### Task 2: Add tool entry in tools config

**Objective:** Register the subnet calculator in the tools registry so it appears in the nav and on the landing page.

**Files:**

- Modify: `src/lib/config/tools.ts`

**Changes:**

1. Add `Network` to the import from `lucide-svelte`:

```typescript
import {
	FileKey,
	Braces,
	KeyRound,
	Fingerprint,
	Clock,
	Regex,
	Timer,
	FileCode2,
	Network
} from 'lucide-svelte';
```

2. Add a new tool entry in the `tools` array (insert alphabetically, after the JSON entry):

```typescript
{
  id: 'subnet',
  label: 'Subnet',
  title: 'Visual Subnet Calculator',
  description:
    'Calculate subnets from CIDR blocks with a visual partition grid. View network, broadcast, hosts, and usable range for each subnet.',
  icon: Network
},
```

**Step 1: Make the edits and commit**

```bash
git add src/lib/config/tools.ts
git commit -m "feat(subnet): add subnet calculator tool entry to config"
```

---

### Task 3: Create the subnet calculator route page (Single CIDR Details tab)

**Objective:** Build the route page with the first tab — a single-subnet details calculator where users input a CIDR and see full details.

**Files:**

- Create: `src/routes/subnet/+page.svelte`

**Tab 1 — Single Subnet Details:**

- Input: text field for CIDR (e.g. `10.0.0.0/24`) with a "Calculate" button
- On input (Enter key or button click), parse and display:
  - Network Address
  - Broadcast Address
  - Usable IP Range
  - Netmask (dotted decimal)
  - Wildcard Mask
  - Total Hosts
  - Usable Hosts
- Display in a clean table/card layout matching the tool's existing design patterns
- Error state: show a DaisyUI `alert alert-error` for invalid CIDR
- "Clear" button to reset

Follow the existing tool page patterns (like the UUID tool): `<svelte:head>` with title/meta, DaisyUI cards with `bg-base-200`, responsive layout, `fieldset` wrappers for inputs.

Use Svelte 5 runes syntax throughout (`$state`, `$effect`, snippet-based slots).

**Step 1: Write the route page**

Create `src/routes/subnet/+page.svelte` with:

- `<script lang="ts">` block with all state and handlers
- `<svelte:head>` for SEO
- Full UI for the single-subnet details calculator
- Error handling for invalid inputs

Note: The page should NOT have tabs yet — that comes in Task 4. For now, just the single-subnet calculator.

**Step 2: Verify the page works**

Run the type checker and linter:

```bash
cd /home/hermes/lakitu-dev-tools && npm run check 2>&1 | tail -20
npm run lint 2>&1 | tail -20
```

Fix any issues.

**Step 3: Commit**

```bash
git add src/routes/subnet/+page.svelte
git commit -m "feat(subnet): add subnet calculator route page with CIDR details"
```

---

### Task 4: Add the Visual Partition grid tab

**Objective:** Add a second tab to the subnet page for the visual partitioner — input a supernet + target prefix, see a visual grid.

**Files:**

- Modify: `src/routes/subnet/+page.svelte`

**Changes:**

1. Add tab navigation (matching the UUID tool's tab pattern):
   - Tab 1: "Single Subnet" (the calculator from Task 3)
   - Tab 2: "Partition Subnet"

2. Tab 2 — Partition Subnet:
   - Two input fields: "Supernet CIDR" (e.g. `10.0.0.0/16`) and "Subnet Prefix" (e.g. `/24`)
   - "Partition" button
   - Output: a visual grid/tree showing each resulting subnet as a card/block

3. Visual grid component (inline in the page):
   - Each subnet shown as a bordered card with:
     - The CIDR label (e.g. `10.0.0.0/24`)
     - A color-coded background (cycling through the palette from subnet.ts)
     - Brief info: usable hosts, network range
   - Grid layout: CSS grid, responsive (3 columns desktop, 2 tablet, 1 mobile)
   - For subnets the user marks as "allocated" — show a checkmark or different border style
   - Click on a subnet card to see its full details in an expanded view or a side panel

4. Edge cases for display:
   - If partition produces > 256 subnets, show a warning and cap display
   - Error if target prefix <= supernet prefix

5. "Select All" / "Clear All" buttons for toggling allocated state

**Step 1: Modify the page**

Add the tab structure and partition tab content to `src/routes/subnet/+page.svelte`.

**Step 2: Verify**

```bash
cd /home/hermes/lakitu-dev-tools && npm run check 2>&1 | tail -20
npm run lint 2>&1 | tail -20
```

**Step 3: Commit**

```bash
git add src/routes/subnet/+page.svelte
git commit -m "feat(subnet): add visual subnet partition grid with color-coded blocks"
```

---

### Task 5: Final polish, format, and verify

**Objective:** Run all checks, format code, and make sure everything is clean before PR.

**Steps:**

1. Format code:

```bash
cd /home/hermes/lakitu-dev-tools && npm run format
```

2. Run type checking:

```bash
cd /home/hermes/lakitu-dev-tools && npm run check
```

3. Run linting:

```bash
cd /home/hermes/lakitu-dev-tools && npm run lint
```

4. Fix any issues found.

5. Final verification — confirm:
   - Route page renders without errors
   - Navigation dropdown includes "Subnet"
   - Landing page shows the Subnet tool card
   - Single CIDR calculator works on both valid and invalid inputs
   - Partition tab produces a visual grid

6. Amend last commit or add a cleanup commit:

```bash
git add -A
git commit -m "chore(subnet): run format and fix lint/type issues"
```

---

### Task 6: Push branch and open PR

**Objective:** Push the feature branch to GitHub and open a pull request.

**Steps:**

1. Push the branch:

```bash
cd /home/hermes/lakitu-dev-tools && git push -u origin HEAD
```

2. Open a PR via GitHub API referencing LAK-12:

```bash
BRANCH=$(git branch --show-current)
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/mikaelekberg/lakitu-dev-tools/pulls \
  -d "{
    \"title\": \"feat: add visual subnet calculator\",
    \"body\": \"## Summary\\nAdds a visual subnet calculator to lakitu.dev — parse CIDR blocks, view subnet details, and visually partition supernets into subnets.\\n\\n### Features\\n- **Single Subnet Details**: Input any CIDR block to see network address, broadcast, wildcard, usable range, and host counts\\n- **Visual Partition Grid**: Enter a supernet (e.g. \`10.0.0.0/16\`) and target prefix (e.g. /24) to see a color-coded grid of all resulting subnets\\n- **Mark Allocated**: Click subnet blocks to mark them as in-use\\n- **All client-side**: No data leaves your browser\\n\\nCloses LAK-12\",
    \"head\": \"$BRANCH\",
    \"base\": \"main\"
  }"
```

3. Verify CI kicks off:

```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/mikaelekberg/lakitu-dev-tools/actions/runs?branch=$BRANCH&per_page=3
```

4. Report the PR URL to the user.

---

## Verification Checklist

- [ ] `npm run check` passes (no type errors)
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] `npm run format` applied (consistent style)
- [ ] CIDR parsing handles: `10.0.0.0/24`, `192.168.1.0/28`, `172.16.0.0/12`, invalid inputs
- [ ] Edge cases: /31 (2 hosts, ptp), /32 (1 host), prefix > 32
- [ ] Large partitions capped at 256 displayable subnets
- [ ] Page works in both light and dark mode
- [ ] Error messages are user-friendly
- [ ] No data sent to any server (pure client-side)
- [ ] Branch protection respects `main` as base
