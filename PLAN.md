# Component Library — Master Plan

Working name: TBD. Goal: a component library whose UI/UX reads like apple.com —
typography-led, near-monochrome with one action color, huge whitespace, calm
motion — backed by a clean component architecture, baked-in accessibility, and a
verifiable security posture.

**Assumptions (correct any of these and the plan adjusts):**
- React 18+ with TypeScript (strict).
- Styling: build-time CSS (CSS Modules or vanilla-extract) + CSS custom properties for tokens. No runtime CSS-in-JS.
- Primary surface: marketing/product pages (apple.com-style). Primitives stay app-usable.
- pnpm + Turborepo monorepo, Storybook docs, Changesets releases.

---

## 1. Design language — decoding apple.com

What actually makes Apple's site feel like Apple, as observable, encodable rules:

1. **Typography does the design.** SF Pro / system font stack. Very large semibold
   headlines with slightly negative letter-spacing. 17px body. Few weights (400/600/700).
2. **Near-monochrome + one blue.** Almost everything is black/white/gray; a single
   blue carries every action and link.
3. **Whitespace is the layout.** ~980px content column, 100–150px vertical section
   padding, full-bleed product imagery.
4. **Alternating light/dark bands.** Dark sections are *scoped inversions* of the
   same tokens, not a separate theme.
5. **One primary action per view.** Pill button + a quiet "Learn more ›" text link.
   Never two competing buttons.
6. **Minimal chrome.** 44px global nav with translucent blurred backdrop. Almost no
   borders or drop shadows; depth comes from blur and imagery.
7. **Calm motion.** Slow eased scroll reveals, sticky scroll sequences,
   transform/opacity only, `prefers-reduced-motion` fully honored.

### 1.1 Color tokens (observed values — starting points, tune in review)

| Semantic token | Light | Dark band | Source role on apple.com |
|---|---|---|---|
| `color.bg.base` | `#ffffff` | `#000000` | page / dark sections |
| `color.bg.subtle` | `#f5f5f7` | `#1d1d1f` | alternating gray bands, footer |
| `color.text.primary` | `#1d1d1f` | `#f5f5f7` | headlines, body |
| `color.text.secondary` | `#6e6e73` | `#a1a1a6` | subheads, captions |
| `color.text.tertiary` | `#86868b` | `#86868b` | footer legal, fine print |
| `color.action.primary` | `#0071e3` | `#0071e3` | CTA buttons |
| `color.action.primary-hover` | `#0077ed` | `#0077ed` | button hover |
| `color.link` | `#0066cc` | `#2997ff` | "Learn more" links |
| `color.border` | `#d2d2d7` | `#424245` | hairlines, dividers |
| `color.focus-ring` | `#0071e3` @ 4px offset | same | keyboard focus |

Token tiers: **primitive** (`blue-600: #0071e3`) → **semantic** (`color.action.primary`)
→ optional **component** (`button.bg`). Components consume semantic tokens only.
Theme switching = `[data-theme="dark"]` re-maps semantic tokens; a dark *band* on a
light page is the same mechanism scoped to a section.

### 1.2 Type scale

System stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
"Helvetica Neue", Helvetica, Arial, sans-serif` — zero font download cost, which is
itself a performance decision Apple makes.

| Token | Size / line-height | Tracking | Weight | Use |
|---|---|---|---|---|
| `display-xl` | clamp(48px, 8vw, 96px) / 1.05 | -0.02em | 700 | hero headline |
| `display` | clamp(40px, 6vw, 64px) / 1.08 | -0.015em | 600 | section headline |
| `title-1` | 40px / 1.15 | -0.01em | 600 | large section |
| `title-2` | 32px / 1.2 | -0.008em | 600 | card/feature title |
| `title-3` | 24px / 1.25 | 0 | 600 | subsection |
| `headline` | 20px / 1.3 | 0 | 600 | emphasized body |
| `body` | 17px / 1.47 | 0 | 400 | default body |
| `caption` | 14px / 1.4 | 0 | 400 | secondary text |
| `footnote` | 12px / 1.35 | 0 | 400 | nav links, legal |

### 1.3 Space, radius, motion, breakpoints

- **Spacing:** 4px base; scale `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.
  Section padding: `clamp(80px, 12vw, 160px)` vertical. Content max-width: 980px
  (wide media: 1200px; full-bleed allowed).
- **Radius:** `sm 8, md 12, lg 18, xl 28, pill 999px`. Buttons = pill. Tiles = lg/xl.
- **Shadows:** essentially none. Depth = backdrop blur (`saturate(180%) blur(20px)`)
  on nav/overlays only.
- **Motion:** durations `fast 200ms, base 350ms, slow 600ms, reveal 800ms`;
  easing `cubic-bezier(0.28, 0.11, 0.32, 1)` (Apple-style long-tail ease).
  Reveal pattern: opacity 0→1 + translateY(24px)→0, triggered once by
  IntersectionObserver. Reduced motion: all of it collapses to instant.
- **Breakpoints:** `sm ≤734px`, `md 735–1068px`, `lg ≥1069px` (Apple's actual
  breakpoints), plus optional `xl ≥1440px`. Mobile-first.

---

## 2. UX rules — why it feels right, encoded as library rules

1. **One message per section.** Eyebrow → headline → subhead → CTA pair. Blocks
   enforce this structure; they don't accept arbitrary kitchen-sink children.
2. **Clarity, deference, depth** (Apple HIG) translated to web: content first,
   chrome minimal, layering only where it aids comprehension (nav, modal).
3. **Progressive disclosure.** Details live behind links, accordions, dialogs —
   never all at once.
4. **Predictability.** Same nav, footer, CTA pattern, and link affordance
   ("Learn more ›") everywhere. The library makes the consistent path the easy path.
5. **Accessibility is table stakes, not a feature:**
   - WCAG 2.2 AA contrast on every token pair (checked in CI).
   - Visible focus ring on everything interactive; full keyboard support per
     WAI-ARIA Authoring Practices.
   - Semantic landmarks, heading order, alt text required on media components.
   - Hit targets ≥44px. `prefers-reduced-motion` respected globally.
6. **Performance is UX.** System fonts, no layout shift (explicit media dimensions),
   lazy media below the fold, compositor-only animation, SSR-rendered hero content
   (never JS-gated).

---

## 3. Component logic & architecture

### 3.1 Four layers, strict dependency direction

```
tokens  →  primitives (headless behavior)  →  components (styled)  →  blocks (page patterns)
```

- **tokens**: CSS custom properties + exported TS constants. Single source of truth;
  synced from Figma via Tokens Studio.
- **primitives**: behavior only — state machines, ARIA wiring, focus management,
  keyboard interaction. **Adopt React Aria (or Radix Primitives) here rather than
  rebuilding focus traps and combobox logic by hand.** We own the visual layer;
  we don't reinvent a11y plumbing.
- **components**: styled, token-consuming, variant-driven. This is the public API.
- **blocks**: opinionated page sections (Hero, TileGrid, Footer) composed from
  components. Blocks encode the apple.com layout rules from §1–2.

### 3.2 API conventions (every component follows these)

- Props: `variant`, `size`, `tone` — never one-off style props. Escape hatch is
  `className`/`style`, merged last.
- Polymorphism via `asChild` (Radix-style slot) — a Button can render an `<a>`
  without nesting interactive elements.
- Compound components for multi-part UI: `Dialog.Root / Trigger / Content / Title`.
- Controlled **and** uncontrolled (`open`/`defaultOpen`/`onOpenChange`).
- `forwardRef` + `displayName` on everything; `data-state` attributes exposed for
  styling and animation hooks.
- Forms: a `Field` wrapper wires `label`, `description`, `error` to the control via
  `aria-describedby`/`aria-invalid` automatically.

```tsx
// Public API shape — Button
<Button variant="primary" size="md" asChild>
  <a href="/buy">Buy</a>
</Button>
<Button variant="secondary">Learn more</Button>   // renders pill outline
<Link href="/details" trailing="chevron">Learn more</Link>  // the quiet blue link

// Dialog — compound, headless behavior underneath
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger asChild><Button>Open</Button></Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>…</Dialog.Title>
    <Dialog.Description>…</Dialog.Description>
    <Dialog.Close asChild><Button variant="secondary">Done</Button></Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
```

### 3.3 State logic for interactive components

Overlay family (Dialog, Sheet, Menu, Popover) runs a finite state machine:
`closed → opening → open → closing → closed`, with:
focus trap while open, scroll lock, Escape/outside-click dismiss, focus returned to
trigger on close, exit animation before unmount. No ad-hoc boolean soup.

### 3.4 Styling & theming mechanics

- Build-time CSS (CSS Modules or vanilla-extract) referencing CSS variables.
  **No runtime style injection** → CSP-friendly by default (see §5).
- Variants via a `cva`-style recipe map; each variant resolves to token references,
  never raw hex.
- Scoped inversion: `<Section theme="dark">` sets `data-theme="dark"` locally;
  every child re-resolves tokens. This is how apple.com alternates bands.
- RTL/i18n: logical properties only (`margin-inline-start`, `padding-inline`),
  `dir`-aware icons (chevrons flip).

### 3.5 SSR & motion

- No `window`/`document` at module scope; stable IDs via `useId`; hydration-safe.
- Motion module: `useReveal()` (IntersectionObserver, fires once),
  `useScrollProgress()` (rAF-throttled, for sticky sequences), a global
  reduced-motion kill switch. Transform/opacity only — nothing that triggers layout.

---

## 4. Component inventory & build order

| Tier | Components |
|---|---|
| **Primitives** | Button, Link, Text/Heading, Icon, Image, Input, Textarea, Select, Checkbox, Radio, Switch, Field, Stack, Grid, Container, VisuallyHidden, Spinner, Skeleton |
| **Composites** | NavBar, Menu/Dropdown, Dialog, Sheet, Tabs, Accordion, Tooltip, Toast, Card/Tile, Pagination, Breadcrumb |
| **Blocks** | Hero, FeatureSection, TileGrid, StatBand, CTASection, Gallery/Carousel, Footer |

Build order = table order. Each component ships with: implementation, stories
(all variants/states), unit + interaction tests, axe pass, visual baseline, docs
page with do/don't.

---

## 5. Security — design controls + how we verify them

### 5.1 Threat model (library-specific, STRIDE-lite)

| Threat | Surface | Control |
|---|---|---|
| XSS | `href`/`src`/`action` props, rich text, SVG | protocol allowlist; no `dangerouslySetInnerHTML` in public API; sanitized SVG |
| Supply chain | dependencies, publish pipeline | minimal deps, lockfile, provenance, SBOM |
| CSP breakage | runtime styles/scripts | build-time CSS, no eval, no inline handlers |
| Prototype pollution | prop merging, theme merge | no deep-merge of untrusted objects; `Object.hasOwn`; frozen tokens |
| Data leakage | password/OTP fields, telemetry | correct `autocomplete`, never logged, zero telemetry in library |
| Clickjacking / embed abuse | iframe-based embeds, postMessage | `sandbox` allowlist, origin checks |
| DoS | input masks, regex validation | no catastrophic-backtracking regex; bounded lengths |

### 5.2 Concrete controls

1. **URL props** (`href`, `src`, `action`, `formAction`) validated against an
   allowlist: `http:`, `https:`, `mailto:`, `tel:`, relative. `javascript:` and
   `data:` rejected at render. External `target="_blank"` always gets
   `rel="noopener noreferrer"`.
2. **No raw HTML injection** in the public API. If a `RichText` component is ever
   needed: DOMPurify with a strict allowlist, documented as the only sanitization
   boundary.
3. **Icons are React components**, not injected strings. Any user-supplied SVG goes
   through DOMPurify's SVG profile.
4. **CSP-compatible by construction:** build-time CSS, no `eval`, no inline event
   handlers, no runtime `<style>` injection. Ship a `security.md` documenting the
   exact `style-src`/`img-src` needs for consumers.
5. **Supply chain:** target zero runtime deps beyond React (headless lib is the one
   exception, pinned exact). Lockfile committed; `npm audit` + OSV-Scanner in CI;
   Renovate for updates; publish via npm **trusted publishing (OIDC) with
   provenance**; 2FA on maintainer accounts; CycloneDX SBOM attached to every release.
6. **No unsafe merging:** theme/prop merges are shallow and own-property-checked;
   token objects frozen. No `lodash.merge` on anything consumer-supplied.
7. **Sensitive inputs:** password/OTP components set correct `autocomplete`
   (`current-password`, `one-time-code`), never echo values into logs or analytics;
   the library contains no telemetry at all.
8. **Cross-frame:** any `postMessage` listener checks `event.origin` against an
   explicit allowlist; embeds use `sandbox` with minimal permissions.

### 5.3 Verification — how we *confirm* security, not just claim it

**CI gates (all blocking):**
- `npm audit` / OSV-Scanner on every PR; GitHub dependency review.
- Secret scanning (gitleaks) on every push.
- SAST: Semgrep (JS/TS rules) or CodeQL on every PR.
- axe-core run against **every Storybook story**; token-pair contrast check.
- Import-cost budget per component (see §6).
- Fuzz/property tests on prop boundaries: malformed URLs, HTML strings in text
  props, oversized values, `__proto__` keys in theme objects — assert fail-closed.

**Manual, per component before it's "done":**
- Keyboard-only walkthrough (Tab/Shift-Tab/Escape/arrows per APG).
- Screen-reader smoke test (VoiceOver + NVDA) for overlays and forms.
- Threat-model checklist review for anything new that accepts URLs, HTML, or
  cross-frame messages.

**Release gate:** all CI green + provenance attestation + SBOM + signed tag +
`security.md` updated. Changesets enforces the changelog; no silent publishes.

---

## 6. Quality gates (beyond security)

- **Testing:** Vitest + React Testing Library (unit + interaction), Playwright for
  visual baselines and keyboard flows, an SSR/hydration smoke test per component.
- **Performance budgets:** ≤5KB gzip per component (target, enforced via
  import-cost in CI); verified tree-shaking (`sideEffects: false`, per-component
  exports); CLS = 0; animation at 60fps on mid-tier mobile.
- **Docs:** Storybook + MDX; every component gets usage, prop table, do/don't,
  accessibility notes, and a live token playground.
- **Visual regression:** Chromatic or Playwright screenshots, light + dark + RTL
  baselines per variant.

---

## 7. Repo & delivery

```
component-library/
├── packages/
│   ├── tokens/        # CSS vars + TS constants, Figma sync
│   ├── primitives/    # headless behavior (React Aria/Radix wrappers)
│   ├── components/    # styled public API
│   └── blocks/        # page sections
├── apps/
│   └── docs/          # Storybook site
├── .github/workflows/ # ci, release, security
└── turbo.json, pnpm-workspace.yaml, .changeset/
```

ESM-first, per-component entry points, Changesets + semver, RFC template for new
components, deprecation policy (one minor of warning before removal).

---

## 8. Roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 — Foundations (wk 1) | decisions locked, monorepo scaffold, tokens v0, CI + Storybook skeleton | token PR passes contrast + build gates |
| 1 — Primitives (wk 2–3) | Button, Link, Text, Icon, Image, form controls, layout | all stories + tests + axe green |
| 2 — Composites (wk 4–5) | NavBar, Dialog, Menu, Tabs, Accordion, Tooltip, Toast, Card | keyboard + SR audit passed |
| 3 — Blocks & motion (wk 6) | Hero, FeatureSection, TileGrid, Footer, reveal/scroll system | demo page reads like apple.com |
| 4 — Hardening (wk 7) | full a11y audit, visual baselines, security review, perf budgets | v0.1.0 published with provenance + SBOM |

---

## 9. Decisions to lock before Phase 0 ends

1. **Framework** — React assumed. (Vue/Svelte/Web Components changes §3, not §1–2.)
2. **Styling engine** — vanilla-extract (typed, build-time) vs CSS Modules (simpler)
   vs Tailwind (fast, but token discipline needs config).
3. **Behavior layer** — React Aria (Adobe, most complete a11y) vs Radix (lighter,
   simpler API) vs fully own (not recommended).
4. **Scope** — marketing surfaces only, or also dense app UI (tables, data grid)?
   Affects density tokens and inventory.
5. **Name + npm scope**, and whether Figma is the token source of truth.
