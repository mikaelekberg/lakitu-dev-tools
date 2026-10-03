# Lakitu.dev - Developer Utility Tools

A collection of free, fast, and privacy-focused utility tools for developers. All processing happens client-side - your data never leaves your browser.

## Features

- **Base64 Encoder/Decoder**: Convert text to Base64 or decode Base64 back to text with full Unicode support
- **JSON Formatter/Validator**: Format, validate, and minify JSON with syntax highlighting and detailed error messages
- **Dark Mode**: Automatic dark mode support with manual toggle
- **Privacy First**: All tools run entirely in your browser
- **Responsive**: Works on all screen sizes

## Tech Stack

- **Framework**: SvelteKit 3.x with Svelte 5
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS 4.x + DaisyUI 5.x
- **Syntax Highlighting**: Prism.js
- **Deployment**: Cloudflare Pages
- **CI/CD**: GitHub Actions

## Development

```bash
# Use Node.js 24 and install locked dependencies
npm ci

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Unit tests
npm test

# Type check
npm run check

# Lint and format
npm run lint
npm run format
```

## Deployment

The project is configured to deploy automatically to Cloudflare Pages via GitHub Actions.

### Required GitHub Secrets

1. **CLOUDFLARE_API_TOKEN**: Create at Cloudflare Dashboard > My Profile > API Tokens
2. **CLOUDFLARE_ACCOUNT_ID**: Found in Cloudflare Dashboard sidebar

The workflow packages a self-contained Cloudflare worker before uploading the build.
Use the same packaging step for a manual deployment, with Wrangler authenticated.

### Manual Deployment

```bash
npm run build
npx --no-install wrangler pages functions build --build-output-directory .svelte-kit/cloudflare --outdir .svelte-kit/cloudflare-worker --compatibility-flags nodejs_compat
cp .svelte-kit/cloudflare-worker/_worker.js .svelte-kit/cloudflare/_worker.js
npx --no-install wrangler pages deploy .svelte-kit/cloudflare --project-name=lakitu-dev-tools --branch=main
```

## Project Structure

```text
src/
├── routes/
│   ├── +page.svelte          # Landing page
│   ├── +layout.svelte        # Shared layout
│   ├── base64/+page.svelte   # Base64 tool
│   └── json/+page.svelte     # JSON tool
├── lib/
│   ├── components/
│   │   ├── Navigation.svelte # Nav with dark mode toggle
│   │   └── ToolCard.svelte   # Tool card component
│   └── utils/
│       ├── base64.ts         # Base64 utilities
│       ├── json.ts           # JSON utilities
│       └── clipboard.ts      # Clipboard utilities
└── app.css                   # Global styles
```

## Adding New Tools

1. Create a new route folder: `src/routes/[tool-name]/+page.svelte`
2. Add utility functions in `src/lib/utils/[tool-name].ts`
3. Register the tool in `src/lib/config/tools.ts`; the landing page and navigation use this registry.
4. Add relevant utility tests and update browser coverage for the new route.

## License

MIT

## Dependency update policy

Renovate opens weekly updates before 09:00 Monday in Europe/Stockholm. npm releases must age three days before being eligible. Patch/minor updates, GitHub Actions digest updates, and lockfile maintenance can merge automatically using squash once required checks pass on an up-to-date branch. Major upgrades, package replacements, and pre-1.0 minor upgrades need manual review.

The required validation job runs installation, high/critical security audit, lint, type checking, unit tests, production build, and Chromium smoke tests. Secret scanning, OpenGrep, and Dependency Review are also required. Dependency Review blocks newly introduced high/critical vulnerabilities, including development dependencies. OpenGrep uses a small tested local ruleset with limited Svelte coverage; see [.security/README.md](.security/README.md) for details. Audit failures block Renovate PRs as well as human-authored PRs. Failed checks leave updates open for investigation.

To run browser checks locally, run `npx playwright install chromium`, `npm run build`, then `npm run test:browser`. The suite checks all tool pages, navigation, theme persistence, Base64 conversion, and JSON formatting/error handling.

Validation and deployment share one workflow. After all checks pass, validation uploads the Cloudflare build; preview and production deployment download that exact artifact without rebuilding. Bundle comparison also reuses it and builds only the PR's base commit. The compressed-size report is available in the Check Bundle Size job summary.

Contributor and coding-agent instructions are in [AGENTS.md](AGENTS.md). Security reporting is described in [SECURITY.md](SECURITY.md).
