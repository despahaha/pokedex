/* Hand-drawn 16x16 mascots, one per body shape. # outline, A body, B accent, W light, K eye. */
const SHAPES = {
1:`................|.....######.....|...##AAAAAA##...|..#AAAAAAAAAA#..|.#AAAAAAAAAAAA#.|.#AAAAAAAAAAAA#.|#AAAKAAAAAAKAAA#|#AAAKAAAAAAKAAA#|#AAAAAAAAAAAAAA#|#AAAAAA##AAAAAA#|.#AAAAAAAAAAAA#.|.#BBAAAAAAAABB#.|..#BBBBBBBBBB#..|...##BBBBBB##...|.....######.....|................`,
2:`................|....####........|...#AAAA#.......|..#AKAAKA#......|..#AAAAAA#......|...#AAAA#.......|....#AA#........|....#AAA###.....|.....#AAAAA##...|......##AAAAA#..|.###....#BAAA#..|#AAA####BBAA#...|#AAAAAABBBA#....|.#AAAABBB##.....|..######........|................`,
3:`................|................|......####......|....##BBBB#.....|...#AAAAAA##..##|..#AAAAAAAAA##B#|.#AKAAAAAAAAABB#|.#AKAAAAAAAAAB#.|.#AAAAAAAAAAABB#|..#AAWWWWAAA##B#|...#WWWWWW##..##|....##BB##......|......##........|................|................|................`,
4:`................|.....######.....|....#AAAAAA#....|...#AAAAAAAA#...|...#AKAAAAKA#...|...#AKAAAAKA#...|.##AAAAAAAAAA##.|#BB#AAAAAAAA#BB#|#BB#AAAAAAAA#BB#|.###AAAAAAAA###.|....#AAAAAA#....|....#AAAAAA#....|.....#AAAA#.....|......####......|................|................`,
5:`................|................|................|......####......|....##AAAA##....|...#AAAAAAAA#...|..#AAAAAAAAAA#..|..#AKAAAAAAKA#..|.#AAKAAAAAAKAA#.|.#AAAAAAAAAAAA#.|#AAAAAA##AAAAAA#|#AAAAAAAAAAAAAA#|#BAAAAAAAAAAAAB#|#BBBAAAAAAAABBB#|.##############.|................`,
6:`................|....######......|...#AAAAAA#.....|..#AAAAAAAA#....|..#AKAAAAKA#....|..#AKAAAAKA#....|..#AAAAAAAA#....|...#AAAAAA#...#.|..#AAWWWWAA#.#B#|.#BAWWWWWWAB#BB#|.#BAWWWWWWAB#B#.|..#AWWWWWWAAA#..|..#AAWWWWAA##...|..#AA#..#AA#....|..###...###.....|................`,
7:`................|................|.....######.....|...##AAAAAA##...|..#AAAAAAAAAA#..|.#AAAAAAAAAAAA#.|.#AAKAAAAAAKAA#.|.#AAKAAAAAAKAA#.|.#AAAAAAAAAAAA#.|..#AAAA##AAAA#..|...##AAAAAA##...|....#B####B#....|....#B#..#B#....|...#BB#..#BB#...|...###....###...|................`,
8:`................|................|.##..##.........|#AA##AA#........|#AAAAAA#......#.|#AKAAKA#.....#B#|#AAAAAA######BB#|.#AAAAAAAAAAAB#.|..#AAAAAAAAAAA#.|..#AAAAAAAAAAA#.|..#AAAAAAAAAAA#.|..#AA#AA##AA#A#.|..#AA#AA##AA#A#.|..#BB#BB##BB#B#.|..###.##.###.#..|................`,
9:`................|................|......####......|.....#AAAA#.....|....#AKAAKA#....|..###AAAAAA###..|.#BB#AABBAA#BB#.|.#BBB#AAAA#BBB#.|.#BBBBAAAABBBB#.|..#BBBAWWABBB#..|...##AAWWAA##...|....#AAWWAA#....|.....#AAAA#.....|.....#B##B#.....|.....##..##.....|................`,
10:`................|.....######.....|...##AAAAAA##...|..#AAAAAAAAAA#..|..#AAAAAAAAAA#..|..#AKAAAAAAKA#..|..#AKAAAAAAKA#..|..#AAAAAAAAAA#..|...#AAAAAAAA#...|...#B#B##B#B#...|..#B##B##B##B#..|..#B#.#B#B#.#B#.|.#B#..#B#B#..#B#|.##...#B#B#...##|.......#.#......|................`,
11:`................|................|..####....####..|.#AAAA#..#AAAA#.|#AKAAKA##AKAAKA#|#AAAAAA##AAAAAA#|#AAAAAA##AAAAAA#|.#AAAA#..#AAAA#.|..#BB#....#BB#..|..#BB######BB#..|...#BBBBBBBB#...|...#AAAAAAAA#...|...#AAAAAAAA#...|....#AAAAAA#....|.....######.....|................`,
12:`.....######.....|....#AAAAAA#....|...#AAAAAAAA#...|...#AKAAAAKA#...|...#AAAAAAAA#...|....#AAAAAA#....|...###AAAA###...|..#AA#BBBB#AA#..|.#AA#BBBBBB#AA#.|.#A##BBBBBB##A#.|.##.#BBBBBB#.##.|....#BBBBBB#....|....#AA##AA#....|....#AA##AA#....|...#AAA##AAA#...|...####..####...`,
13:`................|....#......#....|.....#....#.....|..##.######.##..|.#BB#AAAAAA#BB#.|#BBB#AKAAKA#BBB#|#BBB#AAAAAA#BBB#|#BBBB#AAAA#BBBB#|.#BBB#AAAA#BBB#.|..#BB#AAAA#BB#..|.#BBB#AAAA#BBB#.|.#BB#.#AA#.#BB#.|..##..#AA#..##..|.......##.......|................|................`,
14:`................|................|....########....|..##AAAAAAAA##..|.#AAAAAAAAAAAA#.|.#BBBBBBBBBBBB#.|#AAAAAAAAAAAAAA#|#AKAAAAAAAAAAKA#|#AKAAAAAAAAAAKA#|#BBBBBBBBBBBBBB#|#AAAAAAAAAAAAAA#|.#AAAAAAAAAAAA#.|.#B#B#B##B#B#B#.|.#B#B#B##B#B#B#.|..#.#.#..#.#.#..|................`
};
/* Second drawing for the most common body shapes, so families that share a shape do not all look alike. */
const SHAPES_ALT = {
6:`................|..##......##....|.#AA#....#AA#...|.#AAA####AAA#...|.#AAAAAAAAAA#...|.#AKAAAAAAKA#...|.#AKAAAAAAKA#...|.#AAAAWWAAAA#...|..#AAAAAAAA#..#.|.#BAAWWWWAAB##B#|.#BAWWWWWWAB#BB#|..#AWWWWWWAAAB#.|..#AAWWWWAA###..|..#AAA##AAA#....|..####..####....|................`,
8:`................|.##.............|#AA#............|#AAA#...........|#AKA#...........|#AAA#.........#.|.#AA#########B#.|.#AAAAAAAAAAAB#.|.#AAAAAAAAAAAA#.|..#AAAAAAAAAAA#.|..#AAAAAAAAAAA#.|..#A#A#...#A#A#.|..#A#A#...#A#A#.|..#B#B#...#B#B#.|..#####...#####.|................`,
9:`................|................|#.....####.....#|##...#AAAA#...##|#B#.#AKAAKA#.#B#|#BB##AAAAAA##BB#|#BBB#AAAAAA#BBB#|#BBBBAAWWAABBBB#|.#BBBAWWWWABBB#.|..#BB#AWWA#BB#..|...###AAAA###...|.....#AAAA#.....|.....#B##B#.....|.....##..##.....|................|................`,
12:`......####......|.....#AAAA#.....|....#AAAAAA#....|....#AKAAKA#....|....#AAAAAA#....|.....#AAAA#.....|...###BBBB###...|..#AA#BBBB#AA#..|..#A##BBBB##A#..|..##.#BBBB#.##..|....#BBBBBB#....|...#BBBBBBBB#...|..#BBBBBBBBBB#..|..#BBBBBBBBBB#..|...##AA##AA##...|.....##..##.....`,
14:`................|................|................|.....######.....|...##BBBBBB##...|..#BBBBBBBBBB#..|.#BBB#BBBB#BBB#.|.#BBBBBBBBBBBB##|##############A#|#AAAAAAAAAAAAKA#|#AAAAAAAAAAAAAA#|.#A#AA####AA#A#.|.#A#AA#..#AA#A#.|.###BB#..#BB###.|...####..####...|................`
};
for (const S of [SHAPES, SHAPES_ALT]) for (const k in S) S[k] = S[k].split('|').map(r => (r + '................').slice(0, 16).split(''));
/* Small head ornaments chosen by primary type, drawn above the head in the type's colour. */
const ORN = {
  ears: ['X...X', 'XX.XX'], horn: ['..X..', '..X..', '.XXX.'], horns: ['X...X', 'X...X', '.X.X.'], tuft: ['.X.X.', '..X..'],
  flame: ['..X..', '.XX..', '.XXX.'], fin: ['..X..', '.XXX.'], leaf: ['...XX', '..XX.', '..X..'], zig: ['X...X', '.X.X.', '.X.X.'],
  gem: ['..X..'], spikes: ['X.X.X', 'XXXXX'], wisp: ['.X...', '..X..', '.X...']
};
const TYPE_ORN = ['ears','tuft','tuft','horn','ears','horn','zig','wisp','horn','flame','fin','leaf','zig','gem','spikes','horns','ears'];
const BODY = [null,'#5c6274','#5b90e2','#b3824e','#a4abb8','#6dc061','#f39bc1','#a373d2','#e05b49','#f5f5f1','#f1cb3e'];
const mix = (hex, to, a) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - a) + to * a).toString(16).padStart(2, '0')).join('');
const spriteCache = new Map();
function sprite(m) {
  if (spriteCache.has(m.i)) return spriteCache.get(m.i);
  let g = ((m.c >> 1) % 2 && SHAPES_ALT[m.h] || SHAPES[m.h]).map(r => r.slice());
  const hasKids = kids.has(m.i);
  /* 0 = first stage (drawn smaller), 1 = middle, 2 = final, 3 = does not evolve */
  const stage = !m.f && hasKids ? 0 : m.f && hasKids ? 1 : m.f ? 2 : 3;
  if (stage === 0) {
    let er = 0; g.forEach((r, y) => { if (r.includes('K')) er = y; });
    g.splice(er + 2, 1);
    g = g.map(r => r.filter((_, x) => x !== 7 && x !== 8));
  }
  if (m.c % 2) g.forEach(r => r.reverse());
  const N = 20, G = Array.from({ length: N }, () => Array(N).fill('.'));
  const ox = (N - g[0].length) >> 1, oy = N - g.length;
  g.forEach((r, y) => r.forEach((c, x) => { G[y + oy][x + ox] = c; }));
  const at = (x, y) => (G[y] || [])[x];
  const inner = (x, y) => [[1,0],[-1,0],[0,1],[0,-1]].every(([dx, dy]) => 'AWLD'.includes(at(x + dx, y + dy)));
  let eyeTop = N, eyeBot = 0;
  G.forEach((r, y) => { if (r.includes('K')) { eyeTop = Math.min(eyeTop, y); eyeBot = y; } });
  const pat = m.c % 5;
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    if (G[y][x] !== 'A') continue;
    if (!inner(x, y)) { if (at(x + 1, y) === '#' || at(x, y + 1) === '#') G[y][x] = 'D'; continue; }
    if (pat === 1 && y > eyeBot + 1 && x >= 7 && x <= 12) G[y][x] = 'L';
    else if (pat === 2 && (x * 7 + y * 13 + m.c * 5) % 8 === 0) G[y][x] = 'D';
    else if (pat === 3 && y > eyeBot && (y - eyeBot) % 3 === 2) G[y][x] = 'S';
    else if (pat === 4 && y >= eyeTop && y <= eyeBot) G[y][x] = 'D';
  }
  if (stage >= 2) for (let x = 0; x < N; x++) if (G[eyeTop][x] === 'K' && 'AD'.includes(at(x, eyeTop - 1))) G[eyeTop - 1][x] = '#';
  /* head ornament: taller on later stages */
  const top = G.findIndex(r => r.some(c => 'AD'.includes(c))), cols = [];
  G[top].forEach((c, x) => { if ('AD'.includes(c)) cols.push(x); });
  const cx = Math.round((cols[0] + cols[cols.length - 1]) / 2);
  let orn = ORN[TYPE_ORN[m.t[0]]];
  orn = stage === 0 ? orn.slice(-2) : stage >= 2 ? [orn[0]].concat(orn) : orn;
  const o0 = top - 1 - orn.length;
  orn.forEach((row, j) => row.split('').forEach((c, i) => { const x = cx - 2 + i, y = o0 + j; if (c === 'X' && y >= 0 && at(x, y) === '.') G[y][x] = 'O'; }));
  /* final forms get shoulder spikes in the accent colour */
  if (stage >= 2) {
    const r = Math.min(N - 3, eyeBot + 3), row = G[r];
    const x0 = row.findIndex(c => c !== '.'), x1 = N - 1 - row.slice().reverse().findIndex(c => c !== '.');
    [[x0 - 1, r], [x0 - 1, r - 1], [x0 - 2, r - 1], [x0 - 2, r - 2], [x1 + 1, r], [x1 + 1, r - 1], [x1 + 2, r - 1], [x1 + 2, r - 2]]
      .forEach(([x, y]) => { if (at(x, y) === '.') G[y][x] = 'P'; });
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
    if (G[y][x] === '.' && [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => 'OP'.includes(at(x + dx, y + dy)))) G[y][x] = 'o';
  if (m.x) [[1, 2], [18, 1], [17, 17]].forEach(([x, y]) => [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => { if (at(x + dx, y + dy) === '.') G[y + dy][x + dx] = 'Y'; }));
  const A = BODY[m.k], t2 = m.t[m.t.length - 1];
  let B = COL[t2];
  if (B.toLowerCase() === A.toLowerCase()) B = mix(B, 0, .3);
  const pal = { '#': '#1a2030', o: '#1a2030', K: '#1a2030', A, B, S: B, P: B, W: mix(A, 255, .7), L: mix(A, 255, .45), D: mix(A, 0, .22), O: mix(COL[m.t[0]], 0, .1), Y: '#f6c21c' };
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const c2 = cv.getContext('2d');
  G.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') { c2.fillStyle = pal[c]; c2.fillRect(x, y, 1, 1); } }));
  const url = cv.toDataURL();
  spriteCache.set(m.i, url);
  return url;
}
