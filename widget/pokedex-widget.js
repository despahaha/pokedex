// Pokédex White team widget for the Scriptable app (iOS).
//
// Setup: paste this whole file into a new script in Scriptable, add a Scriptable
// widget to your Home Screen, long-press it, choose Edit Widget, pick this script,
// and put your team in "Parameter". The team can be Pokémon names or numbers
// separated by commas (Pignite, Pidove, Pansage) or the team code copied from the
// Pokédex app (Options > Backup). You can also type the team on the next line instead.
const MY_TEAM = '';

const APP = 'https://despahaha.github.io/pokedex/';
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/';
const TYPE_COLORS = ['#a8a878', '#c03028', '#a890f0', '#a040a0', '#e0c068', '#b8a038', '#a8b820', '#705898', '#b8b8d0',
  '#f08030', '#6890f0', '#78c850', '#f8d030', '#f85888', '#98d8d8', '#7038f8', '#705848'];
const LIGHT_TEXT = [1, 3, 7, 15, 16];   // types whose colour needs white lettering
const BG = '#12161f', INK = '#e8edf6', MUTE = '#9aa6bb', GOOD = '#3fb968', BAD = '#e2604f';

const fm = FileManager.local();
const cached = name => fm.joinPath(fm.cacheDirectory(), name);

// Game data: fetched from the Pokédex site, with the last copy kept for offline use.
async function loadData() {
  const file = cached('pokedex-widget.json');
  try {
    const data = await new Request(APP + 'widget.json').loadJSON();
    fm.writeString(file, JSON.stringify(data));
    return data;
  } catch (e) {
    return fm.fileExists(file) ? JSON.parse(fm.readString(file)) : null;
  }
}

// Sprites come from the PokeAPI sprite collection and are kept after the first download.
async function loadSprite(id) {
  const file = cached('pokedex-sprite-' + id + '.png');
  if (fm.fileExists(file)) return fm.readImage(file);
  try {
    const image = await new Request(SPRITES + id + '.png').loadImage();
    fm.writeImage(file, image);
    return image;
  } catch (e) {
    return null;
  }
}

// Turns the parameter into Pokémon numbers. Returns the names that could not be matched too.
function parseTeam(text, data) {
  const value = (text || '').trim();
  if (!value) return { ids: [], missing: [] };
  if (value.startsWith('PDX1.')) {
    try {
      const saved = JSON.parse(Data.fromBase64String(value.slice(5)).toRawString());
      return { ids: saved.t.filter(id => data.mons[id]).slice(0, 6), missing: [] };
    } catch (e) {
      return { ids: [], missing: ['team code'] };
    }
  }
  const plain = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const ids = [], missing = [];
  for (const part of value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)) {
    let id = /^#?\d+$/.test(part) ? Number(part.replace('#', '')) : data.mons.findIndex(m => m && plain(m[0]) === plain(part));
    if (id > 0 && data.mons[id]) ids.push(id); else missing.push(part);
  }
  return { ids: ids.slice(0, 6), missing };
}

// Types this Pokémon's own-type moves hit for x2, and move types that hit it for x2 or more.
function matchups(types, data) {
  const all = data.types.map((_, i) => i);
  const hit = all.filter(d => types.some(a => data.chart[a][d] === 200));
  const fear = all.filter(a => types.reduce((x, d) => x * data.chart[a][d] / 100, 1) >= 2);
  return { hit, fear };
}

function label(stack, text, size, colour, bold) {
  const t = stack.addText(text);
  t.font = bold ? Font.boldMonospacedSystemFont(size) : Font.regularMonospacedSystemFont(size);
  t.textColor = new Color(colour);
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.6;
  return t;
}
function chip(stack, text, background, colour, size) {
  const box = stack.addStack();
  box.backgroundColor = new Color(background);
  box.setPadding(1, 3, 1, 3);
  label(box, text, size, colour, true);
}
function typeChip(stack, type, data, size, short) {
  const name = data.types[type].toUpperCase();
  chip(stack, short ? name.slice(0, 3) : name, TYPE_COLORS[type], LIGHT_TEXT.includes(type) ? '#ffffff' : '#14181f', size);
}
function picture(stack, image, side) {
  if (!image) { const gap = stack.addStack(); gap.size = new Size(side, side); return; }
  const img = stack.addImage(image);
  img.imageSize = new Size(side, side);
}
function message(widget, lines) {
  label(widget, 'POKéDEX', 11, BAD, true);
  widget.addSpacer();
  for (const line of lines) { const t = label(widget, line, 11, INK, false); t.lineLimit = 3; }
  widget.addSpacer();
}

// One compact line per member: sprite, name, next evolution.
function compactRow(parent, mon, image, pictureSide, textSize) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.spacing = 4;
  picture(row, image, pictureSide);
  label(row, mon[0], textSize, INK, true);
  row.addSpacer();
  label(row, mon[2] || 'Final', textSize - 2, mon[2] ? '#ffd84a' : MUTE, false);
}

// Full row for the large widget: types, next evolution, HIT and FEAR chips.
function fullRow(parent, mon, image, data) {
  const { hit, fear } = matchups(mon[1], data);
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.spacing = 6;
  picture(row, image, 40);
  const info = row.addStack();
  info.layoutVertically();
  info.spacing = 2;
  const head = info.addStack();
  head.layoutHorizontally();
  head.centerAlignContent();
  head.spacing = 4;
  label(head, mon[0], 13, INK, true);
  for (const t of mon[1]) typeChip(head, t, data, 7, false);
  head.addSpacer();
  label(head, mon[2] || 'Final', 10, mon[2] ? '#ffd84a' : MUTE, false);
  for (const [name, colour, list] of [['HIT', GOOD, hit], ['FEAR', BAD, fear]]) {
    const line = info.addStack();
    line.layoutHorizontally();
    line.centerAlignContent();
    line.spacing = 3;
    chip(line, name, colour, '#10141c', 7);
    if (list.length) for (const t of list) typeChip(line, t, data, 7, true);
    else label(line, 'none', 9, MUTE, false);
  }
}

async function build() {
  const family = config.widgetFamily || 'large';
  const widget = new ListWidget();
  widget.backgroundColor = new Color(BG);
  widget.url = APP + '#team';
  widget.setPadding(10, 10, 10, 10);
  widget.spacing = family === 'large' ? 5 : 2;

  const data = await loadData();
  if (!data) {
    message(widget, ['No internet yet.', 'Open the widget once while online so it can save the Pokédex data.']);
    return widget;
  }
  const { ids, missing } = parseTeam(args.widgetParameter || MY_TEAM, data);
  if (!ids.length && !missing.length) {
    message(widget, ['Add your team:', 'long-press the widget, Edit Widget, then type names in Parameter.', 'Example: Pignite, Pidove']);
    return widget;
  }
  const images = await Promise.all(ids.map(loadSprite));

  if (family === 'large' || family === 'extraLarge') {
    ids.forEach((id, i) => fullRow(widget, data.mons[id], images[i], data));
  } else if (family === 'medium') {
    const columns = widget.addStack();
    columns.layoutHorizontally();
    columns.spacing = 10;
    for (const half of [ids.slice(0, 3), ids.slice(3)]) {
      const column = columns.addStack();
      column.layoutVertically();
      column.spacing = 4;
      half.forEach(id => compactRow(column, data.mons[id], images[ids.indexOf(id)], 34, 12));
    }
  } else {
    ids.forEach((id, i) => compactRow(widget, data.mons[id], images[i], 18, 11));
  }
  if (missing.length) label(widget, 'Not found: ' + missing.join(', '), 9, BAD, false);
  widget.addSpacer();
  return widget;
}

const widget = await build();
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentLarge();
Script.complete();
