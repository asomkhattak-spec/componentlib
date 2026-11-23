// Preview engine: composes sandboxed iframe documents from registry entries.
// Vanilla variants inline HTML/CSS/JS into srcdoc; React/Vue variants load a
// precompiled IIFE bundle built by scripts/build-registry.mjs. Every iframe
// runs with sandbox="allow-scripts" only — component code cannot reach the
// parent page, its storage, or its origin.

export interface PreviewSpec {
  kind: 'vanilla' | 'bundle';
  html?: string;
  css?: string;
  js?: string;
  bundle?: string;
  background: 'light' | 'dark' | 'auto';
  height: number;
  /** Interactive previews (component page) vs static thumbnails (gallery). */
  interactive: boolean;
}

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    display: grid;
    place-items: center;
    min-height: 100vh;
    padding: 1rem;
    font-family: system-ui, sans-serif;
  }
  html[data-scheme="light"] { color-scheme: light; background: #f6f7f9; color: #171c26; }
  html[data-scheme="dark"] { color-scheme: dark; background: #0b0e14; color: #e8ecf3; }
`;

// Theme bridge: the parent posts the resolved scheme because Safari resolves
// prefers-color-scheme to the OS setting inside iframes, ignoring the parent.
const THEME_BRIDGE = `
  addEventListener('message', function (e) {
    if (e.data && e.data.type === 'preview-theme') {
      document.documentElement.dataset.scheme = e.data.scheme;
    }
  });
`;

export function resolveScheme(background: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (background !== 'auto') return background;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta?.content === 'dark') return 'dark';
  if (meta?.content === 'light') return 'light';
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function escapeScript(code: string): string {
  // Prevent a literal </script> inside component JS from closing the tag.
  return code.replace(/<\/script/gi, '<\\/script');
}

export function buildSrcdoc(spec: PreviewSpec, scheme: 'light' | 'dark'): string {
  const bridge = spec.interactive ? `<script>${THEME_BRIDGE}<\/script>` : '';
  if (spec.kind === 'vanilla') {
    return `<!doctype html>
<html data-scheme="${scheme}">
<head><meta charset="utf-8"><style>${BASE_CSS}</style><style>${spec.css ?? ''}</style></head>
<body>
${spec.html ?? ''}
${spec.js ? `<script>${escapeScript(spec.js)}<\/script>` : ''}
${bridge}
</body>
</html>`;
  }
  return `<!doctype html>
<html data-scheme="${scheme}">
<head><meta charset="utf-8"><style>${BASE_CSS}</style>${spec.css ? `<style>${spec.css}</style>` : ''}</head>
<body>
<div id="app"></div>
<script src="${spec.bundle}"><\/script>
${bridge}
</body>
</html>`;
}

export function mountPreview(frame: HTMLIFrameElement, spec: PreviewSpec): void {
  const scheme = resolveScheme(spec.background);
  // Scripts always allowed so React/Vue thumbnails render; the sandbox has
  // no allow-same-origin, so component code stays fully isolated either way.
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.style.height = `${spec.height}px`;
  frame.srcdoc = buildSrcdoc(spec, scheme);
}

export function rethemePreview(frame: HTMLIFrameElement, spec: PreviewSpec): void {
  const scheme = resolveScheme(spec.background);
  if (spec.interactive) {
    frame.contentWindow?.postMessage({ type: 'preview-theme', scheme }, '*');
  } else {
    // Static thumbnails have no script allowance: rebuild the document.
    frame.srcdoc = buildSrcdoc(spec, scheme);
  }
}
