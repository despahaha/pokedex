"""Builds the Pokédex PWA (index.html, manifest, sw.js) from PokeAPI CSV data.
Run src/fetch_data.sh once, then: python3 src/build.py

Everything is computed for Generation V (Pokémon Black/White): types, type chart,
base stats, abilities, move data, evolution methods and encounters.
"""
import csv, json, sys, os, re, hashlib
from collections import defaultdict

SRC = os.path.dirname(os.path.abspath(__file__)) + '/'
ROOT = os.path.dirname(SRC[:-1]) + '/'
D = SRC + 'data/'
def rd(n): return list(csv.DictReader(open(D + n + '.csv', encoding='utf-8')))
MAXID = 649
GEN = 5
VG = '11'        # black-white version group
WHITE, BLACK = '18', '17'

types = [r for r in rd('types') if int(r['id']) <= 17]
TID = {r['id']: i for i, r in enumerate(types)}
TNAME = [r['identifier'].capitalize() for r in types]

# ---- type chart (gen 5): chart[atk][def] in {0,50,100,200} ----
chart = [[100] * 17 for _ in range(17)]
for r in rd('type_efficacy'):
    if r['damage_type_id'] in TID and r['target_type_id'] in TID:
        chart[TID[r['damage_type_id']]][TID[r['target_type_id']]] = int(r['damage_factor'])
for r in rd('type_efficacy_past'):
    if int(r['generation_id']) >= GEN:
        chart[TID[r['damage_type_id']]][TID[r['target_type_id']]] = int(r['damage_factor'])

sp_names = [r for r in rd('pokemon_species_names') if r['local_language_id'] == '9']
names = {r['pokemon_species_id']: r['name'] for r in sp_names}
genus = {r['pokemon_species_id']: r['genus'] for r in sp_names}
NAME2ID = {v: int(k) for k, v in names.items() if int(k) <= MAXID}
species = {r['id']: r for r in rd('pokemon_species') if int(r['id']) <= MAXID}
pokemon = {r['id']: r for r in rd('pokemon') if int(r['id']) <= MAXID}
item_en = {r['item_id']: r['name'] for r in rd('item_names') if r['local_language_id'] == '9'}
move_en = {r['move_id']: r['name'] for r in rd('move_names') if r['local_language_id'] == '9'}
loc_ident = {r['id']: r['identifier'].replace('-', ' ').title() for r in rd('locations')}

# ---- types, with the pre-Fairy typings ----
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

# ---- base stats and EV yield ----
stats = defaultdict(dict)
evy = defaultdict(dict)
for r in rd('pokemon_stats'):
    if int(r['pokemon_id']) <= MAXID and int(r['stat_id']) <= 6:
        stats[r['pokemon_id']][int(r['stat_id'])] = int(r['base_stat'])
        evy[r['pokemon_id']][int(r['stat_id'])] = int(r['effort'])
sp_past = {}
for r in rd('pokemon_stats_past'):
    if int(r['pokemon_id']) <= MAXID and int(r['generation_id']) >= GEN and int(r['stat_id']) <= 6:
        k = (r['pokemon_id'], int(r['stat_id']))
        if k not in sp_past or int(r['generation_id']) < sp_past[k][0]:
            sp_past[k] = (int(r['generation_id']), int(r['base_stat']))
for (pid, sid), (_, v) in sp_past.items():
    stats[pid][sid] = v

# ---- abilities as of gen 5 ----
abil_gen = {r['id']: int(r['generation_id']) for r in rd('abilities')}
abil_en = {r['ability_id']: r['name'] for r in rd('ability_names') if r['local_language_id'] == '9'}
pab = defaultdict(dict)   # pokemon -> slot -> ability id
for r in rd('pokemon_abilities'):
    if int(r['pokemon_id']) <= MAXID: pab[r['pokemon_id']][int(r['slot'])] = r['ability_id']
ab_past = {}
for r in rd('pokemon_abilities_past'):
    if int(r['pokemon_id']) <= MAXID and int(r['generation_id']) >= GEN:
        k = (r['pokemon_id'], int(r['slot']))
        if k not in ab_past or int(r['generation_id']) < ab_past[k][0]:
            ab_past[k] = (int(r['generation_id']), r['ability_id'])
for (pid, slot), (_, aid) in ab_past.items():
    if aid: pab[pid][slot] = aid
    else: pab[pid].pop(slot, None)
ABIL = []
def abil_idx(aid):
    n = abil_en[aid]
    if n not in ABIL: ABIL.append(n)
    return ABIL.index(n)

unova = {r['species_id']: int(r['pokedex_number']) for r in rd('pokemon_dex_numbers') if r['pokedex_id'] == '8'}
egg_en = {r['egg_group_id']: r['name'] for r in rd('egg_group_prose') if r['local_language_id'] == '9'}
EGG = sorted(set(egg_en.values()))
peggs = defaultdict(list)
for r in rd('pokemon_egg_groups'): peggs[r['species_id']].append(EGG.index(egg_en[r['egg_group_id']]))
GROWTH = ['', 'Slow', 'Medium Fast', 'Fast', 'Medium Slow', 'Erratic', 'Fluctuating']

# ---- evolutions (methods valid in Black/White) ----
VG_OK = set(str(i) for i in range(1, 15))
ev = defaultdict(list)
for r in rd('pokemon_evolution'):
    if int(r['evolved_species_id']) <= MAXID and r['version_group_id'] in VG_OK and not r['region_id']:
        ev[r['evolved_species_id']].append(r)

def describe(sid, r):
    """Returns (short label for the list, full sentence for the detail page)."""
    t = r['evolution_trigger_id']
    extra, short = [], None
    if r['held_item_id']:
        extra.append('holding ' + item_en[r['held_item_id']])
        if t == '1': short = 'Hold ' + item_en[r['held_item_id']]
    if r['minimum_happiness']:
        extra.append('high friendship (220+)'); short = 'Friendship'
    if r['minimum_beauty']: extra.append('high Beauty'); short = 'Beauty'
    if r['time_of_day']: extra.append({'day': 'daytime', 'night': 'at night'}.get(r['time_of_day'], r['time_of_day']))
    if r['known_move_id']:
        extra.append('knowing ' + move_en[r['known_move_id']]); short = 'Know ' + move_en[r['known_move_id']]
    if r['location_id']:
        extra.append('at ' + loc_ident[r['location_id']]); short = loc_ident[r['location_id']]
    if r['gender_id']: extra.append({'1': 'female only ♀', '2': 'male only ♂'}[r['gender_id']])
    if r['party_species_id']:
        extra.append('with ' + names[r['party_species_id']] + ' in the party'); short = 'With ' + names[r['party_species_id']]
    if sid in ('106', '107', '237'):
        extra.append({'106': 'Attack > Defense', '107': 'Attack < Defense', '237': 'Attack = Defense'}[sid])
    if r['percentage_chance']: extra.append('random, cannot be chosen')
    if t == '1':
        if r['minimum_level']:
            head, s = 'Level ' + r['minimum_level'], 'Lv ' + r['minimum_level']
        else:
            head, s = 'Level up', short or 'Level up'
    elif t == '2':
        head = 'Trade for ' + names[r['trade_species_id']] if r['trade_species_id'] else 'Trade'
        s = 'Trade'
    elif t == '3':
        head = 'Use ' + item_en[r['trigger_item_id']]
        s = item_en[r['trigger_item_id']]
    elif t == '4':
        head = 'Appears when Nincada evolves at level 20, if there is an empty party slot and a spare Poké Ball'
        s = 'Special'
    else:
        head = s = 'Special'
    return s, head + (' · ' + ', '.join(extra) if extra else '')

edges = {}
for sid, rows in ev.items():
    if any(r['location_id'] for r in rows) or sid == '350':
        rows = [r for r in rows if r['version_group_id'] == VG]
    seen = []
    for r in rows:
        d = describe(sid, r)
        if d not in seen: seen.append(d)
    edges[sid] = seen

# ---- moves as they were in Black/White ----
vg_order = {r['id']: int(r['order']) for r in rd('version_groups')}
mv = {r['id']: r for r in rd('moves')}
later = defaultdict(list)   # changes made after B/W, oldest first: their rows hold the pre-change values
for r in rd('move_changelog'):
    if vg_order[r['changed_in_version_group_id']] > vg_order[VG]: later[r['move_id']].append(r)
def move_then(mid, field):
    for r in sorted(later[mid], key=lambda r: vg_order[r['changed_in_version_group_id']]):
        if r[field]: return r[field]
    return mv[mid][field]
MOVES, MIDX = [], {}
def move_idx(mid):
    if mid not in MIDX:
        ty = move_then(mid, 'type_id')
        if ty not in TID: print('MOVE TYPE NOT IN GEN 5', move_en[mid], file=sys.stderr)
        num = lambda f: int(move_then(mid, f) or 0)
        MIDX[mid] = len(MOVES)
        # name, type, class (1 status, 2 physical, 3 special), power, accuracy, pp
        MOVES.append([move_en[mid], TID.get(ty, 0), int(mv[mid]['damage_class_id']), num('power'), num('accuracy'), num('pp')])
    return MIDX[mid]
machines = sorted((int(r['machine_number']), r['move_id']) for r in rd('machines') if r['version_group_id'] == VG)
TMS = [['TM%02d' % n if n <= 100 else 'HM%02d' % (n - 100), move_idx(mid)] for n, mid in machines]
TM_BIT = {mid: i for i, (_, mid) in enumerate(machines)}
lvl_moves = defaultdict(list)
tm_bits = defaultdict(int)
for r in rd('pokemon_moves'):
    if r['version_group_id'] != VG or int(r['pokemon_id']) > MAXID: continue
    if r['pokemon_move_method_id'] == '1':
        lvl_moves[r['pokemon_id']].append((int(r['level']), move_idx(r['move_id'])))
    elif r['pokemon_move_method_id'] == '4' and r['move_id'] in TM_BIT:
        tm_bits[r['pokemon_id']] |= 1 << TM_BIT[r['move_id']]

# ---- one record per Pokémon ----
out = []
for i in range(1, MAXID + 1):
    s = str(i); sp = species[s]; pk = pokemon[s]
    t = ptypes[s]
    e = {'i': i, 'n': names[s], 't': [t[k] for k in sorted(t)], 's': [stats[s][k] for k in range(1, 7)],
         'c': int(sp['evolution_chain_id']), 'h': int(sp['shape_id'] or 5), 'k': int(sp['color_id']), 'g': sp['identifier'],
         'ge': genus[s], 'ht': int(pk['height']), 'wt': int(pk['weight']),
         'a': [[abil_idx(a), 1 if slot == 3 else 0] for slot, a in sorted(pab[s].items()) if abil_gen[a] <= GEN],
         'gr': int(sp['gender_rate']), 'cr': int(sp['capture_rate']), 'bx': int(pk['base_experience'] or 0),
         'gw': int(sp['growth_rate_id']), 'eg': sorted(peggs[s]),
         'ev': [[k - 1, v] for k, v in sorted(evy[s].items()) if v],
         'lm': [list(x) for x in sorted(set(lvl_moves[s]))], 'tm': '%x' % tm_bits[s]}
    if sp['is_legendary'] == '1' or sp['is_mythical'] == '1': e['x'] = 1
    if s in unova: e['u'] = unova[s]
    if sp['evolves_from_species_id'] and s in edges:
        e['f'] = int(sp['evolves_from_species_id'])
        e['m'] = [list(x) for x in edges[s]]
    elif sp['evolves_from_species_id']:
        print('NO METHOD', names[s], file=sys.stderr)
    out.append(e)

# ---- where to catch in White ----
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
LOC_FIX = {'Team Flare Secret HQ': 'Roaming Unova'}
METHS = ['walk', 'dark-grass', 'grass-spots', 'cave-spots', 'bridge-spots', 'surf', 'surf-spots', 'super-rod', 'super-rod-spots', 'gift', 'gift-egg', 'static']
agg = {}
black = set()
for r in rd('encounters'):
    sid = p2s[r['pokemon_id']]
    if r['version_id'] == BLACK: black.add(sid)
    if r['version_id'] != WHITE or int(sid) > MAXID: continue
    a = la[r['location_area_id']]
    loc = AREA_FIX.get(a['identifier']) or LOC_FIX.get(lname[a['location_id']]) or lname[a['location_id']]
    m = meth[slots[r['encounter_slot_id']]['encounter_method_id']]
    cs = cond.get(r['id'], [])
    seas = [SEAS.index(c) for c in cs if c in SEAS] or [0, 1, 2, 3]
    note = ''
    for c in cs:
        if c.startswith('item-'): note = 'revived from ' + c[5:].replace('-', ' ').title()
        if c == 'weekday-friday': note = 'Fridays only, after beating Ghetsis'
    k = (sid, loc, m, note)
    d = agg.setdefault(k, {'lo': 999, 'hi': 0, 'r': defaultdict(int)})
    d['lo'] = min(d['lo'], int(r['min_level'])); d['hi'] = max(d['hi'], int(r['max_level']))
    for s_ in seas: d['r'][(a['id'], s_)] += int(slots[r['encounter_slot_id']]['rarity'])

# White Forest is not in PokeAPI. Species list from pokemondb.net/location/unova-white-forest (Gen 5, all Lv 5).
WF_NOTE = 'only while the matching resident lives in White Forest'
WF_GRASS = ['Pidgey', 'Nidoran♀', 'Nidoran♂', 'Oddish', 'Abra', 'Machop', 'Bellsprout', 'Magnemite', 'Gastly', 'Rhyhorn',
            'Porygon', 'Togepi', 'Mareep', 'Hoppip', 'Elekid', 'Magby', 'Wurmple', 'Seedot', 'Ralts', 'Slakoth', 'Whismur',
            'Azurill', 'Aron', 'Trapinch', 'Bagon', 'Starly', 'Shinx', 'Budew', 'Happiny']
WF_WATER = ['Wooper', 'Lotad', 'Surskit', 'Corphish']
for lst, m in ((WF_GRASS, 'walk'), (WF_WATER, 'surf')):
    for n in lst:
        agg[(str(NAME2ID[n]), 'White Forest', m, WF_NOTE)] = {'lo': 5, 'hi': 5, 'r': {}}

def natural(s): return [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', s)]
locs = sorted({k[1] for k in agg}, key=natural)
LI = {n: i for i, n in enumerate(locs)}
per = defaultdict(list)
for (sid, loc, m, note), d in agg.items():
    vals = [min(100, v) for v in d['r'].values() if v > 0]
    mask = 0
    for (_, s_), v in d['r'].items():
        if v > 0: mask |= 1 << s_
    fixed = m in ('gift', 'gift-egg', 'static') or not vals
    row = [LI[loc], METHS.index(m), d['lo'], d['hi'], 0 if fixed else min(vals), 0 if fixed else max(vals), mask or 15]
    if note: row.append(note)
    per[sid].append(row)
for e in out:
    s = str(e['i'])
    if s in per: e['e'] = sorted(per[s], key=lambda x: (x[2], x[0], x[1]))
    elif s in black: e['bo'] = 1
print('encounter rows', sum(len(v) for v in per.values()), 'species', len(per), 'moves', len(MOVES), file=sys.stderr)

# ---- boss teams. Source: pokemondb.net/black-white/gymleaders-elitefour ----
def team(s): return [[NAME2ID[n.rsplit(' ', 1)[0]], int(n.rsplit(' ', 1)[1])] for n in s.split(', ')]
def ty(n): return TNAME.index(n)
BOSSES = [
    ['Gyms', 'Cilan', 'Gym 1 · Striaton City · Trio Badge', 'If your starter is Oshawott', ty('Grass'), team('Lillipup 12, Pansage 14')],
    ['Gyms', 'Chili', 'Gym 1 · Striaton City · Trio Badge', 'If your starter is Snivy', ty('Fire'), team('Lillipup 12, Pansear 14')],
    ['Gyms', 'Cress', 'Gym 1 · Striaton City · Trio Badge', 'If your starter is Tepig', ty('Water'), team('Lillipup 12, Panpour 14')],
    ['Gyms', 'Lenora', 'Gym 2 · Nacrene City · Basic Badge', '', ty('Normal'), team('Herdier 18, Watchog 20')],
    ['Gyms', 'Burgh', 'Gym 3 · Castelia City · Beetle Badge', '', ty('Bug'), team('Whirlipede 21, Dwebble 21, Leavanny 23')],
    ['Gyms', 'Elesa', 'Gym 4 · Nimbasa City · Bolt Badge', '', ty('Electric'), team('Emolga 25, Emolga 25, Zebstrika 27')],
    ['Gyms', 'Clay', 'Gym 5 · Driftveil City · Quake Badge', '', ty('Ground'), team('Krokorok 29, Palpitoad 29, Excadrill 31')],
    ['Gyms', 'Skyla', 'Gym 6 · Mistralton City · Jet Badge', '', ty('Flying'), team('Swoobat 33, Unfezant 33, Swanna 35')],
    ['Gyms', 'Brycen', 'Gym 7 · Icirrus City · Icicle Badge', '', ty('Ice'), team('Vanillish 37, Cryogonal 37, Beartic 39')],
    ['Gyms', 'Iris', 'Gym 8 · Opelucid City · Legend Badge', 'White version (Drayden in Black, same team)', ty('Dragon'), team('Fraxure 41, Druddigon 41, Haxorus 43')],
    ['Elite Four', 'Shauntal', 'Pokémon League', 'Fight the four in any order', ty('Ghost'), team('Cofagrigus 48, Jellicent 48, Golurk 48, Chandelure 50')],
    ['Elite Four', 'Grimsley', 'Pokémon League', '', ty('Dark'), team('Scrafty 48, Liepard 48, Krookodile 48, Bisharp 50')],
    ['Elite Four', 'Caitlin', 'Pokémon League', '', ty('Psychic'), team('Reuniclus 48, Musharna 48, Sigilyph 48, Gothitelle 50')],
    ['Elite Four', 'Marshal', 'Pokémon League', '', ty('Fighting'), team('Throh 48, Sawk 48, Conkeldurr 48, Mienshao 50')],
    ['Team Plasma', 'N', "N's Castle", 'In White he leads with Reshiram', -1, team('Reshiram 52, Carracosta 50, Vanilluxe 50, Archeops 50, Zoroark 50, Klinklang 50')],
    ['Team Plasma', 'Ghetsis', "N's Castle", 'Right after N, no healing in between', -1, team('Cofagrigus 52, Bouffalant 52, Seismitoad 52, Bisharp 52, Eelektross 52, Hydreigon 54')],
    ['Post-game', 'Shauntal', 'Pokémon League rematch', '', ty('Ghost'), team('Cofagrigus 71, Jellicent 71, Froslass 71, Drifblim 71, Golurk 71, Chandelure 73')],
    ['Post-game', 'Grimsley', 'Pokémon League rematch', '', ty('Dark'), team('Sharpedo 71, Liepard 71, Scrafty 71, Drapion 71, Krookodile 71, Bisharp 73')],
    ['Post-game', 'Caitlin', 'Pokémon League rematch', '', ty('Psychic'), team('Musharna 71, Sigilyph 71, Bronzong 71, Reuniclus 71, Gothitelle 71, Metagross 73')],
    ['Post-game', 'Marshal', 'Pokémon League rematch', '', ty('Fighting'), team('Breloom 71, Throh 71, Sawk 71, Toxicroak 71, Mienshao 71, Conkeldurr 73')],
    ['Post-game', 'Alder', 'Champion', 'After the Elite Four rematch', -1, team('Accelgor 75, Bouffalant 75, Druddigon 75, Vanilluxe 75, Escavalier 75, Volcarona 77')],
]

data = {'types': TNAME, 'chart': chart, 'mons': out, 'locs': locs, 'meths': METHS, 'moves': MOVES, 'tms': TMS,
        'abil': ABIL, 'egg': EGG, 'growth': GROWTH, 'bosses': BOSSES}
blob = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
open(D + 'data.json', 'w', encoding='utf-8').write(blob)

html = open(SRC + 'page.html', encoding='utf-8').read()
html = html.replace('/*SPRITES*/', open(SRC + 'sprites.js', encoding='utf-8').read()).replace('/*DATA*/', blob)
open(D + 'artifact.html', 'w', encoding='utf-8').write(html)

# ---- installable (PWA) build: full document, local fonts, manifest, service worker ----
body = html.replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap">', '')
body = re.sub(r'<title>.*?</title>\s*<meta name="claude:viewport-fit-sides" content="cover">', '', body, count=1)
REG = """
<script>
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
</script>
"""
HEAD = """<!doctype html>
<html lang="en">
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
open(ROOT + 'index.html', 'w', encoding='utf-8').write(doc)
manifest = {
    'name': 'Pokédex White', 'short_name': 'Pokédex', 'lang': 'en',
    'description': 'Pokémon White companion: evolutions, locations, moves, type matchups and bosses for Generation V.',
    'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#dfe5ea', 'theme_color': '#d63a2c',
    'icons': [
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}
json.dump(manifest, open(ROOT + 'manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
fonts = sorted('fonts/' + f for f in os.listdir(ROOT + 'fonts'))
assets = ['./', 'index.html', 'fonts.css', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'] + fonts
ver = hashlib.sha1((doc + open(ROOT + 'fonts.css').read()).encode()).hexdigest()[:10]
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
open(ROOT + 'sw.js', 'w').write(SW)
open(ROOT + '.nojekyll', 'w').write('')
print('built', len(doc), 'bytes, cache', ver)
