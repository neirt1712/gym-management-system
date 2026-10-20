# Trạng thái hiện tại

- **Ai cập nhật:** mỗi người tự sửa dòng của mình khi xong task (`/team-finish`) và trước buổi họp Thứ Hai.
- **Ai đọc:** cả nhóm và Claude, ở đầu mỗi phiên (`/team-start`).
- Giữ ngắn: tối đa 3 gạch đầu dòng mỗi cột. Lịch sử xem git log, không chép vào đây.

Cập nhật lần cuối: 18/10/2026 · Tuần 2 (dòng Triển, Hồng Anh; các dòng khác từ 09/10)

| Người | Đã xong (tuần này) | Đang làm | Đang vướng / chờ ai |
| --- | --- | --- | --- |
| Triển | openapi 0.2.0 đủ 74 API + 2 endpoint Q6/Q15 (lint 0 lỗi, mock Prism chạy); helper kiểm tra sở hữu `common/ownership` (6 test); sơ đồ tuần tự VNPay + IPN | Chờ PR: openapi + tài liệu (`trienw2-openapi-full`), helper sở hữu, husky backend (`trienw2-husky-backend`); Auth + `/me` (trễ từ 14/10) | Schema Prisma `users`, `members` (Hồng Anh) chặn Auth và việc tuần 3; Q16, Q21 (Hồng Anh); Q17, Q20 (Huy Trường) |
| Hồng Anh | Docker Postgres 16 + MailHog; `schema.prisma` đủ 18 bảng + migration `init_18_tables` có ràng buộc SQL (16 phép thử đúng); seed, health kiểm DB (PR #21); mã lỗi Q16, Q21 + chốt Q5 staging Render + Neon (PR #22); 4 endpoint gói + `AuditService` (PR #23); 4 endpoint hội viên UC19, UC20, UC28 (`honganhw3-members`, 45 test e2e) | Đã bắt kịp kế hoạch tới 21/10. Tiếp: check-in (23/10); qrToken trong `/me` + tạo lại QR (chờ Triển, module `me`) | Triển duyệt 4 PR (PR gói có sửa `common/`: guard, audit); Q17(a)(b) check-in trước ngày bắt đầu gói (Huy Trường, chặn check-in 23/10); Q20(b)(g) |
| Sơn | Khung FE (PR #4); lớp API + mock Prism, đăng nhập chỉ SĐT (PR #14); impeccable (PR #15); thư mục thiết kế `docs/design/ui/` + `/fe-design-lock` (PR #16); bàn giao lớp API cho Bằng (`docs/handoff/handoffs/api-client-tson-to-tbang.md`) | Duyệt Figma khi Bằng gửi; báo cáo tuần 1; tuần 2: màn đăng ký, hồ sơ, đổi mật khẩu | Chờ Figma (Bằng, Q4); endpoint Xác thực chạy thật (Triển, 14/10) |
| Bằng | | Figma màn demo, token, component | |
| Huy Trường | | Tài liệu 2 v3, tiêu chí chấp nhận, bảng công việc | |
