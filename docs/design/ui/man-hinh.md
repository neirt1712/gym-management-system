# Theo dõi màn hình (demo lần 1)

- **Ai cập nhật:** Bằng (cột Thiết kế, Figma, Ảnh); Sơn (cột Duyệt); người dựng màn (cột Code).
- **Trạng thái thiết kế:** Chưa vẽ → Đang vẽ → Chờ duyệt → Đã duyệt. **Code:** Chưa → Đang làm → Xong (PR #).
- Nội dung từng màn: `brief.md` mục 5. Ảnh: `anh/<số>-<tên-ngắn>.png` (ví dụ `anh/11-staff-members.png`, bản điện thoại thêm `-mobile`).
- Màn sau demo (lịch PT, lớp học, PT, báo cáo…) thêm vào bảng khi Figma đủ màn (25/10).

| # | Màn | Vai trò | Đường dẫn | UC | Người code | Thiết kế | Figma (frame) | Ảnh | Duyệt (Sơn) | Code |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Đăng nhập | Công khai | `/login` | UC02 | Sơn | Chưa vẽ | | | | Khung (PR #4, #14) |
| 2 | Đăng ký | Công khai | `/register` | UC01 | Sơn | Chưa vẽ | | | | Chưa |
| 3 | Trang chủ | Công khai | `/` | UC07 | Bằng | Chưa vẽ | | | | Chưa |
| 4 | Danh mục gói: lọc, so sánh | Công khai | `/packages` | UC07 | Bằng | Chưa vẽ | | | | Chưa |
| 5 | Chi tiết gói | Công khai | `/packages/:id` | UC07 | Bằng | Chưa vẽ | | | | Chưa |
| 6 | Mua gói (các bước) | Hội viên | `/member/purchase/:packageId` | UC09 | Sơn | Chưa vẽ | | | | Chưa |
| 7 | Kết quả thanh toán, biên lai | Hội viên | `/member/orders/:id` | UC12, UC14 | Sơn | Chưa vẽ | | | | Chưa |
| 8 | Tổng quan hội viên: gói của tôi, QR | Hội viên | `/member` | UC10, UC15 | Sơn | Chưa vẽ | | | | Chưa |
| 9 | Admin: quản lý gói | Admin | `/admin/packages` | UC08 | Bằng | Chưa vẽ | | | | Chưa |
| 10 | Admin: tài khoản | Admin | `/admin/users` | UC31–UC35 | Bằng | Chưa vẽ | | | | Chưa |
| 11 | Quầy: danh sách hội viên (Admin dùng chung, Q14) | Staff, Admin | `/staff/members` | UC19, UC20 | Bằng | Chưa vẽ | | | | Chưa |
| 12 | Quầy: chi tiết hội viên, mua hộ, đặt lại mật khẩu (Q15) | Staff, Admin | `/staff/members/:id` | UC09, UC11, UC19 | Bằng | Chưa vẽ | | | | Chưa |
| 13 | Quầy: xác nhận tiền mặt | Staff | `/staff/payments` | UC13, UC14 | Bằng | Chưa vẽ | | | | Chưa |
| 14 | Quầy: check-in, đang tập | Staff | `/staff/check-in` | UC16–UC18 | Bằng | Chưa vẽ | | | | Chưa |
| 15 | Thông báo | Mọi vai trò | `/notifications` | UC42 | Bằng | Chưa vẽ | | | | Chưa |

Trang 403, 404 đã có trong code, không cần vẽ.
