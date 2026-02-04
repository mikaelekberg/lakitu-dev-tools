# Agents.md - Lakitu.dev Utility Tools

## Project Overview

Create a utility tools website hosted at lakitu.dev, deployed on Cloudflare Pages using SvelteKit and TypeScript. The site will feature client-side utility tools starting with Base64 encoder/decoder and JSON formatter/validator, with an architecture designed for easy extension with additional tools in the future.

## Technology Stack

- **Framework**: SvelteKit (latest stable version)
- **Language**: TypeScript
- **Styling**: TailwindCSS + DaisyUI
- **Deployment**: Cloudflare Pages
- **CI/CD**: GitHub Actions
- **Repository**: GitHub

## Project Structure

```
lakitu-dev-tools/
├── src/
│   ├── routes/
│   │   ├── +page.svelte          # Landing page with tool list
│   │   ├── +layout.svelte        # Shared layout with navigation
│   │   ├── base64/
│   │   │   └── +page.svelte      # Base64 encoder/decoder
│   │   └── json/
│   │       └── +page.svelte      # JSON formatter/validator
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Navigation.svelte # Shared navigation component
│   │   │   └── ToolCard.svelte   # Tool card for landing page
│   │   └── utils/
│   │       ├── base64.ts         # Base64 utility functions
│   │       └── json.ts           # JSON utility functions
│   └── app.css                   # Global styles with Tailwind
├── static/
│   └── favicon.ico
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions workflow
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## Features & Requirements

### Core Features

1. **Landing Page**
   - Display a grid/list of available tools
   - Each tool should have a card with title, description, and link
   - Clean, modern design using DaisyUI components
   - Dark mode support (must be implemented)

2. **Base64 Encoder/Decoder** (`/base64`)
   - Text input area for original text
   - Button to encode to Base64
   - Button to decode from Base64
   - Output area displaying result
   - Copy to clipboard functionality
   - Error handling for invalid Base64 input
   - Clear/reset button

3. **JSON Formatter/Validator** (`/json`)
   - Text input area for JSON input
   - Format/prettify JSON with configurable indentation (2 or 4 spaces)
   - Validate JSON and show clear error messages with line numbers
   - Minify JSON option
   - Copy to clipboard functionality
   - Clear/reset button
   - Syntax highlighting for formatted JSON (optional but nice to have)

### Design Requirements

- **Responsive design** - Mobile-first approach, works on all screen sizes
- **Dark mode** - Use DaisyUI's theme system, provide theme toggle
- **Consistent navigation** - Header/navbar on all pages with links to all tools
- **Accessibility** - Proper semantic HTML, keyboard navigation, ARIA labels
- **Loading states** - Show appropriate feedback for actions
- **Error states** - User-friendly error messages

### Technical Requirements

- **TypeScript** - Strict mode enabled, proper typing throughout
- **Client-side only** - All tools run entirely in the browser
- **No external API calls** - Tools should work offline after initial load
- **Fast load times** - Optimize bundle size, use code splitting
- **SvelteKit adapter** - Use `@sveltejs/adapter-cloudflare` for Cloudflare Pages deployment

## Setup Instructions

### Initial Project Setup

```bash
# Create new SvelteKit project
npm create svelte@latest lakitu-dev-tools
# Choose:
# - Skeleton project
# - Yes, using TypeScript syntax
# - Add ESLint
# - Add Prettier
# - Add Playwright (optional)

cd lakitu-dev-tools

# Install dependencies
npm install

# Install TailwindCSS and DaisyUI
npm install -D tailwindcss postcss autoprefixer daisyui
npx tailwindcss init -p

# Install Cloudflare adapter
npm install -D @sveltejs/adapter-cloudflare

# Install additional dependencies
npm install -D @types/node
```

### Configuration Files

#### `svelte.config.js`
```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		})
	}
};

export default config;
```

#### `package.json`
```json
"dependencies": {
  "@sveltejs/kit": "^2.0.0",
  "svelte": "^5.0.0"
},
"devDependencies": {
  "@sveltejs/adapter-cloudflare": "^7.0.0",
  "tailwindcss": "^4.0.0",
  "daisyui": "^5.0.0",
  "typescript": "^5.0.0"
}
```

#### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [require('daisyui')],
	daisyui: {
		themes: ['light', 'dark'],
		darkTheme: 'dark',
		base: true,
		styled: true,
		utils: true
	}
};
```

#### `src/app.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### `src/routes/+layout.svelte`
```svelte
<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
</script>

<div class="min-h-screen bg-base-100">
	<Navigation />
	<main class="container mx-auto px-4 py-8">
		<slot />
	</main>
</div>
```

## GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: lakitu-dev-tools
          directory: .svelte-kit/cloudflare
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### GitHub Secrets Setup

You need to add the following secrets to your GitHub repository:

1. **CLOUDFLARE_API_TOKEN**
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create token with "Cloudflare Pages" template or custom token with:
     - Account.Cloudflare Pages: Edit
   - Copy the token and add it to GitHub repository secrets

2. **CLOUDFLARE_ACCOUNT_ID**
   - Go to Cloudflare Dashboard
   - Select your account
   - Account ID is visible in the URL or in the sidebar
   - Add it to GitHub repository secrets

### Cloudflare Pages Setup

1. Go to Cloudflare Dashboard → Pages
2. Create a new project named `lakitu-dev-tools`
3. Connect your GitHub repository (or skip if using GitHub Actions for deployment)
4. Build settings (if using Cloudflare Git integration):
   - Framework preset: SvelteKit
   - Build command: `npm run build`
   - Build output directory: `.svelte-kit/cloudflare`
   - Root directory: `/`
5. Add custom domain:
   - Go to project → Custom domains
   - Add `lakitu.dev`
   - Add `www.lakitu.dev` (optional)
   - Follow DNS configuration instructions

## Component Implementation Guidelines

### Navigation Component (`src/lib/components/Navigation.svelte`)

Should include:
- Site logo/title "Lakitu.dev"
- Links to all tools
- Dark mode toggle button
- Responsive mobile menu (hamburger menu)
- Active route highlighting

### Tool Card Component (`src/lib/components/ToolCard.svelte`)

Props:
- `title: string` - Tool name
- `description: string` - Brief description
- `href: string` - Link to tool
- `icon?: string` - Optional icon/emoji

### Base64 Tool (`src/routes/base64/+page.svelte`)

Features:
- Two-way conversion (encode/decode)
- Large textarea inputs
- Copy button for output
- Clear button
- Error handling for invalid Base64
- Preserve line breaks in encoding

### JSON Tool (`src/routes/json/+page.svelte`)

Features:
- Validation with error messages (line/column numbers)
- Format with 2 or 4 space indentation
- Minify option
- Copy button
- Clear button
- Consider using a library like `highlight.js` or `prism.js` for syntax highlighting

## Utility Functions

### `src/lib/utils/base64.ts`

```typescript
export function encodeBase64(input: string): string {
	return btoa(unescape(encodeURIComponent(input)));
}

export function decodeBase64(input: string): string {
	try {
		return decodeURIComponent(escape(atob(input)));
	} catch (error) {
		throw new Error('Invalid Base64 string');
	}
}
```

### `src/lib/utils/json.ts`

```typescript
export interface ValidationResult {
	valid: boolean;
	error?: string;
	line?: number;
	column?: number;
}

export function validateJSON(input: string): ValidationResult {
	try {
		JSON.parse(input);
		return { valid: true };
	} catch (error) {
		if (error instanceof SyntaxError) {
			const match = error.message.match(/position (\d+)/);
			const position = match ? parseInt(match[1]) : 0;
			const lines = input.substring(0, position).split('\n');
			return {
				valid: false,
				error: error.message,
				line: lines.length,
				column: lines[lines.length - 1].length
			};
		}
		return { valid: false, error: 'Unknown error' };
	}
}

export function formatJSON(input: string, indent: number = 2): string {
	const parsed = JSON.parse(input);
	return JSON.stringify(parsed, null, indent);
}

export function minifyJSON(input: string): string {
	const parsed = JSON.parse(input);
	return JSON.stringify(parsed);
}
```

## Dark Mode Implementation

Use DaisyUI's theme system with a toggle:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	
	let theme = 'light';
	
	onMount(() => {
		const stored = localStorage.getItem('theme') || 'light';
		theme = stored;
		document.documentElement.setAttribute('data-theme', theme);
	});
	
	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<button on:click={toggleTheme} class="btn btn-ghost">
	{#if theme === 'light'}
		🌙
	{:else}
		☀️
	{/if}
</button>
```

## Future Extension Guidelines

When adding new tools:

1. Create new route folder under `src/routes/[tool-name]/`
2. Add `+page.svelte` for the tool UI
3. Add utility functions in `src/lib/utils/[tool-name].ts` if needed
4. Update landing page to include new tool card
5. Update navigation component with new link
6. Follow the same patterns for:
   - Error handling
   - Copy to clipboard functionality
   - Clear/reset functionality
   - Responsive design
   - Dark mode support

## Testing Checklist

Before deploying:
- [ ] All tools work correctly in both light and dark mode
- [ ] Copy to clipboard works on all tools
- [ ] Error messages are clear and helpful
- [ ] Navigation works on all pages
- [ ] Theme persists on page reload
- [ ] Mobile responsive design works
- [ ] All TypeScript types are correct
- [ ] No console errors
- [ ] Build completes successfully
- [ ] Site loads quickly on Cloudflare Pages

## Deployment Steps

1. **Initial setup**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Configure GitHub secrets** (see GitHub Secrets Setup section above)

3. **Push changes** - GitHub Actions will automatically build and deploy

4. **Configure custom domain** in Cloudflare Pages dashboard for lakitu.dev

5. **Verify deployment** - Visit lakitu.dev and test all functionality

## Additional Notes

- All functionality is client-side, no backend required
- Tools should work offline after initial load
- Keep bundle size small for fast loading
- Use TypeScript strict mode for better type safety
- Follow SvelteKit best practices for routing and components
- Consider adding meta tags for SEO and social sharing
- Add a README.md with project information

## Success Criteria

The project is complete when:
1. Site is live at lakitu.dev
2. Both Base64 and JSON tools are fully functional
3. Dark mode toggle works and persists
4. Site is responsive on mobile and desktop
5. GitHub Actions workflow successfully deploys on push to main
6. Code is well-organized and easy to extend with new tools
7. All TypeScript types are properly defined
8. Error handling is comprehensive and user-friendly
