// Registry builder: scans components/, validates every meta.json against the
// schema, reads variant sources, compiles React/Vue preview bundles with
// esbuild, and emits public/registry.json + public/previews/*.js.
//
// Usage:
//   node scripts/build-registry.mjs                # full build
//   node scripts/build-registry.mjs --validate-only  # CI gate: schema + compile checks
//
// Fails the process (exit 1) on any malformed component so a broken
// submission can never reach the site.

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_DIR = path.join(ROOT, 'components');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PREVIEWS_DIR = path.join(PUBLIC_DIR, 'previews');
const VALIDATE_ONLY = process.argv.includes('--validate-only');

const VARIANTS = ['vanilla', 'react', 'vue'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const errors = [];
const fail = (where, msg) => errors.push(`[${where}] ${msg}`);

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

function validateMeta(meta, where) {
  const required = ['title', 'slug', 'category', 'tags', 'description', 'variants', 'author', 'createdAt'];
  for (const key of required) {
    if (!(key in meta)) fail(where, `missing required field "${key}"`);
  }
  if (typeof meta.title !== 'string' || !meta.title.trim()) fail(where, 'title must be a non-empty string');
  if (typeof meta.slug !== 'string' || !SLUG_RE.test(meta.slug)) fail(where, `slug "${meta.slug}" must be kebab-case`);
  if (typeof meta.category !== 'string' || !SLUG_RE.test(meta.category)) fail(where, `category "${meta.category}" must be kebab-case`);
  if (!Array.isArray(meta.tags) || meta.tags.some((t) => typeof t !== 'string' || !t.trim())) {
    fail(where, 'tags must be an array of non-empty strings');
  }
  if (typeof meta.description !== 'string' || !meta.description.trim()) fail(where, 'description must be a non-empty string');
  if (!Array.isArray(meta.variants) || meta.variants.length === 0) {
    fail(where, 'variants must be a non-empty array');
  } else {
    if (!meta.variants.includes('vanilla')) fail(where, 'variants must include "vanilla"');
    for (const v of meta.variants) {
      if (!VARIANTS.includes(v)) fail(where, `unknown variant "${v}" (allowed: ${VARIANTS.join(', ')})`);
    }
    if (new Set(meta.variants).size !== meta.variants.length) fail(where, 'duplicate entries in variants');
  }
  if (typeof meta.author !== 'string' || !meta.author.trim()) fail(where, 'author must be a non-empty string');
  if (typeof meta.createdAt !== 'string' || Number.isNaN(Date.parse(meta.createdAt))) fail(where, 'createdAt must be a parseable date');
  if (meta.preview !== undefined) {
    if (typeof meta.preview !== 'object' || meta.preview === null) {
      fail(where, 'preview must be an object');
    } else {
      if (meta.preview.background !== undefined && !['light', 'dark', 'auto'].includes(meta.preview.background)) {
        fail(where, 'preview.background must be "light", "dark", or "auto"');
      }
      if (meta.preview.height !== undefined && (!Number.isInteger(meta.preview.height) || meta.preview.height < 80 || meta.preview.height > 1200)) {
        fail(where, 'preview.height must be an integer between 80 and 1200');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Variant source reading
// ---------------------------------------------------------------------------

async function readIfExists(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function readVanilla(dir, where) {
  const html = await readIfExists(path.join(dir, 'index.html'));
  const css = await readIfExists(path.join(dir, 'style.css'));
  const js = await readIfExists(path.join(dir, 'script.js'));
  if (html === null) fail(where, 'vanilla/index.html is required');
  if (css === null && js === null) fail(where, 'vanilla needs at least style.css or script.js');
  return { html: html ?? '', css: css ?? '', js: js ?? '' };
}

async function readReact(dir, where) {
  const entries = await readdir(dir);
  const jsxFiles = entries.filter((f) => f.endsWith('.jsx') && f !== 'demo.jsx');
  if (jsxFiles.length !== 1) fail(where, `react/ must contain exactly one component .jsx file (found ${jsxFiles.length})`);
  const demo = await readIfExists(path.join(dir, 'demo.jsx'));
  if (demo === null) fail(where, 'react/demo.jsx is required (mounts the component for preview)');
  const css = (await readIfExists(path.join(dir, 'style.css'))) ?? '';
  const component = jsxFiles.length === 1 ? await readFile(path.join(dir, jsxFiles[0]), 'utf8') : '';
  return { componentFile: jsxFiles[0] ?? 'Component.jsx', component, css, demo: demo ?? '' };
}

async function readVue(dir, where) {
  const entries = await readdir(dir);
  const sfcFiles = entries.filter((f) => f.endsWith('.vue'));
  if (sfcFiles.length !== 1) fail(where, `vue/ must contain exactly one .vue SFC (found ${sfcFiles.length})`);
  const demo = await readIfExists(path.join(dir, 'demo.js'));
  if (demo === null) fail(where, 'vue/demo.js is required (mounts the component for preview)');
  const sfc = sfcFiles.length === 1 ? await readFile(path.join(dir, sfcFiles[0]), 'utf8') : '';
  return { sfcFile: sfcFiles[0] ?? 'Component.vue', sfc, demo: demo ?? '' };
}

// ---------------------------------------------------------------------------
// Preview bundle compilation
// ---------------------------------------------------------------------------

// React demos import the component via a virtual module so esbuild resolves
// "./Component" regardless of the component file's real name.
function reactVirtualPlugin(componentFile, source) {
  return {
    name: 'react-component-virtual',
    setup(b) {
      b.onResolve({ filter: /^\.\/Component$/ }, () => ({ path: componentFile, namespace: 'virtual-component' }));
      b.onLoad({ filter: /.*/, namespace: 'virtual-component' }, () => ({ contents: source, loader: 'jsx', resolveDir: process.cwd() }));
    },
  };
}

// Vue SFCs are pre-compiled to JS with @vue/compiler-sfc, then bundled.
// <style> blocks are extracted separately and injected as a stylesheet.
async function compileVueSfc(sfcSource, filename, where) {
  const { parse, compileScript, compileTemplate, compileStyle } = await import('@vue/compiler-sfc');
  const { descriptor, errors: parseErrors } = parse(sfcSource, { filename });
  if (parseErrors.length) {
    for (const e of parseErrors) fail(where, `SFC parse error: ${e.message}`);
    return null;
  }
  const id = filename.replace(/\.vue$/, '').toLowerCase();
  const scopeId = `data-v-${id}`;
  const hasScoped = descriptor.styles.some((s) => s.scoped);

  let scriptCode = 'const __sfc__ = {};';
  let bindings;
  if (descriptor.script || descriptor.scriptSetup) {
    try {
      const script = compileScript(descriptor, { id, inlineTemplate: false });
      scriptCode = script.content.replace(/export default/, 'const __sfc__ =');
      bindings = script.bindings;
    } catch (e) {
      fail(where, `SFC script compile error: ${e.message}`);
      return null;
    }
  }

  let templateCode = '';
  if (descriptor.template) {
    const tpl = compileTemplate({
      source: descriptor.template.content,
      filename,
      id,
      scoped: hasScoped,
      compilerOptions: { bindingMetadata: bindings },
    });
    if (tpl.errors.length) {
      for (const e of tpl.errors) fail(where, `SFC template error: ${typeof e === 'string' ? e : e.message}`);
      return null;
    }
    templateCode = tpl.code;
  }

  const styles = [];
  for (const style of descriptor.styles) {
    const result = compileStyle({ source: style.content, filename, id, scoped: style.scoped });
    if (result.errors.length) {
      for (const e of result.errors) fail(where, `SFC style error: ${e.message}`);
      return null;
    }
    styles.push(result.code);
  }

  // Assemble an ES module: script default export + render fn + style injection.
  const js = `
${scriptCode.replace(/export default/, 'const __sfc__ =')}
${templateCode.replace(/export function render/, 'function render')}
__sfc__.render = render;
${hasScoped ? `__sfc__.__scopeId = ${JSON.stringify(scopeId)};` : ''}
const __css__ = ${JSON.stringify(styles.join('\n'))};
if (__css__) {
  const el = document.createElement('style');
  el.textContent = __css__;
  document.head.appendChild(el);
}
export default __sfc__;
`;
  return js;
}

function vueVirtualPlugin(source) {
  return {
    name: 'vue-sfc-virtual',
    setup(b) {
      b.onResolve({ filter: /^\.\/Component\.vue$/ }, () => ({ path: 'Component.vue', namespace: 'virtual-vue' }));
      b.onLoad({ filter: /.*/, namespace: 'virtual-vue' }, () => ({ contents: source, loader: 'js', resolveDir: ROOT }));
    },
  };
}

async function compileBundle({ stdin, plugins, outfile, where }) {
  try {
    await build({
      stdin,
      bundle: true,
      write: !VALIDATE_ONLY,
      outfile,
      format: 'iife',
      jsx: 'automatic',
      target: 'es2020',
      minify: true,
      legalComments: 'none',
      logLevel: 'silent',
      plugins,
      absWorkingDir: ROOT,
      define: { 'process.env.NODE_ENV': '"production"' },
    });
    return true;
  } catch (err) {
    for (const e of err.errors ?? []) {
      fail(where, `esbuild: ${e.text}${e.location ? ` (${e.location.file}:${e.location.line})` : ''}`);
    }
    if (!err.errors?.length) fail(where, `esbuild failed: ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main scan
// ---------------------------------------------------------------------------

const registry = [];
const seenIds = new Set();

if (!existsSync(COMPONENTS_DIR)) {
  console.error('components/ directory not found');
  process.exit(1);
}

await mkdir(PREVIEWS_DIR, { recursive: true });

const categories = (await readdir(COMPONENTS_DIR, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const category of categories) {
  if (!SLUG_RE.test(category)) {
    fail(category, 'category directory name must be kebab-case');
    continue;
  }
  const catDir = path.join(COMPONENTS_DIR, category);
  const slugs = (await readdir(catDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();

  for (const slug of slugs) {
    const where = `${category}/${slug}`;
    const dir = path.join(catDir, slug);
    const metaRaw = await readIfExists(path.join(dir, 'meta.json'));
    if (metaRaw === null) {
      fail(where, 'meta.json is required');
      continue;
    }
    let meta;
    try {
      meta = JSON.parse(metaRaw);
    } catch (e) {
      fail(where, `meta.json is not valid JSON: ${e.message}`);
      continue;
    }
    validateMeta(meta, where);
    if (meta.slug !== slug) fail(where, `meta.slug "${meta.slug}" does not match directory name "${slug}"`);
    if (meta.category !== category) fail(where, `meta.category "${meta.category}" does not match parent directory "${category}"`);
    const id = `${category}/${slug}`;
    if (seenIds.has(id)) {
      fail(where, 'duplicate component id');
      continue;
    }
    seenIds.add(id);
    if (errors.some((e) => e.startsWith(`[${where}]`))) continue;

    const entry = {
      id,
      title: meta.title,
      slug: meta.slug,
      category: meta.category,
      tags: meta.tags,
      description: meta.description,
      author: meta.author,
      createdAt: meta.createdAt,
      preview: { background: meta.preview?.background ?? 'auto', height: meta.preview?.height ?? 220 },
      variants: {},
    };

    for (const variant of meta.variants) {
      const vDir = path.join(dir, variant);
      if (!existsSync(vDir)) {
        fail(where, `declared variant "${variant}" has no directory`);
        continue;
      }
      if (variant === 'vanilla') {
        const files = await readVanilla(vDir, where);
        if (!errors.some((e) => e.startsWith(`[${where}]`))) entry.variants.vanilla = { files };
      } else if (variant === 'react') {
        const r = await readReact(vDir, where);
        if (errors.some((e) => e.startsWith(`[${where}]`))) continue;
        const bundleName = `${category}--${slug}--react.js`;
        const ok = await compileBundle({
          stdin: { contents: r.demo, loader: 'jsx', resolveDir: vDir },
          plugins: [reactVirtualPlugin(r.componentFile, r.component)],
          outfile: path.join(PREVIEWS_DIR, bundleName),
          where: `${where}/react`,
        });
        if (ok) {
          // CSS is injected into the iframe separately; keep it in the registry.
          entry.variants.react = {
            files: { [r.componentFile]: r.component, ...(r.css ? { 'style.css': r.css } : {}) },
            bundle: `/previews/${bundleName}`,
            css: r.css,
          };
        }
      } else if (variant === 'vue') {
        const v = await readVue(vDir, where);
        if (errors.some((e) => e.startsWith(`[${where}]`))) continue;
        const compiled = await compileVueSfc(v.sfc, v.sfcFile, `${where}/vue`);
        if (!compiled) continue;
        const bundleName = `${category}--${slug}--vue.js`;
        const ok = await compileBundle({
          stdin: { contents: v.demo, loader: 'js', resolveDir: vDir },
          plugins: [vueVirtualPlugin(compiled)],
          outfile: path.join(PREVIEWS_DIR, bundleName),
          where: `${where}/vue`,
        });
        if (ok) {
          entry.variants.vue = {
            files: { [v.sfcFile]: v.sfc },
            bundle: `/previews/${bundleName}`,
          };
        }
      }
    }

    if (!errors.some((e) => e.startsWith(`[${where}]`))) registry.push(entry);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (errors.length) {
  console.error(`\nRegistry build FAILED with ${errors.length} error(s):\n`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}

const variantCount = registry.reduce((n, c) => n + Object.keys(c.variants).length, 0);

if (VALIDATE_ONLY) {
  console.log(`Validation OK: ${registry.length} components, ${variantCount} variants, ${categories.length} categories.`);
} else {
  registry.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  const out = {
    generatedAt: new Date().toISOString(),
    categories: [...new Set(registry.map((c) => c.category))],
    components: registry,
  };
  await writeFile(path.join(PUBLIC_DIR, 'registry.json'), JSON.stringify(out, null, 2));
  console.log(`Registry OK: ${registry.length} components, ${variantCount} variants → public/registry.json`);
}
