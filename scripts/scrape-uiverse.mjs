// Scrape uiverse.io button components via headless Chromium (Cloudflare
// passes real browsers; plain HTTP gets 403). Extracts the HTML + CSS code
// blocks from each element page into /tmp/opencode/uiverse-scrape.json.
import { writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH ?? '/data/data/com.termux/files/usr/bin/chromium-browser';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 240000,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function newPage() {
  const p = await browser.newPage();
  await p.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  // Abort heavy third-party assets (ads/analytics/fonts) that stall loads.
  await p.setRequestInterception(true);
  p.on('request', (req) => {
    const t = req.resourceType();
    const u = req.url();
    if (['image', 'media', 'font'].includes(t) || /googletagmanager|google-analytics|doubleclick|adsbygoogle|hotjar|sentry/.test(u)) {
      req.abort().catch(() => {});
    } else {
      req.continue().catch(() => {});
    }
  });
  return p;
}

const out = { source: 'uiverse.io', scrapedAt: new Date().toISOString(), elements: [] };

try {
  // 1. Listing page: collect element URLs (client-rendered grid).
  let page = await newPage();
  await page.goto('https://uiverse.io/buttons', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 9000));
  const links = await page.$$eval('a[href]', (as) =>
    [...new Set(as.map((a) => a.getAttribute('href')))].filter((h) => /^\/[\w.-]+\/[a-z]+-[a-z]+-\d+$/.test(h)),
  );
  console.log('listing links:', links.length, links.slice(0, 8));
  await page.close();
  const targets = links.slice(0, 5);

  // 2. Each element page gets a FRESH page: one hung load never poisons the
  //    next. Code blocks live in <pre>/<code> (HTML first, CSS second).
  for (const path of targets) {
    const url = 'https://uiverse.io' + path;
    const p = await newPage();
    try {
      await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await new Promise((r) => setTimeout(r, 8000));
      const title = await p.title();
      const blocks = await p.$$eval('pre, code', (els) =>
        els.map((e) => e.innerText).filter((t) => t.length > 40),
      );
      const unique = [...new Set(blocks)];
      const html = unique.find((b) => b.trimStart().startsWith('<')) ?? '';
      const css = unique.find((b) => !b.trimStart().startsWith('<') && /[{};]/.test(b)) ?? '';
      out.elements.push({ url, title, html, css });
      console.log('OK', path, 'html:', html.length, 'css:', css.length);
    } catch (e) {
      console.log('SKIP', path, e.message.slice(0, 100));
    } finally {
      await p.close().catch(() => {});
    }
    if (out.elements.length >= 3) break;
  }
} finally {
  await browser.close();
  await writeFile('/tmp/opencode/uiverse-scrape.json', JSON.stringify(out, null, 2));
  console.log('saved', out.elements.length, 'elements');
}
