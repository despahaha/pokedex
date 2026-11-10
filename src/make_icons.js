const { chromium } = require('playwright');
// 16x16 pixel icon: red handheld with a blue lens and three status lights (own design)
const G = [
'RRRRRRRRRRRRRRRR',
'RRRRRRRRRRRRRRRR',
'RRWWWWWRRRRRRRRR',
'RRWBBBWRRyRgRrRR',
'RRWBLBWRRRRRRRRR',
'RRWBBDWRRRRRRRRR',
'RRWWWWWRRRRRRRRR',
'KKKKKKKKKKKKKKKK',
'SSSSSSSSSSSSSSSS',
'SSKKKKKKKKKKKKSS',
'SSKPPPPPPPPPPKSS',
'SSKPPGGPPPPPPKSS',
'SSKPGGGGPYYYPKSS',
'SSKPPGGPPPPPPKSS',
'SSKKKKKKKKKKKKSS',
'SSSSSSSSSSSSSSSS'];
const PAL = { R:'#d63a2c', W:'#fff6ee', B:'#6fd0ff', L:'#e8f8ff', D:'#2b86c9', K:'#1a2030', S:'#b9302a', P:'#f8fafb', G:'#6dc061', Y:'#ffd84a', y:'#ffd84a', g:'#4bc56d', r:'#ff8a7a' };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const s of [180, 192, 512]) {
    const data = await p.evaluate(({ G, PAL, s }) => {
      const c = document.createElement('canvas'); c.width = c.height = s;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      x.fillStyle = PAL.R; x.fillRect(0, 0, s, s);
      const pad = Math.round(s * 0.09), cell = (s - pad * 2) / 16;
      G.forEach((row, j) => [...row].forEach((ch, i) => { x.fillStyle = PAL[ch]; x.fillRect(Math.floor(pad + i * cell), Math.floor(pad + j * cell), Math.ceil(cell), Math.ceil(cell)); }));
      /* extend the edge colours into the padding so the icon is full-bleed */
      x.fillStyle = PAL.K; x.fillRect(0, Math.floor(pad + 7 * cell), s, Math.ceil(cell));
      x.fillStyle = PAL.S; x.fillRect(0, Math.floor(pad + 8 * cell), pad, s); x.fillRect(s - pad, Math.floor(pad + 8 * cell), pad, s); x.fillRect(0, s - pad, s, pad);
      return c.toDataURL('image/png');
    }, { G, PAL, s });
    require('fs').writeFileSync(__dirname + `/../icons/icon-${s}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  await b.close();
})();
