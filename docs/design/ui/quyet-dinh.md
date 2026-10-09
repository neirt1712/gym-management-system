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

## Đang chờ chốt

| # | Hạng mục | Hiện trạng | Cần gì để chốt | Ai |
| --- | --- | --- | --- | --- |
| UI-P1 | Phong cách chung (cảm giác, kiểu chữ, độ bo góc, độ đậm nhạt) | Bộ tạm: sáng, gọn, một màu nhấn xanh ngọc; bo góc 8; font Be Vietnam Pro | Ảnh sơ bộ các màn chính trong `anh/` | Bằng vẽ, Sơn chốt |
| UI-P2 | Bộ màu | Tạm trong `theme/tokens.ts`: primary `#0F766E`, success `#16A34A`, warning `#D97706`, error `#DC2626`, info `#2563EB`, nền `#F6F7F9`. Lỗi: nền nhạt màu chính và màu thành công do Ant Design sinh bị xám (`#a8b5b2`, `#d3e3d6`) | Mã màu chốt cho 10 màu gốc + quyết định có ghi đè nền nhạt không | Sơn chốt, Bằng sửa `tokens.ts` |
| UI-P3 | Figma 15 màn demo | Chưa có link (Q4) | Link Figma, ảnh từng màn trong `anh/` | Bằng |
