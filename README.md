# Lakitu.dev - Developer Utility Tools

A collection of free, fast, and privacy-focused utility tools for developers. All processing happens client-side - your data never leaves your browser.

## Features

- **Base64 Encoder/Decoder**: Convert text to Base64 or decode Base64 back to text with full Unicode support
- **JSON Formatter/Validator**: Format, validate, and minify JSON with syntax highlighting and detailed error messages
- **Dark Mode**: Automatic dark mode support with manual toggle
- **Privacy First**: All tools run entirely in your browser
- **Responsive**: Works on all screen sizes

## Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS 4.x + DaisyUI 5.x
- **Syntax Highlighting**: Prism.js
- **Deployment**: Cloudflare Pages
- **CI/CD**: GitHub Actions

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

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

### Manual Deployment

```bash
npm run build
# Deploy .svelte-kit/cloudflare directory to Cloudflare Pages
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
3. Add a new ToolCard entry in `src/routes/+page.svelte`
4. Add navigation link in `src/lib/components/Navigation.svelte`

## License

MIT
