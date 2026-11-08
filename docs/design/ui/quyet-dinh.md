# Nhật ký quyết định giao diện

- **Ai ghi:** Sơn chốt; Bằng hoặc Claude ghi giúp, Sơn duyệt qua PR.
- **Quy tắc:** mỗi quyết định một dòng, có ngày và lý do. Đổi quyết định cũ thì **thêm dòng mới** ghi "thay UI-xx", không xóa dòng cũ.
- `/fe-design-lock` đọc file này để sinh `huong-dan-giao-dien.md`; chỉ dòng **Đã chốt** mới được đưa vào hướng dẫn.

## Đã chốt

| # | Ngày | Hạng mục | Quyết định | Lý do / nguồn |
| --- | --- | --- | --- | --- |
| UI-01 | 06/10 | Thư viện giao diện | Ant Design 5, icon chỉ dùng `@ant-design/icons` | ADR 0001; nhiều bảng và form quản trị |
| UI-02 | 06/10 | Khoảng cách | Bội số của 8 (`space`: 4, 8, 16, 24, 32) | `theme/tokens.ts`, `.claude/rules/frontend-ui.md` |
| UI-03 | 06/10 | Màu trạng thái | Nhãn và màu theo `theme/status.ts` (xanh lá = xong, xanh dương = đang diễn ra, cam = đang chờ, đỏ = hỏng, cyan = tạm dừng, xám = kết thúc) | `theme/status.ts` |
| UI-04 | 06/10 | Chữ trên giao diện | Xưng "bạn", nút bắt đầu bằng động từ, thông báo thành công ≤ 6 chữ, thuật ngữ cố định | `.claude/rules/frontend-ui.md` |
| UI-05 | 06/10 | Bố cục trang | PageHeader → thanh lọc → nội dung (bảng hoặc Card 2/3 + 1/3); điện thoại một cột, nút chính dính đáy; mỗi màn một nút primary; đủ 4 trạng thái | `.claude/rules/frontend-ui.md` |
| UI-06 | 07/10 | Font | Be Vietnam Pro qua Google Fonts `<link>` (đang dùng; có thể đổi khi chốt phong cách, xem UI-P1) | Q7 |
| UI-07 | 09/10 | Công cụ AI thiết kế | `/impeccable` chỉ là gợi ý; quy ước nhóm thắng khi khác. Trước khi chốt phong cách chỉ dùng `audit`, `critique` | Q18 |
| UI-08 | 09/10 | Nơi lưu tài liệu thiết kế | `docs/design/ui/` là nguồn chuẩn; Bằng vẽ và cập nhật, Sơn duyệt và chốt | Q19 |
| UI-09 | 10/10 | Bộ màu (thay bộ tạm xanh ngọc) | **6 màu:** nền `#F7F8FA`, trắng `#FFFFFF`, viền `#E3E5EA`, nhấn xanh lá tươi `#2BD46A` (màu nhấn duy nhất: nút chính, mục đang chọn; chữ trên nó luôn là xanh than), xanh than `#1B2430` (chữ chính, khối tối), xám `#5F6773` (chữ phụ). Ngoại lệ: thành công `#E3F5EA`/`#17663A`, lỗi `#FDE8E6`/`#A3241B`. Tương phản đã đo trong mock (thấp nhất 5,4) | Sơn chốt theo bản Claude Design của nhóm, `mock/BangMau.html`. `theme/tokens.ts` đổi khi chạy `/fe-design-lock` (Bằng duyệt) |
| UI-10 | 10/10 | Hướng animation | Có animation, phong cách thể thao của phòng gym (dứt khoát, có lực, nhanh). **Tôn trọng khuyến cáo của impeccable:** hiệu ứng nào impeccable khuyên tránh (ví dụ nảy, đàn hồi) thì không dùng, thay bằng hiệu ứng khác cùng tinh thần thể thao. Giữ `prefers-reduced-motion`; màn quầy không để animation làm chậm thao tác | Sơn chốt 10/10 |
| UI-11 | 10/10 | Mock HTML | `docs/design/ui/mock/` (44 màn + `styles.css` + `index.html`) là bản mock chuẩn, chép từ bản Claude Design của nhóm. Ảnh sẽ cập nhật sau (đang để trống) | Sơn chốt 10/10 |
| UI-12 | 10/10 | Màn bổ sung vào mock | **Cần cho demo 30/10:** trạng thái đang tải, rỗng, lỗi (làm mẫu trên Quầy: danh sách hội viên); đăng nhập khi tài khoản bị khóa và khóa tạm. **Chưa cần (làm sau demo):** chi tiết "Gói của tôi", hội viên xem lịch sử ra vào, Admin giao dịch, Admin quản lý PT, chi tiết đơn hàng riêng, trang 403/404 (đã có trong code, chỉ đổi màu), khung điện thoại vẽ riêng | Sơn chốt 10/10; bảng đầy đủ ở `TIEP-TUC.md` mục 4 |
| UI-13 | 10/10 | Vai trò của mock khi code | Mock HTML chỉ là **bản demo để xem**, không chép nguyên HTML/CSS của mock vào `frontend/src`. Khi dựng màn thật: **lấy mock làm gốc** (bố cục, nội dung, màu, chữ, animation) rồi **dùng `/impeccable`** để hoàn thiện trên code thật (Ant Design + `theme/`); tên trường và endpoint theo `openapi.yaml`, không theo chú thích trong mock | Sơn chốt 10/10 |
| UI-14 | 10/10 | Nhập 13 màn bổ sung từ bản Claude Design | Đã thêm vào `mock/` (tổng 57 màn): `TrangThai`, `DangNhapKhoa` (2 nhóm "cần"); `GoiCuaToi`, `LichSuRaVao`, `GiaoDich`, `QuanTriPT`, `ChiTietDon`, `Loi403`, `Loi404` (chưa cần cho demo, để sẵn); `DTTrangChu`, `DTDangNhap`, `DTTongQuan`, `DTLichTap` (bản điện thoại). 44 màn cũ và `styles.css` giữ bản đã rà trong repo, không chép đè từ artifact | Sơn chọn phương án 1, 10/10 |

## Đang chờ chốt

| # | Hạng mục | Hiện trạng | Cần gì để chốt | Ai |
| --- | --- | --- | --- | --- |
| UI-P1 | Phong cách chi tiết (cỡ chữ từng cấp, bo góc, đổ bóng, hình khối trang trí) | Theo mock: tiêu đề Oswald viết hoa, chữ thường Be Vietnam Pro, bo góc 12–28px, nút bo tròn, ảnh lớn | Rà qua `/impeccable` trên `mock/`, rồi `/fe-design-lock` | Sơn chốt |
| UI-P3 | Ảnh thật; rà 13 màn mới (thẻ lồng thẻ, bảng sát viền) | Màn đã đủ (UI-14); ảnh còn trống | Nhóm gửi ảnh; rà khi dựng màn thật (UI-13) | Sơn, Bằng |
| UI-P4 | Animation | Đã rà `mock/styles.css` qua `/impeccable animate` (10/10): bỏ hết đường cong nảy, lắc lư, co giãn; thay bằng "bật nhanh, hãm gọn" (`--ease`) và nhịp "một rep" (`--ease-rep`); vào trang 0,36s, trễ tối đa 0,16s; menu trái không chạy lại; dải chữ chỉ trượt theo tay cuộn; chấm thông báo nháy 3 lần rồi dừng; chế độ giảm chuyển động vẫn giữ đổi màu. **Chưa xem bằng mắt trên trình duyệt.** Đã sửa thêm theo bộ dò: bỏ vạch màu cạnh thẻ, bỏ 35 nhãn vai trò trên tiêu đề, chữ phụ và placeholder đủ tương phản, bỏ nền sọc toàn trang. Còn lại: xem `TIEP-TUC.md` | Sơn và Bằng mở `mock/index.html` xem thử, rồi chốt | Sơn chốt |
