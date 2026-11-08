# Trạng thái hiện tại

- **Ai cập nhật:** mỗi người tự sửa dòng của mình khi xong task (`/team-finish`) và trước buổi họp Thứ Hai.
- **Ai đọc:** cả nhóm và Claude, ở đầu mỗi phiên (`/team-start`).
- Giữ ngắn: tối đa 3 gạch đầu dòng mỗi cột. Lịch sử xem git log, không chép vào đây.

Cập nhật lần cuối: 08/11/2026 · Tuần 5 (dòng Hồng Anh; Triển 18/10; các dòng khác từ 09/10)

| Người | Đã xong (tuần này) | Đang làm | Đang vướng / chờ ai |
| --- | --- | --- | --- |
| Triển | openapi 0.2.0 đủ 74 API + 2 endpoint Q6/Q15 (lint 0 lỗi, mock Prism chạy); helper kiểm tra sở hữu `common/ownership` (6 test); sơ đồ tuần tự VNPay + IPN | Chờ PR: openapi + tài liệu (`trienw2-openapi-full`), helper sở hữu, husky backend (`trienw2-husky-backend`); Auth + `/me` (trễ từ 14/10) | Schema Prisma `users`, `members` (Hồng Anh) chặn Auth và việc tuần 3; Q16, Q21 (Hồng Anh); Q17, Q20 (Huy Trường) |
| Hồng Anh | GitHub Actions `ci.yml` BE + FE, không deploy (`honganhw5-ci`); tài khoản UC31–UC35 có audit (`honganhw5-users`, 24 e2e); thông báo UC42 (`honganhw5-notifications`, 7 e2e); PT UC21–UC23, UC28, UC33 (`honganhw5-trainers`, 18 e2e); check-in, check-out, lịch sử UC16–UC18 + job 23:59 (`honganhw5-check-ins`, 15 e2e) | Chờ PR 5 nhánh trên. Tiếp: seed demo; tuần 6: training-notes, training-plans, freeze/unfreeze | Seed demo chờ orders/payments (Sơn, `tsonw4-tich-hop` chưa có trên GitHub), appointments (Triển); check-in làm theo Q17(b) Hồng Anh báo đã chốt, cần ghi vào `OPEN_QUESTIONS.md`; Q24 chờ duyệt |
| Sơn | Khung FE (PR #4); lớp API + mock Prism, đăng nhập chỉ SĐT (PR #14); impeccable (PR #15); thư mục thiết kế `docs/design/ui/` + `/fe-design-lock` (PR #16); bàn giao lớp API cho Bằng (`docs/handoff/handoffs/api-client-tson-to-tbang.md`) | Duyệt Figma khi Bằng gửi; báo cáo tuần 1; tuần 2: màn đăng ký, hồ sơ, đổi mật khẩu | Chờ Figma (Bằng, Q4); endpoint Xác thực chạy thật (Triển, 14/10) |
| Bằng | | Figma màn demo, token, component | |
| Huy Trường | | Tài liệu 2 v3, tiêu chí chấp nhận, bảng công việc | |
