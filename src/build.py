"""Builds the Pokédex PWA (index.html, manifest, sw.js) from PokeAPI CSV data.
Run src/fetch_data.sh once, then: python3 src/build.py
"""
import csv, json, sys
from collections import defaultdict
import os
SRC = os.path.dirname(os.path.abspath(__file__)) + '/'
ROOT = os.path.dirname(SRC[:-1]) + '/'
D = SRC + 'data/'
def rd(n): return list(csv.DictReader(open(D + n + '.csv', encoding='utf-8')))
MAXID = 649
GEN = 5

types = [r for r in rd('types') if int(r['id']) <= 17]
TID = {r['id']: i for i, r in enumerate(types)}
TNAME = [r['identifier'].capitalize() for r in types]

# type chart (gen 5): chart[atk][def] in {0,50,100,200}
chart = [[100] * 17 for _ in range(17)]
for r in rd('type_efficacy'):
    if r['damage_type_id'] in TID and r['target_type_id'] in TID:
        chart[TID[r['damage_type_id']]][TID[r['target_type_id']]] = int(r['damage_factor'])
for r in rd('type_efficacy_past'):
    if int(r['generation_id']) >= GEN:
        chart[TID[r['damage_type_id']]][TID[r['target_type_id']]] = int(r['damage_factor'])

names = {r['pokemon_species_id']: r['name'] for r in rd('pokemon_species_names') if r['local_language_id'] == '9'}
species = {r['id']: r for r in rd('pokemon_species') if int(r['id']) <= MAXID}
item_en = {r['item_id']: r['name'] for r in rd('item_names') if r['local_language_id'] == '9'}
moves = {r['id']: r['identifier'].replace('-', ' ').title() for r in rd('moves')}
locs = {r['id']: r['identifier'].replace('-', ' ').title() for r in rd('locations')}

ptypes = defaultdict(dict)
for r in rd('pokemon_types'):
    if int(r['pokemon_id']) <= MAXID and r['type_id'] in TID:
        ptypes[r['pokemon_id']][int(r['slot'])] = TID[r['type_id']]
past = defaultdict(lambda: defaultdict(dict))
for r in rd('pokemon_types_past'):
    if int(r['pokemon_id']) <= MAXID and int(r['generation_id']) >= GEN:
        past[r['pokemon_id']][int(r['generation_id'])][int(r['slot'])] = TID[r['type_id']]
for pid, g in past.items():
    ptypes[pid] = g[min(g)]

stats = defaultdict(dict)
for r in rd('pokemon_stats'):
    if int(r['pokemon_id']) <= MAXID and int(r['stat_id']) <= 6:
        stats[r['pokemon_id']][int(r['stat_id'])] = int(r['base_stat'])
sp_past = defaultdict(dict)
for r in rd('pokemon_stats_past'):
    if int(r['pokemon_id']) <= MAXID and int(r['generation_id']) >= GEN and int(r['stat_id']) <= 6:
        k = (r['pokemon_id'], int(r['stat_id']))
        if k not in sp_past or int(r['generation_id']) < sp_past[k][0]:
            sp_past[k] = (int(r['generation_id']), int(r['base_stat']))
for (pid, sid), (_, v) in sp_past.items():
    stats[pid][sid] = v

unova = {r['species_id']: int(r['pokedex_number']) for r in rd('pokemon_dex_numbers') if r['pokedex_id'] == '8'}

# evolutions
VG_OK = set(str(i) for i in range(1, 15))
ev = defaultdict(list)
for r in rd('pokemon_evolution'):
    if int(r['evolved_species_id']) <= MAXID and r['version_group_id'] in VG_OK and not r['region_id']:
        ev[r['evolved_species_id']].append(r)

def describe(sid, r):
    t = r['evolution_trigger_id']
    extra = []
    short = None
    if r['held_item_id']:
        extra.append('giữ ' + item_en[r['held_item_id']])
        if r['evolution_trigger_id'] == '1': short = 'Giữ ' + item_en[r['held_item_id']]
    if r['minimum_happiness']:
        extra.append('độ thân thiết cao (220+)'); short = 'Thân thiết'
    if r['minimum_beauty']: extra.append('độ đẹp cao'); short = 'Độ đẹp'
    if r['time_of_day']: extra.append({'day': 'ban ngày', 'night': 'ban đêm'}.get(r['time_of_day'], r['time_of_day']))
    if r['known_move_id']:
        extra.append('đã biết chiêu ' + moves[r['known_move_id']]); short = 'Biết ' + moves[r['known_move_id']]
    if r['location_id']:
        extra.append('tại ' + locs[r['location_id']]); short = locs[r['location_id']]
    if r['gender_id']: extra.append({'1': 'chỉ con cái ♀', '2': 'chỉ con đực ♂'}[r['gender_id']])
    if r['party_species_id']:
        extra.append('có ' + names[r['party_species_id']] + ' trong đội'); short = 'Có ' + names[r['party_species_id']]
    if sid in ('106', '107', '237'):
        extra.append({'106': 'Attack > Defense', '107': 'Attack < Defense', '237': 'Attack = Defense'}[sid])
    if r['percentage_chance']: extra.append('ngẫu nhiên, không chọn được')
    if t == '1':
        if r['minimum_level']:
            head = 'Lên cấp ' + r['minimum_level']
            s = 'Lv ' + r['minimum_level']
        else:
            head = 'Lên 1 cấp bất kỳ'
            s = short or 'Lên cấp'
    elif t == '2':
        if r['trade_species_id']:
            head = 'Trao đổi lấy ' + names[r['trade_species_id']]
        else:
            head = 'Trao đổi (trade)'
        s = 'Trao đổi'
    elif t == '3':
        head = 'Dùng ' + item_en[r['trigger_item_id']]
        s = item_en[r['trigger_item_id']]
    elif t == '4':
        head = 'Xuất hiện khi Nincada tiến hóa ở cấp 20, nếu đội còn chỗ trống và túi có Poké Ball'
        s = 'Đặc biệt'
    else:
        head = 'Đặc biệt'; s = 'Đặc biệt'
    return s, head + (' · ' + ', '.join(extra) if extra else '')

edges = {}  # evolved sid -> list of (short, long)
for sid, rows in ev.items():
    if any(r['location_id'] for r in rows) or sid == '350':
        rows = [r for r in rows if r['version_group_id'] == '11']
    seen = []
    for r in rows:
        d = describe(sid, r)
        if d not in seen: seen.append(d)
    edges[sid] = seen

out = []
for i in range(1, MAXID + 1):
    s = str(i); sp = species[s]
    t = ptypes[s]
    e = {'i': i, 'n': names[s], 't': [t[k] for k in sorted(t)], 's': [stats[s][k] for k in range(1, 7)],
         'c': int(sp['evolution_chain_id']), 'h': int(sp['shape_id'] or 5), 'k': int(sp['color_id']), 'g': sp['identifier']}
    if sp['is_legendary'] == '1' or sp['is_mythical'] == '1': e['x'] = 1
    if s in unova: e['u'] = unova[s]
    if sp['evolves_from_species_id'] and s in edges:
        e['f'] = int(sp['evolves_from_species_id'])
        e['m'] = [list(x) for x in edges[s]]
    elif sp['evolves_from_species_id']:
        print('NO METHOD', names[s], file=sys.stderr)
    out.append(e)


# ---- where to catch (White = version 18, Black = 17) ----
slots = {r['id']: r for r in rd('encounter_slots')}
meth = {r['id']: r['identifier'] for r in rd('encounter_methods')}
la = {r['id']: r for r in rd('location_areas')}
lname = {r['location_id']: r['name'] for r in rd('location_names') if r['local_language_id'] == '9'}
cvn = {r['id']: r['identifier'] for r in rd('encounter_condition_values')}
cond = defaultdict(list)
for r in rd('encounter_condition_value_map'): cond[r['encounter_id']].append(cvn[r['encounter_condition_value_id']])
p2s = {r['id']: r['species_id'] for r in rd('pokemon')}
SEAS = ['season-spring', 'season-summer', 'season-autumn', 'season-winter']
AREA_FIX = {'nacrene-museum': 'Nacrene City (Nacrene Museum)', 'game-freak-hq-1f': 'Castelia City (Game Freak)'}
LOC_FIX = {'Team Flare Secret HQ': 'Lang thang khắp Unova (roaming)'}
METHS = ['walk', 'dark-grass', 'grass-spots', 'cave-spots', 'bridge-spots', 'surf', 'surf-spots', 'super-rod', 'super-rod-spots', 'gift', 'gift-egg', 'static']
agg = {}
black = set()
for r in rd('encounters'):
    sid = p2s[r['pokemon_id']]
    if r['version_id'] == '17': black.add(sid)
    if r['version_id'] != '18' or int(sid) > MAXID: continue
    a = la[r['location_area_id']]
    loc = AREA_FIX.get(a['identifier']) or LOC_FIX.get(lname[a['location_id']]) or lname[a['location_id']]
    m = meth[slots[r['encounter_slot_id']]['encounter_method_id']]
    cs = cond.get(r['id'], [])
    seas = [SEAS.index(c) for c in cs if c in SEAS] or [0, 1, 2, 3]
    other = [c for c in cs if c not in SEAS]
    note = ''
    for c in other:
        if c.startswith('item-'): note = 'đổi từ ' + c[5:].replace('-', ' ').title()
        if c == 'weekday-friday': note = 'chỉ thứ Sáu, sau khi thắng Ghetsis'
    k = (sid, loc, m, note)
    d = agg.setdefault(k, {'lo': 999, 'hi': 0, 'r': defaultdict(int)})
    d['lo'] = min(d['lo'], int(r['min_level'])); d['hi'] = max(d['hi'], int(r['max_level']))
    for s_ in seas: d['r'][(a['id'], s_)] += int(slots[r['encounter_slot_id']]['rarity'])
locs = sorted({k[1] for k in agg})
LI = {n: i for i, n in enumerate(locs)}
per = defaultdict(list)
for (sid, loc, m, note), d in agg.items():
    vals = [min(100, v) for v in d['r'].values() if v > 0]
    mask = 0
    for (_, s_), v in d['r'].items():
        if v > 0: mask |= 1 << s_
    fixed = m in ('gift', 'gift-egg', 'static')
    row = [LI[loc], METHS.index(m), d['lo'], d['hi'], 0 if fixed else min(vals), 0 if fixed else max(vals), mask]
    if note: row.append(note)
    per[sid].append(row)
white = set(per)
for e in out:
    s = str(e['i'])
    if s in per: e['e'] = sorted(per[s], key=lambda x: (x[2], x[0], x[1]))
    elif s in black: e['bo'] = 1
print('encounter rows', sum(len(v) for v in per.values()), 'species', len(per), file=sys.stderr)

data = {'types': TNAME, 'chart': chart, 'mons': out, 'locs': locs, 'meths': METHS}
json.dump(data, open(D + 'data.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

html = open(SRC + 'page.html', encoding='utf-8').read()
html = html.replace('/*SPRITES*/', open(SRC + 'sprites.js', encoding='utf-8').read()).replace('/*DATA*/', json.dumps(data, ensure_ascii=False, separators=(',', ':')))
open(D + 'artifact.html', 'w', encoding='utf-8').write(html)
print(len(html))

# ---- installable (PWA) build: full document, local fonts, manifest, service worker ----
import re, hashlib
body = html.replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap">', '')
body = re.sub(r'<title>.*?</title>\s*<meta name="claude:viewport-fit-sides" content="cover">', '', body, count=1)
REG = """
<script>
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
</script>
"""
HEAD = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Pokédex White</title>
<meta name="theme-color" content="#d63a2c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Pokédex">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="stylesheet" href="fonts.css">
<style>
:root { color-scheme: light; padding: env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px); }
html { overscroll-behavior-y: none; }
body { margin: 0; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>
</head>
<body>
"""
doc = HEAD + body + REG + "</body>\n</html>\n"
P = ROOT
open(P + 'index.html', 'w', encoding='utf-8').write(doc)
manifest = {
    'name': 'Pokédex White', 'short_name': 'Pokédex', 'lang': 'vi',
    'description': 'Sổ tay Pokémon White: tiến hóa, nơi bắt và khắc hệ Gen V.',
    'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#dfe5ea', 'theme_color': '#d63a2c',
    'icons': [
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}
json.dump(manifest, open(P + 'manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
import os
fonts = sorted('fonts/' + f for f in os.listdir(P + 'fonts'))
assets = ['./', 'index.html', 'fonts.css', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'] + fonts
ver = hashlib.sha1((doc + open(P + 'fonts.css').read()).encode()).hexdigest()[:10]
SW = """/* Offline cache. The version changes whenever the page changes, so an update replaces the old copy. */
const CACHE = 'pokedex-%s';
const ASSETS = %s;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  /* page itself: try the network first so updates arrive, fall back to the saved copy when offline */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./', copy)); return r; })
      .catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
""" % (ver, json.dumps(assets))
open(P + 'sw.js', 'w').write(SW)
open(P + '.nojekyll', 'w').write('')
print('pwa', len(doc), ver)
