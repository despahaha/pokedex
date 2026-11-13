/* End-to-end checks for the built app. Run: node tests/app.test.js
   Serves the repo root on localhost and drives it in an iPhone-sized Chromium.
   The sprite tests need network access to raw.githubusercontent.com. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8791;
const URL = `http://localhost:${PORT}/`;
const SPRITE_PATH = '/sprites/pokemon/versions/generation-v/black-white/';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

async function open(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  await page.goto(URL);
  await page.waitForSelector('#list .row');
  return { ctx, page };
}
/* resolves once the <img> has either loaded or given up, and reports what it shows */
const picture = (page, selector) => page.locator(selector).first().evaluate(img => new Promise(done => {
  const report = () => done({ src: img.currentSrc || img.src, width: img.naturalWidth });
  const settled = () => img.complete && (img.naturalWidth > 0 || img.dataset.fb);
  if (settled()) return report();
  const t = setInterval(() => { if (settled()) { clearInterval(t); report(); } }, 50);
}));

test('opens without script errors and without sideways scrolling', async browser => {
  const { ctx, page } = await open(browser);
  assert.strictEqual(await page.locator('#list .row').count(), 156);
  assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  assert.deepStrictEqual(page.errors, []);
  await ctx.close();
});

test('list shows the Black/White sprite of each Pokémon', async browser => {
  const { ctx, page } = await open(browser);
  const pic = await picture(page, '#list .row[data-id="494"] img.tile');
  assert.ok(pic.src.endsWith(SPRITE_PATH + '494.png'), 'Victini row should load 494.png, got ' + pic.src.slice(0, 80));
  assert.strictEqual(pic.width, 96, 'the real sprite is 96px wide');
  await ctx.close();
});

test('detail page shows the Black/White sprite', async browser => {
  const { ctx, page } = await open(browser);
  await page.click('#list .row[data-id="495"]');
  const pic = await picture(page, '#view-detail .hero img.tile');
  assert.ok(pic.src.endsWith(SPRITE_PATH + '495.png'), 'Snivy page should load 495.png, got ' + pic.src.slice(0, 80));
  assert.strictEqual(pic.width, 96);
  await ctx.close();
});

test('falls back to the drawn mascot when the sprite host cannot be reached', async browser => {
  const { ctx, page } = await open(browser);
  await ctx.route('**/raw.githubusercontent.com/**', r => r.abort());
  await page.evaluate(() => { location.hash = 'p150'; });
  const pic = await picture(page, '#view-detail .hero img.tile');
  assert.ok(pic.src.startsWith('data:image/png'), 'should show the built-in mascot, got ' + pic.src.slice(0, 80));
  assert.ok(pic.width > 0, 'the mascot should actually render');
  assert.deepStrictEqual(page.errors, []);
  await ctx.close();
});

test('a sprite seen online is still shown when offline', async browser => {
  const { ctx, page } = await open(browser);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.reload();                       // second visit: the service worker now handles requests
  await page.waitForSelector('#list .row');
  await picture(page, '#list .row[data-id="494"] img.tile');
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('#list .row');
  const seen = await picture(page, '#list .row[data-id="494"] img.tile');
  assert.ok(seen.src.endsWith(SPRITE_PATH + '494.png') && seen.width === 96, 'Victini was seen online and should come from the offline cache');
  await page.evaluate(() => { location.hash = 'p150'; });
  const unseen = await picture(page, '#view-detail .hero img.tile');
  assert.ok(unseen.src.startsWith('data:image/png'), 'Mewtwo was never seen, so it should show the mascot');
  await ctx.close();
});

test('clear button empties the search and brings the full list back', async browser => {
  const { ctx, page } = await open(browser);
  assert.ok(await page.locator('#q-clear').isHidden(), 'no clear button while the box is empty');
  await page.fill('#q', 'snivy');
  assert.strictEqual(await page.locator('#list .row').count(), 1);
  await page.click('#q-clear');
  assert.strictEqual(await page.inputValue('#q'), '');
  assert.strictEqual(await page.locator('#list .row').count(), 156);
  assert.ok(await page.locator('#q-clear').isHidden());
  await ctx.close();
});

test('detail page puts Attacking and Defending before Evolution', async browser => {
  const { ctx, page } = await open(browser);
  await page.click('#list .row[data-id="495"]');
  await page.waitForSelector('#view-detail .hero');
  const titles = await page.locator('#view-detail section.box[id] > h2').allTextContents();
  assert.deepStrictEqual(titles.map(t => t.replace('▶', '').trim()).slice(0, 3), ['Attacking', 'Defending', 'Evolution']);
  const chips = await page.locator('#view-detail .jump .chip').allTextContents();
  assert.deepStrictEqual(chips, ['Types', 'Evolve', 'Catch', 'Moves', 'Data']);
  await ctx.close();
});

const withTeam = async (browser, ids) => {
  const { ctx, page } = await open(browser);
  await page.evaluate(t => localStorage.setItem('party', JSON.stringify(t)), ids);
  await page.reload();
  await page.waitForSelector('#list .row');
  return { ctx, page };
};

test('dock shows each team member with what it hits hard and what it is weak to', async browser => {
  const { ctx, page } = await withTeam(browser, [495, 498]);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => { location.hash = 'dock'; });
  await page.waitForSelector('#view-dock .dcard');
  assert.strictEqual(await page.locator('#view-dock .dcard').count(), 2);
  const snivy = page.locator('#view-dock .dcard').first();
  assert.ok((await snivy.textContent()).includes('Snivy'));
  assert.ok((await snivy.locator('.hits .ty').allTextContents()).includes('Water'), 'Grass moves hit Water hard');
  assert.ok((await snivy.locator('.weak .ty').allTextContents()).includes('Fire'), 'Snivy is weak to Fire');
  assert.ok(await page.locator('.tabs').isHidden(), 'tab bar is hidden in the dock');
  assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  assert.deepStrictEqual(page.errors, []);
  await ctx.close();
});

test('turning the phone sideways opens the dock and turning it back returns', async browser => {
  const { ctx, page } = await withTeam(browser, [495]);
  await page.click('#tab-types');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => location.hash === '#dock');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => location.hash === '#types');
  await ctx.close();
});

test('options page lets you copy the widget script and your team code', async browser => {
  const { ctx, page } = await withTeam(browser, [495, 498]);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.click('#open-more');
  await page.click('#widget-copy');
  const script = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(script.includes('new ListWidget()') && script.includes('widget.json'), 'clipboard should hold the Scriptable script');
  await page.click('#team-copy');
  const code = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(code.startsWith('PDX1.'), 'clipboard should hold the team code, got ' + code.slice(0, 20));
  assert.deepStrictEqual(JSON.parse(Buffer.from(code.slice(5), 'base64').toString()).t, [495, 498]);
  await ctx.close();
});

test('every tab and the options page render at the largest text size without sideways scrolling', async browser => {
  const { ctx, page } = await open(browser);
  await page.click('#open-more');
  await page.click('[data-zoom="1.3"]');
  for (const tab of ['dex', 'types', 'places', 'bosses', 'team']) {
    await page.click('#tab-' + tab);
    assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, tab + ' tab overflows');
  }
  await page.evaluate(() => { location.hash = 'p133'; });
  await page.waitForSelector('#view-detail .hero');
  assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, 'detail page overflows');
  assert.deepStrictEqual(page.errors, []);
  await ctx.close();
});

(async () => {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', ROOT], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await Promise.race([fn(browser), new Promise((_, no) => setTimeout(() => no(new Error('timed out after 30s')), 30000))]);
      console.log('PASS  ' + name);
    } catch (e) { failed++; console.log('FAIL  ' + name + '\n      ' + String(e.message).split('\n').slice(0, 12).join('\n      ')); }
  }
  await browser.close();
  server.kill();
  console.log(`\n${tests.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
