# Pokédex White

Sổ tay cá nhân cho Pokémon White (giao diện tiếng Anh): tiến hóa, nơi bắt, chiêu thức, khắc hệ Gen V, đội hình trùm, quản lý đội và theo dõi Pokémon đã bắt.
Ứng dụng web cài được (PWA), chạy offline sau lần mở đầu tiên.

**Mở ứng dụng:** https://despahaha.github.io/pokedex/

Cài lên iPhone: mở link bằng Safari → Chia sẻ → "Thêm vào Màn hình chính".

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest`, `fonts.css`, `fonts/`, `icons/` | Ứng dụng đã dựng, GitHub Pages phục vụ trực tiếp |
| `src/page.html` | Giao diện và logic (HTML, CSS, JS) |
| `src/sprites.js` | Bộ vẽ hình pixel minh họa |
| `src/build.py` | Ghép dữ liệu vào trang, tạo manifest và service worker |
| `src/fetch_data.sh` | Tải bảng dữ liệu PokeAPI về `src/data/` (không commit) |
| `src/make_icons.js` | Vẽ lại biểu tượng ứng dụng (cần Playwright) |
| `tests/app.test.js` | Bộ kiểm tra tự động: `node tests/app.test.js` |

## Dựng lại sau khi sửa

```bash
sh src/fetch_data.sh
```

```bash
python3 src/build.py
```

Sửa giao diện trong `src/page.html`, không sửa trực tiếp `index.html` vì file này được tạo lại mỗi lần dựng.

## Ghi chú

- Dữ liệu từ [PokeAPI](https://pokeapi.co), áp dụng luật Gen V (chưa có hệ Fairy).
- Đội hình trùm và danh sách White Forest lấy từ [Pokémon Database](https://pokemondb.net).
- Nơi bắt chưa gồm các đợt bầy đàn (swarm) và Dream World.
- Hình Pokémon là sprite Black/White, tải trực tiếp từ kho [PokeAPI/sprites](https://github.com/PokeAPI/sprites) khi xem (© The Pokémon Company, không lưu trong repo này). Khi không tải được, ứng dụng hiện linh vật tự vẽ.
