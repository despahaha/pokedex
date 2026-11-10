# Pokédex White

Sổ tay cá nhân cho người đang chơi **Pokémon White (Gen V)**: tiến hóa, nơi bắt, khắc hệ, quản lý đội.
Là một PWA tĩnh, chạy trên GitHub Pages: https://despahaha.github.io/pokedex/

## Người dùng

- Chủ repo dùng ứng dụng trên iPhone và đang tập dùng Claude Code. Trả lời bằng **tiếng Việt**, giải thích bằng lời thường, tránh thuật ngữ khi không cần.
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
4. Mở thử vài Pokémon có trường hợp đặc biệt: Eevee (nhiều nhánh), Snivy (được tặng), Whimsicott (chỉ có ở Black), Mewtwo (không có trong White).

## Xuất bản

GitHub Pages phục vụ nhánh `main`, thư mục gốc. Đẩy lên `main` là trang cập nhật sau khoảng một phút.
`sw.js` tự đổi tên bộ nhớ đệm theo nội dung trang, nên người dùng nhận bản mới ở lần mở kế tiếp khi có mạng.

**Không đổi địa chỉ ứng dụng** (tên repo, thư mục, tên miền riêng). Đổi địa chỉ làm hỏng bản đã cài trên iPhone.

## Quyết định đã chốt

- **Luật Gen V, không phải bản mới nhất.** Chưa có hệ Fairy (17 hệ); Steel kháng Ghost và Dark; chỉ số gốc và hệ lấy theo Gen V. `build.py` áp các bảng `*_past` của PokeAPI để làm việc này. Khi thêm dữ liệu mới, luôn kiểm tra nó có khác giữa các thế hệ không.
- **Tiến hóa theo Black/White.** Ví dụ Magneton tiến hóa ở Chargestone Cave, Feebas bằng trao đổi kèm Prism Scale, độ thân thiết cần 220.
- **Không dùng hình gốc của game.** Sprite chính thức thuộc bản quyền Nintendo/Game Freak. Hình trong ứng dụng là linh vật tự vẽ theo dáng cơ thể, màu và hệ (`sprites.js`); trang chi tiết có nút mở hình gốc trên pokemondb.net. Đừng nhúng hay sao chép sprite chính thức, kể cả từ nguồn "miễn phí".
- **Phong cách pixel.** Font Press Start 2P chỉ dùng cho chữ không dấu (số, nhãn hệ, tiêu đề tiếng Anh) vì nó không có dấu tiếng Việt; chữ tiếng Việt dùng VT323. Viền cứng, đổ bóng lệch, không bo góc.
- **Tên Pokémon, hệ, vật phẩm, địa điểm giữ tiếng Anh** cho khớp chữ trong game; phần còn lại tiếng Việt.
- **Một file, không framework, không phụ thuộc mạng lúc chạy.** Dữ liệu nằm sẵn trong `index.html`; font tự lưu trữ.
- "Đội của tôi" lưu bằng `localStorage` trên máy người dùng, không có máy chủ.

## Hạn chế đã biết

- Nơi bắt chưa gồm **White Forest** và các đợt **swarm** (PokeAPI không có), nên một số Pokémon bị ghi là không bắt được trong cốt truyện.
- Hình minh họa không phải chân dung từng con; các con cùng dáng, màu, hệ và giai đoạn trông gần giống nhau.
- Dạng thay thế (Rotom, Deoxys, Basculin sọc đỏ/xanh…) chưa được tách riêng.

## Kế hoạch

1. ~~Đưa mã nguồn vào repo, rút gọn địa chỉ~~ (xong). Còn lại: chủ repo thử trên iPhone thật.
2. Hữu ích hơn khi chơi: **chiêu thức** (học ở cấp nào, TM/HM), **tra theo địa điểm**, đội hình Gym và Tứ Đại Thiên Vương, bổ sung White Forest và swarm, đánh dấu "đã bắt".
3. Giao diện: thêm dáng hình cho các nhóm còn giống nhau, tìm kiếm theo hệ hoặc cấp, sao lưu và khôi phục đội, tùy chọn cỡ chữ.
4. Mở rộng sang Black 2 / White 2 hoặc thế hệ khác, chỉ khi chủ repo cần.
