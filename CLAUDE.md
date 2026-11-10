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
| `src/sprites.js` | Bộ vẽ hình pixel minh họa, được chèn vào chỗ `/*SPRITES*/` |
| `src/build.py` | Đọc CSV của PokeAPI, tính dữ liệu Gen V, chèn vào `/*DATA*/`, tạo `index.html`, `manifest.webmanifest`, `sw.js` |
| `src/fetch_data.sh` | Tải CSV về `src/data/` (thư mục này không commit) |
| `src/make_icons.js` | Vẽ lại `icons/*.png` (cần Playwright) |
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

Sau khi dựng, luôn kiểm tra trước khi đẩy lên:

1. Chạy máy chủ tĩnh ở thư mục gốc (`python3 -m http.server`) và mở bằng Playwright ở khung iPhone (390×844), cả giao diện sáng lẫn tối.
2. Không có lỗi JS trong console; `document.documentElement.scrollWidth - innerWidth` phải bằng 0 (không cuộn ngang).
3. Service worker ở trạng thái `activated`; ngắt mạng, tải lại, danh sách vẫn hiện.
4. Mở thử vài Pokémon có trường hợp đặc biệt: Eevee (nhiều nhánh), Snivy (được tặng), Whimsicott (chỉ có ở Black), Mewtwo (không có trong White), Ralts (White Forest).
5. Đi qua cả năm tab (Dex, Types, Places, Bosses, Team) và trang Options; thử cỡ chữ Largest xem có tràn ngang không.

## Xuất bản

GitHub Pages phục vụ nhánh `main`, thư mục gốc. Đẩy lên `main` là trang cập nhật sau khoảng một phút.
`sw.js` tự đổi tên bộ nhớ đệm theo nội dung trang, nên người dùng nhận bản mới ở lần mở kế tiếp khi có mạng.

**Không đổi địa chỉ ứng dụng** (tên repo, thư mục, tên miền riêng). Đổi địa chỉ làm hỏng bản đã cài trên iPhone.

## Quyết định đã chốt

- **Luật Gen V, không phải bản mới nhất.** Chưa có hệ Fairy (17 hệ); Steel kháng Ghost và Dark; chỉ số gốc và hệ lấy theo Gen V. `build.py` áp các bảng `*_past` của PokeAPI để làm việc này. Khi thêm dữ liệu mới, luôn kiểm tra nó có khác giữa các thế hệ không.
- **Chiêu thức theo Black/White.** Sức mạnh, độ chính xác, PP và hệ của chiêu lấy theo Gen V qua `move_changelog` (ví dụ Flamethrower 95, Tackle 50, Charm hệ Normal). Tên chiêu dùng tên tiếng Anh hiện tại.
- **Tiến hóa theo Black/White.** Ví dụ Magneton tiến hóa ở Chargestone Cave, Feebas bằng trao đổi kèm Prism Scale, độ thân thiết cần 220.
- **Không dùng hình gốc của game.** Sprite chính thức thuộc bản quyền Nintendo/Game Freak. Hình trong ứng dụng là linh vật tự vẽ theo dáng cơ thể, màu và hệ (`sprites.js`); trang chi tiết có nút mở hình gốc trên pokemondb.net. Đừng nhúng hay sao chép sprite chính thức, kể cả từ nguồn "miễn phí".
- **Phong cách pixel.** Press Start 2P cho số, nhãn hệ và tiêu đề ngắn; VT323 cho chữ đọc. Viền cứng, đổ bóng lệch, không bo góc.
- **Không chép lời mô tả Pokédex của game** (flavor text): đó là văn bản có bản quyền. Trang chi tiết chỉ hiện số liệu: loài, chiều cao, cân nặng, năng lực, tỉ lệ bắt, nhóm trứng…
- **Dữ liệu ngoài PokeAPI** (đội hình trùm, danh sách White Forest) lấy từ pokemondb.net và ghi trực tiếp trong `build.py`. Bulbapedia không truy cập được từ phiên đám mây.
- **Một file, không framework, không phụ thuộc mạng lúc chạy.** Dữ liệu nằm sẵn trong `index.html`; font tự lưu trữ.
- Đội, danh sách đã bắt và cỡ chữ lưu bằng `localStorage` trên máy người dùng, không có máy chủ. Trang Options có mã sao lưu (`PDX1.…`) để chép tay sang máy khác.

## Hạn chế đã biết

- Nơi bắt chưa gồm các đợt **swarm** và Dream World (chưa có nguồn dữ liệu), nên một số Pokémon vẫn bị ghi là không bắt được. White Forest đã có nhưng chỉ ở mức danh sách loài, không có tỉ lệ.
- Chưa có chiêu học qua trứng (egg moves) và Move Tutor.
- Hình minh họa không phải chân dung từng con; các con cùng dáng, màu, hệ và giai đoạn trông gần giống nhau.
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
