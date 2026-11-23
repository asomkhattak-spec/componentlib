# SKILL: componentlib — study → rebuild → ship pipeline

One constant file. Read this before adding any component to componentlib.
It encodes the sources, the extraction recipe, the animation reasoning,
the build rules, and the deploy loop — so any session can repeat the
pipeline without re-deriving it.

## Constants

```
REPO            /root/component-library
GITHUB          https://github.com/asomkhattak-spec/componentlib  (branch: main)
VERCEL_PROJECT  componentlib (team achme17)
PRODUCTION_URL  https://componentlib-beta.vercel.app
UIVERSE_MIRROR  /root/.config/opencode/skills/uiverse-web-builder   (3,802 MIT components, local — prefer over scraping)
SEARCH_TOOL     python3 $UIVERSE_MIRROR/scripts/search.py
CHROME_PATH     /data/data/com.termux/files/usr/bin/chromium-browser
SMOKE_TEST      node scripts/smoke-test.mjs   (needs `npx astro preview --port 4321` running)
```

## Sources (ranked)

1. **Local Uiverse mirror** (skill `uiverse-web-builder`) — the exact corpus
   uiverse.io serves, MIT, indexed with technique detectors. No network, no
   Cloudflare. Always first choice.
2. **uiverse.io live** — only if the mirror is stale. Plain HTTP gets 403
   (Cloudflare); real headless Chromium passes. Recipe:
   `scripts/scrape-uiverse.mjs` — fresh page per element, abort
   images/fonts/analytics, `protocolTimeout: 240000`, code lives in
   `<pre>/<code>` (HTML block starts with `<`, CSS block has `{}`).
3. cssbuttons.io, getcssscan.com — fallbacks, same extraction logic.

## Study procedure (plan → reason → build)

1. **Search** 2–3 vocabulary variants per slot:
   `python3 $SEARCH_TOOL --query "gradient border glow button" --limit 8`
   (`--tags` / `--techs` show the vocabulary; `--id <id>` reads full source;
   `--id <id> --integrate <prefix>` gives namespaced copy-ready code).
2. **Choose on mechanism quality**, not tag count: shared easing across
   children, transform/opacity motion, real inputs, em-based sizing.
3. **Reason the animation before writing code.** Write down: what layer
   moves, what property animates, what the hover/active/focus states do,
   what the timing curve is. Then rebuild it with the fixes below —
   never paste the corpus CSS raw.
4. **House easings** (measured from the corpus — use before inventing):
   - hover fills/blooms: `cubic-bezier(0.23, 1, 0.32, 1)` (out-quint, 114 uses)
   - overshoot pops: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (out-back)
   - toggles/drawers: `cubic-bezier(0.15, 0.83, 0.66, 1)` (out-circ)
   - durations: hover 0.3–0.6s · press 0.15–0.3s · ambient 1–2s · press scale 0.95–0.97

## Rebuild rules (non-negotiable)

- **Namespace everything**: 2–3 letter prefix per component (`ag-`, `ng-`,
  `rp-`…). Classes AND keyframes. No bare element selectors.
- **Compositor-safe motion**: animate `transform`/`scale`/`opacity` only.
  Animated `filter: blur()` → pre-render the blurred layer once, animate its
  opacity. Animated `left/width/box-shadow` → translate/scaleX/opacity.
- **Stacking safety**: glow layers at `z-index: -1` need `isolation: isolate`
  on the wrapper, or they escape behind the host page.
- **Keyboard parity**: every `:hover` effect also fires on `:focus-within`
  / `:focus-visible`; visible focus outline.
- **Reduced motion**: corpus ships it in 7/3802 files — we add it to 100%.
  `@media (prefers-reduced-motion: reduce)` kills transitions/animations.
- **Attribution**: keep `technique after <author>, Uiverse.io — MIT` in the
  CSS header comment and `meta.json` author field.
- **Three variants**: vanilla (index.html + style.css + optional script.js),
  react (OneComponent.jsx + style.css + demo.jsx importing `./Component`),
  vue (OneComponent.vue + demo.js importing `./Component.vue`).

## Worked example — buttons/aurora-glow (2026-11-23)

- **Studied**: `Spacious74_horrible-horse-4` (uiverse.io/Spacious74/horrible-horse-4).
- **Original logic**: wrapper `padding: 3px` + gradient background = the
  border; inner opaque black button covers the middle; `::before` copies
  the gradient at `z-index: -10` and animates `filter: blur(0 → 1.2em)` on
  hover (bloom) and back to `0.2em` on `:active` (snap tight). 0.4s ease.
- **Weaknesses found**: animating `filter` repaints every frame; no keyboard
  path; no reduced-motion; bare `button {}` selector; negative z escapes.
- **Rebuild**: same geometry/timing; blur pre-rendered static, hover animates
  `opacity 0 → 1` (0.4s out-quint), active drops to 0.25 (0.15s) + button
  `scale: 0.97`; `:focus-within` blooms; `isolation: isolate`; `ag-` prefix;
  reduced-motion block. Colors cyan→fuchsia to match the site accent family.

## Ship loop (auto)

```sh
cd /root/component-library
npm run validate                 # schema + preview compile gate (CI runs this too)
npm run build                    # registry + static site
node scripts/smoke-test.mjs      # 21+ headless checks (start preview server first)
git add -A && git commit -m "Add <component>"
git push origin main             # Vercel git integration auto-deploys main
# manual fallback: vercel deploy --prod --yes
```

- Long commands (scrape, build, deploy) run as **background shell commands**
  so the session auto-wakes on completion — never poll, never sleep-loop.
- **Auto-deploy**: push to `main` → `.github/workflows/deploy.yml` validates
  and runs `vercel deploy --prod` using the `VERCEL_TOKEN` repo secret
  (org/project IDs pinned in the workflow env). The Vercel GitHub App link
  was unavailable (account lacks a GitHub Login Connection); Actions is the
  equivalent loop and needs no dashboard step.
- Operator style: no confirmation questions on clear orders; assume the most
  useful reading, state the assumption in one line, ship whole. Irreversible
  external actions already authorized by the standing ticket: git push,
  vercel prod deploy.

## Site architecture facts (don't re-derive)

- Astro static; components are files in `components/<category>/<slug>/`.
- `scripts/build-registry.mjs` validates meta.json, compiles React/Vue demo
  bundles with esbuild (jsx: 'automatic'), emits `public/registry.json` +
  `public/previews/*.js`. Broken component = failed build, never ships.
- Previews: sandboxed iframes (`allow-scripts`, no `allow-same-origin`).
  Gallery previews are INTERACTIVE; navigation is on title/description/
  "Get code" only. Theme syncs into frames via postMessage (Safari ignores
  parent color-scheme in iframes).
- JSON islands must escape `<` as `\u003c` (see [slug].astro clientJson).
- Code tabs: build-time Shiki; `hidden="until-found"` panels + beforematch.
