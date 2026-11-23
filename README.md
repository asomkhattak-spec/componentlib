# componentlib

A static component-library site: browse UI snippets with live previews, copy the
HTML/CSS/JS — or switch to the React or Vue variant. Built with Astro; components
are plain files in git; no database.

## Quick start

```sh
npm install
npm run dev        # registry build + dev server on http://localhost:4321
```

## Commands

| Command             | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `npm run dev`       | Build registry, start Astro dev server                              |
| `npm run build`     | Build registry + static site → `dist/`                              |
| `npm run preview`   | Serve the built `dist/` locally                                     |
| `npm run validate`  | CI gate: schema validation + preview compilation (no output writes) |
| `node scripts/smoke-test.mjs` | Headless-browser test of the built site (needs `astro preview` running; set `CHROME_PATH`) |

## Architecture

```
components/<category>/<slug>/     source of truth — one folder per component
  meta.json                       title, slug, category, tags, variants, preview
  vanilla/  index.html style.css script.js
  react/    Component.jsx style.css demo.jsx
  vue/      Component.vue demo.js
scripts/build-registry.mjs        validates schema, compiles React/Vue preview
                                  bundles (esbuild), emits public/registry.json
src/pages/                        gallery, per-component pages, contribute guide
src/lib/preview.ts                sandboxed iframe composition (allow-scripts only)
```

- **Previews are sandboxed iframes** (`sandbox="allow-scripts"`, no
  `allow-same-origin`): component code can never touch the site, its storage, or
  its origin. Vanilla snippets are inlined into `srcdoc`; React/Vue variants load
  precompiled IIFE bundles from `public/previews/`.
- **Code highlighting** happens at build time with Shiki — zero client cost.
- **Search** is client-side Fuse.js over `registry.json`; category chips filter
  the static grid. Deep links: `/?category=loaders`.
- **Theming** follows the OS via `color-scheme` + `light-dark()` with a
  `prefers-color-scheme` fallback; the header toggle stores an explicit override
  in `localStorage` and broadcasts it to preview frames via `postMessage`
  (Safari ignores the parent scheme inside iframes).
- **Downloads**: per-file copy, copy-all, and a client-side `.zip` (JSZip,
  lazy-loaded) including a ready-to-open `demo.html` for vanilla variants.

## Adding a component

1. Create `components/<category>/<slug>/` with `meta.json` + `vanilla/` files.
2. Optionally add `react/` and/or `vue/` variants (see `/contribute` on the site).
3. `npm run validate` — the same gate CI runs on every PR.
4. Open a pull request. Merge → rebuild → live.

CSS classes must be prefixed per component (e.g. `ng-`) so snippets never
collide; animations must honor `prefers-reduced-motion`.

## Deployment

`dist/` is fully static — deploy to any static host (Netlify, Vercel, GitHub
Pages, Cloudflare Pages). Build command: `npm run build`. Output: `dist/`.

## Roadmap

- **Phase 5 — admin submissions**: an authenticated form that validates a
  submission and opens a PR via the GitHub API, keeping files-in-git as the
  source of truth (moderation = PR review). Requires a host with server
  functions (e.g. Vercel) and GitHub OAuth credentials.
