/* Checks the Scriptable widget script. Run: node tests/widget.test.js  (after python3 src/build.py)
   Scriptable only exists on iOS, so this runs the script against a small stand-in for its API.
   The stand-in lists every Scriptable call the script is allowed to make; anything else throws. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'widget', 'pokedex-widget.js'), 'utf8');
const DATA = fs.readFileSync(path.join(ROOT, 'widget.json'), 'utf8');

class Node {
  constructor(kind) { this.kind = kind; this.children = []; }
  add(kind, extra = {}) { const n = Object.assign(new Node(kind), extra); this.children.push(n); return n; }
  addStack() { return this.add('stack'); }
  addText(text) { assert.strictEqual(typeof text, 'string', 'addText needs a string'); return this.add('text', { text }); }
  addImage(image) { assert.ok(image, 'addImage needs an image'); return this.add('image'); }
  addSpacer() { return this.add('spacer'); }
  layoutHorizontally() {} layoutVertically() {} centerAlignContent() {} topAlignContent() {} bottomAlignContent() {}
  setPadding() {}
  texts() { return this.children.flatMap(c => c.kind === 'text' ? [c.text] : c.texts()); }
  images() { return this.children.reduce((n, c) => n + (c.kind === 'image' ? 1 : c.images()), 0); }
}
class ListWidget extends Node { constructor() { super('widget'); } presentSmall() {} presentMedium() {} presentLarge() {} }
class Color { constructor(hex) { assert.ok(/^#?[0-9a-f]{6}$/i.test(hex), 'bad colour ' + hex); } static white() { return new Color('#ffffff'); } static black() { return new Color('#000000'); } }
const Font = { boldMonospacedSystemFont: n => n, regularMonospacedSystemFont: n => n, boldSystemFont: n => n, systemFont: n => n };
class Size { constructor(w, h) { this.width = w; this.height = h; } }

async function run({ param, family = 'large', online = true, files = {} }) {
  let widget = null;
  class Request {
    constructor(url) { this.url = url; }
    async loadJSON() { if (!online) throw new Error('offline'); assert.ok(this.url.endsWith('/widget.json'), this.url); return JSON.parse(DATA); }
    async loadImage() { if (!online) throw new Error('offline'); assert.ok(/black-white\/\d+\.png$/.test(this.url), this.url); return { png: this.url }; }
  }
  const fm = {
    cacheDirectory: () => '/cache', joinPath: (a, b) => a + '/' + b,
    fileExists: p => p in files, readString: p => files[p], writeString: (p, s) => { files[p] = s; },
    readImage: p => files[p], writeImage: (p, i) => { files[p] = i; },
  };
  const scope = {
    ListWidget, Color, Font, Size, Request, FileManager: { local: () => fm },
    Data: { fromBase64String: s => ({ toRawString: () => Buffer.from(s, 'base64').toString('utf8') }) },
    args: { widgetParameter: param }, config: { runsInWidget: true, widgetFamily: family },
    Script: { setWidget: w => { widget = w; }, complete() {} }, console,
  };
  const fn = new Function(...Object.keys(scope), `return (async () => {\n${SCRIPT}\n})();`);
  await fn(...Object.values(scope));
  assert.ok(widget, 'the script must call Script.setWidget');
  return { widget, files };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const code = ids => 'PDX1.' + Buffer.from(JSON.stringify({ t: ids, c: [] })).toString('base64');

test('large widget lists each team member with its next evolution, what it hits and what it fears', async () => {
  const { widget } = await run({ param: 'Pignite, Pidove' });
  const t = widget.texts();
  assert.ok(t.includes('Pignite') && t.includes('Pidove'), t.join('|'));
  assert.ok(t.includes('Lv 36'), 'Pignite evolves at level 36: ' + t.join('|'));
  const row = t.slice(t.indexOf('Pignite'), t.indexOf('Pidove'));
  const hit = row.slice(row.indexOf('HIT'), row.indexOf('FEAR')), fear = row.slice(row.indexOf('FEAR'));
  assert.ok(hit.includes('GRA') && hit.includes('STE'), 'Fire/Fighting moves hit Grass and Steel: ' + hit.join(' '));
  assert.ok(fear.includes('WAT') && fear.includes('PSY') && !fear.includes('GRA'), 'Pignite fears Water and Psychic: ' + fear.join(' '));
  assert.strictEqual(widget.images(), 2, 'one sprite per member');
});

test('team can be given as the backup code from the app', async () => {
  const { widget } = await run({ param: code([495, 504]), family: 'medium' });
  const t = widget.texts();
  assert.ok(t.includes('Snivy') && t.includes('Patrat'), t.join('|'));
});

test('small widget fits six members by name', async () => {
  const { widget } = await run({ param: '498, 519, 511, 522, 535, 532', family: 'small' });
  const t = widget.texts();
  for (const n of ['Tepig', 'Pidove', 'Pansage', 'Blitzle', 'Tympole', 'Timburr']) assert.ok(t.includes(n), n + ' missing: ' + t.join('|'));
});

test('a misspelled name is reported instead of silently dropped', async () => {
  const { widget } = await run({ param: 'Pignite, Pidgeon' });
  const t = widget.texts().join(' | ');
  assert.ok(t.includes('Pignite') && /not found.*Pidgeon/i.test(t), t);
});

test('with no team set, the widget explains how to add one', async () => {
  const { widget } = await run({ param: null });
  assert.ok(/Parameter/.test(widget.texts().join(' ')), widget.texts().join('|'));
});

test('works offline from the data and sprites saved on the last run', async () => {
  const first = await run({ param: 'Pignite' });
  const { widget } = await run({ param: 'Pignite', online: false, files: first.files });
  assert.ok(widget.texts().includes('Pignite'));
  assert.strictEqual(widget.images(), 1);
});

test('offline with nothing saved shows a clear message rather than crashing', async () => {
  const { widget } = await run({ param: 'Pignite', online: false });
  assert.ok(/internet/i.test(widget.texts().join(' ')), widget.texts().join('|'));
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log('PASS  ' + name); }
    catch (e) { failed++; console.log('FAIL  ' + name + '\n      ' + String(e.message).split('\n').slice(0, 6).join('\n      ')); }
  }
  console.log(`\n${tests.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
