# BITC – THANK YOU.EXE

Website tĩnh tri ân ngày Nhà giáo Việt Nam 20/11 của **CLB Công nghệ thông tin BITC**. Trải nghiệm gồm đúng ba màn hình: tìm người nhận, kích hoạt Gratitude Network, đọc lời chúc cá nhân.

## Cấu trúc

```text
bitc-thank-you-exe/
├── index.html
├── assets/images/
│   ├── bitc-logo.png
│   ├── btec-fpt-logo.png
│   └── btec-fpt-transparent.png
├── css/
│   ├── style.css
│   ├── animations.css
│   ├── responsive.css
│   ├── logo.css
│   └── compilation.css
├── js/
│   ├── data.js
│   ├── search.js
│   ├── network.js
│   ├── animations.js
│   ├── animations-next.js
│   ├── message.js
│   └── main.js
├── tools/
│   ├── serve.mjs
│   ├── check.mjs
│   ├── check-animation.mjs
│   ├── logo-preview-dark.png
│   └── logo-preview-light.png
├── README.md
└── TESTING.md
```

Hai file logo gốc trong `assets/images` là bản sao từ workspace. Logo BTEC gốc **đã có nền trong suốt** (680.990 pixel alpha 0, 9.374 pixel alpha một phần); vùng trắng trước đây đến từ khung CSS. `btec-fpt-transparent.png` là bản sao byte-for-byte của ảnh gốc để dùng với khung Tech Glass mới. Không có pixel màu thương hiệu nào bị sửa. Dữ liệu 24 người và lời chúc gốc nằm trong `js/data.js`; không cần cơ sở dữ liệu, backend, API key hoặc bước build.

## Chạy trong VS Code

1. Mở thư mục `bitc-thank-you-exe` bằng **File → Open Folder**.
2. Mở terminal trong VS Code.
3. Chạy `node tools/serve.mjs` (Node.js 20 trở lên), sau đó mở `http://127.0.0.1:4173/`.
4. Dừng máy chủ xem trước bằng `Ctrl+C`.

Có thể dùng tiện ích Live Server để mở `index.html`. Không mở trực tiếp bằng `file://` vì JavaScript ES modules cần HTTP. Bootstrap 5 và Google Fonts được tải qua CDN, vì vậy cần Internet để hiển thị đúng font và stylesheet Bootstrap; các chức năng và dữ liệu cá nhân đều chạy ở trình duyệt.

## Chỉnh sửa

- `js/data.js`: tên, cách xưng hô, ngôn ngữ và lời chúc. Mỗi người có ID duy nhất.
- `js/search.js`: chuẩn hóa Unicode, bỏ dấu, gợi ý và điều khiển bàn phím.
- `js/network.js`, `css/animations.css` và `css/compilation.css`: hình SVG, chuyển động mạng lưới và quá trình dựng thiệp.
- `js/animations.js` xuất API từ `js/animations-next.js`: state machine, timeline RUN, phân mảnh chữ COMPLETE bằng Canvas và dọn overlay khi reset.
- `css/logo.css`: hai khung Tech Glass cùng chiều cao. Khung BTEC sáng để chữ xanh dương và xanh lá dễ đọc.
- `js/message.js`: nội dung panel tiếng Việt/Anh.
- `js/main.js`: chuyển màn hình, chọn người nhận, reset.
- `css/style.css` và `css/responsive.css`: giao diện và điểm ngắt.

Chạy `node tools/check.mjs` và `node tools/check-animation.mjs` sau khi sửa dữ liệu hoặc animation. Các dòng trạng thái và thanh tiến trình trong giao diện là hiệu ứng minh họa, không thực hiện xác minh danh tính hay kết nối máy chủ.

Chuỗi RUN hiện dài **5,2 giây**: INITIALIZING (0–0,5s), CONNECTING (0,5–2,0s), COMPLETE (2,0–2,8s), DATA FRAGMENTATION (2,8–3,6s), CARD RECONSTRUCTION (3,6–4,4s), MESSAGE REVEAL (4,4–5,2s). Với `prefers-reduced-motion`, website hiện COMPLETE ngắn rồi chuyển tới lời chúc mà không tạo mảnh chuyển động.

**Cần xác nhận trước khi công bố:** cách xưng hô “Cô” của Bùi Thị Minh Trí và “Thầy” của Trần Lê Anh Minh được giữ đúng theo danh sách dự án, chưa có xác minh chính thức.

## Tự đưa lên GitHub và Vercel sau này

Khi đã kiểm tra nội dung và giao diện trên thiết bị thật:

1. Tự tạo một repository GitHub mới và đưa **nội dung của thư mục dự án này** lên repository đó. `index.html` phải nằm tại gốc repository.
2. Trong Vercel, tự chọn **New Project**, kết nối repository vừa tạo.
3. Chọn Framework Preset **Other**, bật Override cho Build Command và để trống lệnh build. Không có thư mục `public`, nên Vercel sẽ phục vụ file từ gốc project; không cần đặt Output Directory riêng.
4. Tự triển khai và kiểm tra URL, logo, font, tìm kiếm, lời chúc và responsive. Sau đó mới cấu hình tên miền nếu muốn.

Dự án hiện chỉ được tạo và kiểm tra tại máy local; chưa tạo Git repository và chưa deploy.

Tham khảo tài liệu Vercel: [Deploying Git Repositories](https://vercel.com/docs/git) và [Configuring a Build](https://vercel.com/docs/builds/configure-a-build).
