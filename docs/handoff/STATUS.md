# Trạng thái hiện tại

- **Ai cập nhật:** mỗi người tự sửa dòng của mình khi xong task (`/team-finish`) và trước buổi họp Thứ Hai.
- **Ai đọc:** cả nhóm và Claude, ở đầu mỗi phiên (`/team-start`).
- Giữ ngắn: tối đa 3 gạch đầu dòng mỗi cột. Lịch sử xem git log, không chép vào đây.

Cập nhật lần cuối: 05/11/2026 (mục bên dưới bảng); 25/10 (dòng Sơn); 18/10 (dòng Triển, Hồng Anh)

**Ghi chú 05/11 (Sơn cùng Claude, nhánh local `tsonw4-tich-hop`, chưa commit, chưa push):** viết thay phần BE còn trễ: Auth (trừ quên/đặt lại mật khẩu), `/me` + tạo lại QR, đơn hàng, thanh toán tiền mặt và VNPay + IPN, đọc gói hội viên. Typecheck, lint, 33 unit test đạt. **Chưa chạy e2e vì máy chưa có database**, nên chưa coi là xong. Test frontend còn 8–9/43 lỗi timeout, chưa xác định nguyên nhân. Còn thiếu: tài khoản `users`, check-in, thông báo, seed demo, `POST /uploads/avatar`; toàn bộ phần của Bằng; nối FE với API thật.

| Người | Đã xong (tuần này) | Đang làm | Đang vướng / chờ ai |
| --- | --- | --- | --- |
| Triển | openapi 0.2.0 đủ 74 API + 2 endpoint Q6/Q15 (lint 0 lỗi, mock Prism chạy); helper kiểm tra sở hữu `common/ownership` (6 test); sơ đồ tuần tự VNPay + IPN | Chờ PR: openapi + tài liệu (`trienw2-openapi-full`), helper sở hữu, husky backend (`trienw2-husky-backend`); Auth + `/me` (trễ từ 14/10) | Schema Prisma `users`, `members` (Hồng Anh) chặn Auth và việc tuần 3; Q16, Q21 (Hồng Anh); Q17, Q20 (Huy Trường) |
| Hồng Anh | Docker Postgres 16 + MailHog; `schema.prisma` đủ 18 bảng + migration `init_18_tables` có ràng buộc SQL (16 phép thử đúng); seed, health kiểm DB (PR #21); mã lỗi Q16, Q21 + chốt Q5 staging Render + Neon (PR #22); 4 endpoint gói + `AuditService` (PR #23); 4 endpoint hội viên UC19, UC20, UC28 (`honganhw3-members`, 45 test e2e) | Đã bắt kịp kế hoạch tới 21/10. Tiếp: check-in (23/10); qrToken trong `/me` + tạo lại QR (chờ Triển, module `me`) | Triển duyệt 4 PR (PR gói có sửa `common/`: guard, audit); Q17(a)(b) check-in trước ngày bắt đầu gói (Huy Trường, chặn check-in 23/10); Q20(b)(g) |
| Sơn | Tuần 2 (nhánh `tsonw2-auth-screens`): đăng ký, khóa tạm khi đăng nhập, hồ sơ, ảnh đại diện, đổi mật khẩu; 3 mã lỗi Q16/Q21. Tuần 3 (`tsonw3-purchase`): `PurchaseFlow`, mua gói, đơn và kết quả thanh toán (chờ VNPay 3 giây/60 giây), biên lai in, lịch sử đơn và giao dịch, Gói của tôi, mã QR + tạo lại; 43 test; bàn giao `handoffs/purchase-flow-tson-to-tbang.md` | Chờ push và PR 2 nhánh; tuần 4: lịch PT hội viên | API thật: Auth + `/me` (Triển, trễ từ 14/10), Đơn, Thanh toán (Triển); danh mục gói `/packages` và component dùng chung (Bằng, chưa có commit) |
| Bằng | | Figma màn demo, token, component | |
| Huy Trường | | Tài liệu 2 v3, tiêu chí chấp nhận, bảng công việc | |
