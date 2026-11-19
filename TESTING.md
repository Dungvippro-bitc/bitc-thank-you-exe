# Kiểm thử BITC – THANK YOU.EXE

## Đã kiểm tra bằng công cụ local

Ngày kiểm tra: 19/11/2026.

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Dữ liệu 24 người, 22 lời chúc tiếng Việt, 2 tiếng Anh | PASS | `node tools/check.mjs` |
| 24 tên và lời chúc khớp nguyên văn tài liệu được cung cấp | PASS | So sánh chuỗi từng bản ghi với file đính kèm bằng PowerShell |
| Timeline mới 5,2s, thứ tự phase, khóa RUN, reset và reduced motion | PASS ở mức logic | `node tools/check-animation.mjs` với đồng hồ mô phỏng |
| Logo BTEC có alpha và bản mới giữ nguyên dữ liệu ảnh | PASS | Đọc kênh alpha PNG và đối chiếu SHA-256 hai file |
| Logo BTEC trên nền sáng và tối | Đã kiểm tra ảnh ghép | `tools/logo-preview-light.png` và `tools/logo-preview-dark.png`; chữ xanh cần backplate sáng |
| ID, tên không trùng; lời chúc không rỗng | PASS | `node tools/check.mjs` |
| Tìm có dấu, không dấu, khác chữ hoa/thường, thừa khoảng trắng, một phần tên, sai nhẹ | PASS | `node tools/check.mjs` |
| Tên mơ hồ trả về nhiều lựa chọn, tên không tồn tại trả về rỗng | PASS | `node tools/check.mjs` |
| Có đúng 3 màn hình và đầy đủ file CSS, JS, logo được liên kết | PASS | `node tools/check.mjs` |
| Cú pháp toàn bộ file JS | PASS | `node --check` từng file |
| Trang chính, 3 CSS, 2 JS và 2 logo trả HTTP 200 với đúng MIME | PASS | Local server `node tools/serve.mjs` và `Invoke-WebRequest` |

Hai lời chúc tiếng Anh thuộc đúng Ian Michael Biggar và Joseph Wallace Wisham III. Lời chúc đã được đưa trực tiếp từ văn bản gốc vào `data.js`, không viết lại.

## Chưa thể xác minh bằng trình duyệt trong phiên này

Trình duyệt tự động của môi trường trả về danh sách trình duyệt trống. Vì vậy **không đánh dấu PASS** cho các kiểm thử tương tác hoặc hiển thị chưa chạy thật:

- TC01–TC05: render trang chủ, vị trí logo/ô nhập/tiêu đề.
- TC10–TC19: autocomplete, bàn phím, chuyển màn hình, RUN, hoạt ảnh và reduced motion.
- TC20, TC23–TC27: lời chúc hiển thị đúng người, không bị cắt, font, tên dài và reset.
- TC28–TC32: responsive, cuộn, tràn ngang, header/footer và trình duyệt Chrome/Edge/Safari.

Đối với yêu cầu nâng cấp, các kiểm thử hình ảnh TC01–TC05 và TC08–TC13, TC18–TC20 vẫn cần thử trong trình duyệt thật: độ cân đối logo, từng trạng thái COMPLETE/fragments/card, layout ở 360/375/390px, hiệu ứng giảm chuyển động và console. TC06–TC07, TC14–TC17 đã có kiểm tra logic hoặc chức năng nền nhưng vẫn cần xác nhận end-to-end trên UI.

TC06–TC09, TC12, TC21–TC22 đã được kiểm tra ở mức **dữ liệu và hàm tìm kiếm**; hành vi UI tương ứng vẫn cần kiểm thử trong trình duyệt.

## Danh sách kiểm tra thủ công trước khi công bố

1. Mở trang bằng Chrome/Edge, kiểm tra console không có lỗi. Xem hai logo, font, tiêu đề và vị trí ô nhập.
2. Gõ `Nguyễn Thành Long`, `Nguyen Thanh Long`, `Vinh Phuc`, `Ian`, `Trung Anh`, `Ngyuen Thanh Long`. Thử Arrow Up/Down, Enter, Escape, click/touch; thử `Long` để đảm bảo phải tự chọn người nhận.
3. Chọn từng người nhận, xác nhận tên trên RUN, nhấn RUN nhiều lần nhanh, xem hiệu ứng và lời chúc đúng người. Thử cả hai người nước ngoài.
4. Bật “Reduce motion” của hệ điều hành, thử RUN để đảm bảo lời chúc hiện ngay. Thử Space/Enter trên nút.
5. Trở về trang chủ, xác nhận input và nội dung cũ đã xóa, rồi chọn người khác.
6. Kiểm tra lần lượt 1920×1080, 1440×900, 1366×768, 768×1024, 390×844, 375×667 và 360×800; thêm xoay ngang và zoom. Đặc biệt kiểm tra autocomplete khi bàn phím điện thoại hiện, không tràn ngang và lời chúc dài đọc được toàn bộ.
7. Xác nhận cách xưng hô của Bùi Thị Minh Trí và Trần Lê Anh Minh với danh sách chính thức trước khi công bố.
8. Quan sát chuỗi RUN trong khoảng 5,2 giây: mạng lưới sáng tuần tự → COMPLETE rõ ở tâm → ô dữ liệu sinh từ vùng chữ → ô di chuyển tới viền thiệp → tên, lời chúc và chữ ký hiện lần lượt. Thử nhấn RUN liên tục và quay về trang chủ sau mỗi lượt.
