# Pokédex White

Sổ tay cá nhân cho người đang chơi **Pokémon White (Gen V)**: tiến hóa, nơi bắt, chiêu thức, khắc hệ, trùm Gym, quản lý đội.
Là một PWA tĩnh, chạy trên GitHub Pages: https://despahaha.github.io/pokedex/

## Người dùng

- Chủ repo dùng ứng dụng trên iPhone và đang tập dùng Claude Code. **Trò chuyện bằng tiếng Việt**, giải thích bằng lời thường, tránh thuật ngữ khi không cần.
- **Giao diện ứng dụng hoàn toàn bằng tiếng Anh** (chủ repo yêu cầu, để khớp với game). Mọi chữ mới thêm vào ứng dụng phải là tiếng Anh.
- Ứng dụng phải dùng được **không cần Developer Mode** trên iPhone. Đây là lý do dự án tồn tại, đừng đề xuất hướng nào cần bật nó.

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `src/page.html` | Toàn bộ giao diện và logic (HTML, CSS, JS trong một file). **Sửa ở đây.** |
| `src/sprites.js` | Bộ vẽ linh vật pixel dự phòng (dùng khi hình thật không tải được), chèn vào chỗ `/*SPRITES*/` |
| `src/build.py` | Đọc CSV của PokeAPI, tính dữ liệu Gen V, chèn vào `/*DATA*/`, tạo `index.html`, `manifest.webmanifest`, `sw.js` |
| `src/fetch_data.sh` | Tải CSV về `src/data/` (thư mục này không commit) |
| `src/make_icons.js` | Vẽ lại `icons/*.png` (cần Playwright) |
| `tests/app.test.js` | Bộ kiểm tra tự động chạy trên bản đã dựng |
| `index.html`, `sw.js`, `manifest.webmanifest` | **File sinh ra, không sửa tay.** Mỗi lần dựng sẽ bị ghi đè |
| `fonts/`, `fonts.css`, `icons/` | Tài nguyên tĩnh, commit sẵn |
| `pokedex-pwa/index.html` | Trang chuyển hướng từ địa chỉ cũ. Giữ nguyên |

## Dựng và kiểm tra

```bash
sh src/fetch_data.sh
```

```bash
python3 src/build.py
```

Sau khi dựng, chạy bộ kiểm tra trước khi đẩy lên (cần Playwright và mạng tới `raw.githubusercontent.com`):

```bash
node tests/app.test.js
```

Bộ này mở ứng dụng ở khung iPhone và kiểm tra: không lỗi JS, không cuộn ngang, hình thật hiện ở danh sách và trang chi tiết, linh vật thay thế khi máy chủ hình không tới được, hình đã xem vẫn hiện khi offline, nút xóa ô tìm kiếm, và năm tab cùng trang Options ở cỡ chữ lớn nhất.

Khi thêm tính năng: viết bài kiểm tra trong `tests/app.test.js` trước, chạy cho thấy nó thất bại, rồi mới sửa `src/`. Với thay đổi về hình thức, chụp thêm ảnh ở cả giao diện sáng và tối để xem bằng mắt.

## Xuất bản

GitHub Pages phục vụ nhánh `main`, thư mục gốc. Đẩy lên `main` là trang cập nhật sau khoảng một phút.
`sw.js` tự đổi tên bộ nhớ đệm theo nội dung trang, nên người dùng nhận bản mới ở lần mở kế tiếp khi có mạng.

**Không đổi địa chỉ ứng dụng** (tên repo, thư mục, tên miền riêng). Đổi địa chỉ làm hỏng bản đã cài trên iPhone.

## Quyết định đã chốt

- **Luật Gen V, không phải bản mới nhất.** Chưa có hệ Fairy (17 hệ); Steel kháng Ghost và Dark; chỉ số gốc và hệ lấy theo Gen V. `build.py` áp các bảng `*_past` của PokeAPI để làm việc này. Khi thêm dữ liệu mới, luôn kiểm tra nó có khác giữa các thế hệ không.
- **Chiêu thức theo Black/White.** Sức mạnh, độ chính xác, PP và hệ của chiêu lấy theo Gen V qua `move_changelog` (ví dụ Flamethrower 95, Tackle 50, Charm hệ Normal). Tên chiêu dùng tên tiếng Anh hiện tại.
- **Tiến hóa theo Black/White.** Ví dụ Magneton tiến hóa ở Chargestone Cave, Feebas bằng trao đổi kèm Prism Scale, độ thân thiết cần 220.
- **Hình Pokémon: hiển thị từ máy chủ PokeAPI, không chép vào repo.** Bản PWA tải sprite Black/White trực tiếp từ `raw.githubusercontent.com/PokeAPI/sprites` (chủ repo chọn bộ này ngày 2026-11-11). Hình thuộc bản quyền The Pokémon Company, nên **không commit file hình, không nhúng dạng data URI**. Khi không tải được (offline và chưa từng xem, máy chủ lỗi) trang tự dùng linh vật tự vẽ trong `sprites.js`. Service worker lưu hình đã xem vào bộ nhớ riêng `pokedex-sprites-v1` trên máy người dùng. Bản trên claude.ai bị chặn ảnh ngoài nên `build.py` để `SPRITE_URL` rỗng và chỉ dùng linh vật.
- **Phong cách pixel.** Press Start 2P cho số, nhãn hệ và tiêu đề ngắn; VT323 cho chữ đọc. Viền cứng, đổ bóng lệch, không bo góc.
- **Không chép lời mô tả Pokédex của game** (flavor text): đó là văn bản có bản quyền. Trang chi tiết chỉ hiện số liệu: loài, chiều cao, cân nặng, năng lực, tỉ lệ bắt, nhóm trứng…
- **Dữ liệu ngoài PokeAPI** (đội hình trùm, danh sách White Forest) lấy từ pokemondb.net và ghi trực tiếp trong `build.py`. Bulbapedia không truy cập được từ phiên đám mây.
- **Một file, không framework, không phụ thuộc mạng lúc chạy.** Dữ liệu nằm sẵn trong `index.html`; font tự lưu trữ.
- Đội, danh sách đã bắt và cỡ chữ lưu bằng `localStorage` trên máy người dùng, không có máy chủ. Trang Options có mã sao lưu (`PDX1.…`) để chép tay sang máy khác.

## Hạn chế đã biết

- Nơi bắt chưa gồm các đợt **swarm** và Dream World (chưa có nguồn dữ liệu), nên một số Pokémon vẫn bị ghi là không bắt được. White Forest đã có nhưng chỉ ở mức danh sách loài, không có tỉ lệ.
- Chưa có chiêu học qua trứng (egg moves) và Move Tutor.
- Ứng dụng phụ thuộc máy chủ hình của PokeAPI; nếu kho đó đổi đường dẫn thì toàn bộ hình quay về linh vật cho tới khi sửa `SPRITE_URL` trong `src/page.html`.
- Dạng thay thế (Rotom, Deoxys, Basculin sọc đỏ/xanh…) chưa được tách riêng.

## Kế hoạch

Đã xong:
1. Mã nguồn trong repo, địa chỉ ngắn, PWA chạy offline.
2. Giao diện tiếng Anh; số liệu Pokédex; chiêu thức theo cấp và TM/HM; tra theo địa điểm (tab Places); đội hình trùm (tab Bosses); White Forest; đánh dấu đã bắt.
3. Tìm theo hệ, năng lực, cấp tiến hóa; sao lưu và khôi phục; tùy chọn cỡ chữ; thêm dáng hình thứ hai cho 5 nhóm cơ thể phổ biến.

Còn lại, theo thứ tự ưu tiên:
1. Chủ repo thử trên iPhone thật và báo chỗ bất tiện.
2. Swarm, egg moves, Move Tutor (cần tìm nguồn dữ liệu truy cập được).
3. Dạng thay thế (Rotom, Deoxys, Basculin…).
4. Tra ngược theo chiêu: chọn một TM để xem con nào học được.
5. Mở rộng sang Black 2 / White 2, chỉ khi chủ repo cần.
