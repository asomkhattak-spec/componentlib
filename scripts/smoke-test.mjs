// Runtime smoke test: loads the built site in headless Chromium and verifies
// gallery rendering, iframe previews (vanilla/react/vue), tabs, and search.
// Usage: npm run build && npx astro preview --port 4321 &  then:
//   CHROME_PATH=/path/to/chromium node scripts/smoke-test.mjs
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const CHROME = process.env.CHROME_PATH ?? '/data/data/com.termux/files/usr/bin/chromium-browser';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const results = [];
const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
};

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  // --- Gallery ---
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
  const cards = await page.$$eval('.component-card', (els) => els.length);
  check('gallery renders 10 cards', cards === 10, `got ${cards}`);

  await new Promise((r) => setTimeout(r, 1500));
  const thumbs = await page.$$eval('.card-preview', (els) => els.filter((f) => f.srcdoc).length);
  check('thumbnails mounted (lazy)', thumbs > 0, `${thumbs} mounted`);

  // Interactive preview: clicking the ripple card's button fires the ripple
  // INSIDE the iframe and does NOT navigate to the component page.
  await page.$eval('.card-preview[data-component="buttons/ripple"]', (el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForFunction(
    () => document.querySelector('.card-preview[data-component="buttons/ripple"]').srcdoc !== '',
    { timeout: 10000 },
  );
  await new Promise((r) => setTimeout(r, 500));
  const rippleFrame = await (await page.$('.card-preview[data-component="buttons/ripple"]')).contentFrame();
  await rippleFrame.click('.rp-btn');
  await new Promise((r) => setTimeout(r, 100));
  const cardRipples = await rippleFrame.$$eval('.rp-ripple', (els) => els.length);
  check('card preview is interactive (ripple fires)', cardRipples >= 1, `got ${cardRipples}`);
  check('preview click stays on gallery', page.url() === BASE + '/', page.url());

  // Get code button navigates to the component page's code section.
  await page.click('.component-card[data-id="buttons/ripple"] .get-code');
  await page.waitForSelector('#code', { timeout: 10000 });
  check('Get code opens component page #code', page.url().includes('/components/buttons/ripple/#code'), page.url());
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  // Search filter
  await page.type('#gallery-search', 'ripple');
  await new Promise((r) => setTimeout(r, 300));
  const visible = await page.$$eval('.component-card', (els) => els.filter((e) => !e.hidden).length);
  check('search filters to ripple', visible === 1, `got ${visible}`);
  await page.$eval('#gallery-search', (el) => (el.value = ''));
  await page.type('#gallery-search', ' ');
  await page.$eval('#gallery-search', (el) => { el.value = ''; el.dispatchEvent(new Event('input')); });

  // Category chip
  await page.click('[data-category="loaders"]');
  const loaderVisible = await page.$$eval('.component-card', (els) => els.filter((e) => !e.hidden).length);
  check('category filter loaders = 2', loaderVisible === 2, `got ${loaderVisible}`);

  // --- Component page: vanilla ---
  await page.goto(BASE + '/components/buttons/ripple/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  const frameEl = await page.$('#component-preview');
  const frame = await frameEl.contentFrame();
  const btnCount = frame ? await frame.$$eval('.rp-btn', (els) => els.length) : 0;
  check('vanilla preview renders button', btnCount === 1, `got ${btnCount}`);

  // Ripple click produces a ripple span
  if (frame) {
    await frame.click('.rp-btn');
    await new Promise((r) => setTimeout(r, 100));
    const ripples = await frame.$$eval('.rp-ripple', (els) => els.length);
    check('ripple effect fires on click', ripples >= 1, `got ${ripples}`);
  }

  const tabs = await page.$$eval('#code-tablist [role="tab"]', (els) => els.map((e) => e.textContent.trim()));
  check('vanilla tabs HTML/CSS/JS', JSON.stringify(tabs) === JSON.stringify(['HTML', 'CSS', 'JS']), tabs.join(','));

  // Tab switching
  await page.click('#tab-js');
  const jsVisible = await page.$eval('#panel-js', (el) => !el.hidden);
  const htmlHidden = await page.$eval('#panel-html', (el) => el.hidden);
  check('tab switch shows JS panel', jsVisible && htmlHidden);

  // --- React variant ---
  await page.click('[data-variant="react"]');
  await new Promise((r) => setTimeout(r, 1200));
  const frame2 = await (await page.$('#component-preview')).contentFrame();
  const reactBtn = frame2 ? await frame2.$$eval('.rp-btn', (els) => els.length) : 0;
  check('react preview renders button', reactBtn === 1, `got ${reactBtn}`);
  if (frame2) {
    await frame2.click('.rp-btn');
    await new Promise((r) => setTimeout(r, 100));
    const ripples = await frame2.$$eval('.rp-ripple', (els) => els.length);
    check('react ripple fires on click', ripples >= 1, `got ${ripples}`);
  }

  // --- Vue variant ---
  await page.click('[data-variant="vue"]');
  await new Promise((r) => setTimeout(r, 1200));
  const frame3 = await (await page.$('#component-preview')).contentFrame();
  const vueBtn = frame3 ? await frame3.$$eval('.rp-btn', (els) => els.length) : 0;
  check('vue preview renders button', vueBtn === 1, `got ${vueBtn}`);
  if (frame3) {
    await frame3.click('.rp-btn');
    await new Promise((r) => setTimeout(r, 100));
    const ripples = await frame3.$$eval('.rp-ripple', (els) => els.length);
    check('vue ripple fires on click', ripples >= 1, `got ${ripples}`);
  }

  // --- Vue SFC with script (underline-nav) ---
  await page.goto(BASE + '/components/navigation/underline-nav/', { waitUntil: 'networkidle0' });
  await page.click('[data-variant="vue"]');
  await new Promise((r) => setTimeout(r, 1200));
  const frame4 = await (await page.$('#component-preview')).contentFrame();
  const navLinks = frame4 ? await frame4.$$eval('.un-nav a', (els) => els.length) : 0;
  check('vue SFC with script renders nav', navLinks === 4, `got ${navLinks}`);
  if (frame4) {
    await frame4.click('.un-nav a:nth-child(3)');
    await new Promise((r) => setTimeout(r, 300));
    const current = await frame4.$eval('.un-nav a[aria-current="page"]', (el) => el.textContent);
    check('vue nav click moves aria-current', current === 'About', `got ${current}`);
    const x = await frame4.$eval('.un-nav', (el) => el.style.getPropertyValue('--un-x'));
    check('vue underline position updates', x !== '0px' && x !== '', `--un-x: ${x}`);
  }

  // --- Aurora glow: studied/rebuilt component ---
  await page.goto(BASE + '/components/buttons/aurora-glow/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const agFrame = await (await page.$('#component-preview')).contentFrame();
  const agBtn = agFrame ? await agFrame.$$eval('.ag-btn', (els) => els.length) : 0;
  check('aurora-glow renders', agBtn === 1, `got ${agBtn}`);
  if (agFrame) {
    const idle = await agFrame.$eval('.ag-wrap', (el) => getComputedStyle(el, '::before').opacity);
    await agFrame.hover('.ag-btn');
    await new Promise((r) => setTimeout(r, 600));
    const hovered = await agFrame.$eval('.ag-wrap', (el) => getComputedStyle(el, '::before').opacity);
    check('aurora glow blooms on hover', idle === '0' && hovered === '1', `idle ${idle} → hover ${hovered}`);
  }

  // --- Uiverse rebuild checks ---
  // gradient-shift: rotating fill layer + bloom
  await page.goto(BASE + '/components/buttons/gradient-shift/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const gsFrame = await (await page.$('#component-preview')).contentFrame();
  const gsAnim = gsFrame ? await gsFrame.$eval('.gs-fill', (el) => getComputedStyle(el).animationName) : '';
  check('gradient-shift fill rotates', gsAnim === 'gs-spin', `got ${gsAnim}`);
  if (gsFrame) {
    await gsFrame.hover('.gs-btn');
    await new Promise((r) => setTimeout(r, 500));
    const bloom = await gsFrame.$eval('.gs-wrap', (el) => getComputedStyle(el, '::before').opacity);
    check('gradient-shift blooms on hover', bloom === '1', `got ${bloom}`);
  }

  // neon-glow: glow layer opacity on hover
  await page.goto(BASE + '/components/buttons/neon-glow/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const ngFrame = await (await page.$('#component-preview')).contentFrame();
  if (ngFrame) {
    const idle = await ngFrame.$eval('.ng-btn', (el) => getComputedStyle(el, '::after').opacity);
    await ngFrame.hover('.ng-btn');
    await new Promise((r) => setTimeout(r, 700));
    const lit = await ngFrame.$eval('.ng-btn', (el) => getComputedStyle(el, '::after').opacity);
    check('neon glow lights on hover', idle === '0' && lit === '1', `idle ${idle} → hover ${lit}`);
  }

  // flip-card: double-axis rotation
  await page.goto(BASE + '/components/cards/flip-card/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const fcFrame = await (await page.$('#component-preview')).contentFrame();
  if (fcFrame) {
    await fcFrame.hover('.fc-card');
    await new Promise((r) => setTimeout(r, 1800));
    const m = await fcFrame.$eval('.fc-inner', (el) => getComputedStyle(el).transform);
    // rotateY(180)·rotateZ(180) = diag(1, -1, -1): both Y and Z flipped
    check('flip-card double-axis flip', m.startsWith('matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1'), `got ${m}`);
  }

  // floating-label: chip lift on focus
  await page.goto(BASE + '/components/forms/floating-label/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const flFrame = await (await page.$('#component-preview')).contentFrame();
  if (flFrame) {
    await flFrame.click('input');
    await new Promise((r) => setTimeout(r, 600));
    const t = await flFrame.$eval('label', (el) => getComputedStyle(el).transform);
    check('floating label lifts to chip', t.includes('0.7'), `got ${t}`);
  }

  // orbit-spinner: eight pulsing arms
  await page.goto(BASE + '/components/loaders/orbit-spinner/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const osFrame = await (await page.$('#component-preview')).contentFrame();
  const osArms = osFrame ? await osFrame.$$eval('.os-arm', (els) => els.length) : 0;
  check('orbit spinner has 8 arms', osArms === 8, `got ${osArms}`);

  // pulse-bars: staggered collapse animation
  await page.goto(BASE + '/components/loaders/pulse-bars/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  const pbFrame = await (await page.$('#component-preview')).contentFrame();
  const pbAnim = pbFrame ? await pbFrame.$eval('.pb-loader span:nth-child(3)', (el) => getComputedStyle(el).animationDelay) : '';
  check('pulse bars staggered delays', pbAnim === '0.3s', `got ${pbAnim}`);

  // --- Theme toggle ---
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await page.click('#theme-toggle');
  const scheme = await page.$eval('meta[name="color-scheme"]', (el) => el.content);
  check('theme toggle sets explicit scheme', scheme === 'light' || scheme === 'dark', `got ${scheme}`);
  const stored = await page.evaluate(() => localStorage.getItem('color-scheme'));
  check('theme persisted to localStorage', stored === scheme, `stored ${stored}`);

  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
