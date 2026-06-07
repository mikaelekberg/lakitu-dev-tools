---
name: lakitu-dev-tools
description: Conventions, constraints, and patterns for the lakitu-dev-tools SvelteKit site hosted on Cloudflare Pages. Load this when reviewing, writing, or refactoring code in this repo.
license: MIT
compatibility: opencode
metadata:
  stack: SvelteKit, TypeScript, Tailwind, DaisyUI
  hosting: Cloudflare Pages
  adapter: adapter-cloudflare
---

## Project overview

`lakitu-dev-tools` is a developer utility site built with SvelteKit and deployed to Cloudflare Pages via `@sveltejs/adapter-cloudflare`. The adapter is configured with `routes.exclude: ['<all>']`, which tells Cloudflare Pages to serve static assets directly without invoking the Worker. Page routes are server-side rendered by the Cloudflare Worker at the edge — there is no explicit `export const prerender = true` on any route.

## Stack

- **SvelteKit** with `adapter-cloudflare`
- **TypeScript** (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **DaisyUI** for component classes
- **Cloudflare Pages** for hosting

---

## SvelteKit conventions

### Routing & layout

- Routes do not set `export const prerender = true` — the project relies on default SSR from `adapter-cloudflare`. If a route should be prerendered, add `export const prerender = true` in its `+page.ts` or set it globally in a root `+layout.ts`.
- Never create `+server.ts` files — there is no server-side API surface in this project.
- Use `+page.ts` (not `+page.server.ts`) for any load functions. No server-side load functions.
- Keep load functions pure and side-effect free — they run on every request via the Worker.

### Stores & reactivity

- Prefer Svelte 5 runes (`$state`, `$derived`, `$effect`) over legacy stores.
- If using legacy stores, always unsubscribe in `onDestroy` or use the `$` auto-subscription syntax.
- Avoid `$effect` for things that can be expressed as `$derived`.
- Navigation.svelte imports `page` from `$app/stores` — this is fine in layout-level components, but avoid importing `$page` in deeply nested components without confirming it's available.

### Components

- One component per file, PascalCase filename (`ToolCard.svelte`, not `tool-card.svelte`).
- Props typed explicitly with TypeScript — no implicit `any`.
- Prefer `snippet` over slot where SvelteKit version supports it.
- Keep components focused — extract logic into `.ts` utility files rather than bloating component scripts.

---

## Cloudflare adapter constraints

These rules matter for this project's setup.

### Hard rules

- **No `+server.ts`** — will not be served, causes confusing build artifacts.
- **No `$env/dynamic/private`** — unavailable in Cloudflare Workers without a secrets setup (and not used here).
- **No `$env/dynamic/public` at runtime** — use `$env/static/public` (build-time only) or `import.meta.env` via Vite.
- **No `handle` hooks** — `hooks.server.ts` does not run in Cloudflare Pages without explicit Worker configuration.
- **No server-side `fetch` with relative URLs** — use absolute URLs or import data directly.

### Cloudflare Pages specifics

- Static assets in `static/` are served as-is; use this for `_headers`, `_redirects`, favicons, and other Cloudflare-specific files.
- The `_headers` file controls response headers (CSP, cache-control, etc.) — do not try to set headers in code.
- The `_redirects` file handles URL redirects — do not create SvelteKit redirect routes for things that can live here (the file doesn't exist yet but can be added when needed).
- Build output goes to `.svelte-kit/cloudflare` — do not reference this path in code.
- Environment variables must be set in the Cloudflare Pages dashboard and accessed via `$env/static/public` (prefixed `PUBLIC_`) at build time.

---

## TypeScript strictness

The project uses strict TypeScript. Enforce these:

- No `any` — use `unknown` and narrow, or define a proper type. (ToolCard.svelte uses `any` for lucide-svelte icon components as a known exception.)
- No non-null assertions (`!`) unless you can justify it with a comment.
- Prefer `type` over `interface` for object shapes (consistent with the codebase).
- All function parameters and return types must be explicitly annotated in utility files; Svelte component props can use inference where unambiguous.
- Use `satisfies` over `as` for type assertions where possible.
- Imports: use `import type` for type-only imports.

---

## Tailwind & DaisyUI

- Tailwind v4 is configured via the `@tailwindcss/vite` plugin (plus a `postcss.config.js` using `@tailwindcss/postcss`). There is no `tailwind.config.js` — do not create one.
- Use DaisyUI component classes (`btn`, `card`, `badge`, `alert`, etc.) for UI primitives — do not hand-roll these with raw Tailwind.
- Use Tailwind utilities for layout, spacing, and custom overrides on top of DaisyUI components.
- Theme tokens come from DaisyUI (`bg-base-100`, `text-base-content`, `bg-primary`, etc.) — avoid hardcoded colors.
- Responsive variants follow mobile-first (`sm:`, `md:`, `lg:`).
- `@apply` is used in `src/app.css` (for Prism.js overrides) but should not be introduced in component `<style>` blocks — compose classes in markup instead.

---

## Review checklist

When reviewing a branch or PR in this repo, flag:

1. **Critical** — any `+server.ts`, `hooks.server.ts`, `$env/dynamic/private`, or server-side `fetch` with relative URLs.
2. **Critical** — dynamic routes without `entries()` or a prerender strategy, if prerendering is introduced on that route.
3. **Critical** — introduction of `+page.server.ts` without understanding it runs on every Worker request.
4. **Warning** — `any` types, non-null assertions without justification, missing `import type`.
5. **Warning** — hardcoded color values instead of DaisyUI theme tokens.
6. **Warning** — `@apply` in component style blocks, or raw Tailwind reimplementing a DaisyUI component.
7. **Warning** — reactive logic in `$effect` that should be `$derived`.
8. **Suggestion** — components over ~150 lines that could be split.
9. **Suggestion** — logic in `+page.svelte` scripts that belongs in a utility module.

Finally, confirm: **does this build and deploy correctly with adapter-cloudflare?** Any doubt → flag it.
