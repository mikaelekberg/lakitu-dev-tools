# Agent instructions

## Project

Lakitu.dev is a small hobby project providing browser-based developer utilities.
Keep processing client-side, preserve privacy, responsive layouts, accessibility,
and light/dark themes. Use free tools and services for security checks.

## Current stack and layout

- Node.js 24; install locked dependencies with `npm ci`.
- SvelteKit 3, Svelte 5, TypeScript, Vite, TailwindCSS 4, DaisyUI 5.
- SvelteKit configuration and the Cloudflare adapter live in `vite.config.ts`.
  There is no `svelte.config.js`. TypeScript extends `$app/tsconfig`.
- Use `#lib/...` imports with explicit `.ts` extensions for TypeScript modules.
- Import icons from `@lucide/svelte/icons/<name>`.
- Add routes in `src/routes`, utilities in `src/lib/utils`, and register new tools
  in `src/lib/config/tools.ts`; landing-page cards and navigation use that registry.
- Unit tests live alongside utilities; browser smoke tests live in `tests/browser`.

## Verification

Before considering changes complete, always run:

```sh
npm run format
npm run lint
npm run check
```

Run `npm test` for changes to application behavior. For routes, navigation, theme,
or dependency changes affecting the UI, also run:

```sh
npx playwright install chromium
npm run build
npm run test:browser
```

The browser suite uses the production preview. Add meaningful tests for changed
behavior. Formatting uses tabs, single quotes, no trailing commas, and a
100-character line width.

For changes to OpenGrep rules or its executable, run the positive/negative fixtures
and repository scan described in [.security/README.md](.security/README.md).
Investigate failures; do not bypass audit, secret scanning, or security gates to
make a dependency update pass.

## CI and deployment

`.github/workflows/validation.yml` validates, scans, builds, packages a self-contained
Cloudflare worker, and runs browser tests. Deployment downloads that exact validated
artifact without rebuilding. Preserve the worker packaging step: adapter output alone
can contain imports outside the uploaded directory. Preview deployment is limited to
same-repository PRs; production deployment runs on main. Deployment credentials are
used by the isolated deployment jobs.

The required merge checks are `Validate application`, `Scan for Secrets`,
`OpenGrep security scan`, and `Dependency Review`, with branches required to be
up to date. Branch rules are GitHub repository settings, separate from workflow YAML.
See [README.md](README.md) for commands and [.security/README.md](.security/README.md)
for security coverage and scanner update instructions.

## Renovate

`renovate.json` is the policy source. npm releases wait three days; updates are
scheduled before 09:00 Monday in Europe/Stockholm. Routine npm patch/minor updates,
GitHub Actions patch/minor/digest updates, and lockfile maintenance can squash merge
automatically after required checks pass. Major upgrades, replacements, and pre-1.0
minor updates require manual review. GitHub Actions are pinned to commit digests.
Preserve these controls when editing dependency automation.
