# Trạng thái hiện tại

- **Ai cập nhật:** mỗi người tự sửa dòng của mình khi xong task (`/team-finish`) và trước buổi họp Thứ Hai.
- **Ai đọc:** cả nhóm và Claude, ở đầu mỗi phiên (`/team-start`).
- Giữ ngắn: tối đa 3 gạch đầu dòng mỗi cột. Lịch sử xem git log, không chép vào đây.

Cập nhật lần cuối: 28/11/2026 (mục bên dưới bảng, dòng Triển); 08/11 (dòng Hồng Anh); 25/10 (dòng Sơn)

**Ghi chú 28/11 (Triển, gộp toàn bộ backend còn lại của Triển và Hồng Anh):** backend đủ **76/76 API** trong `openapi.yaml` và 7 job nền. Nhánh máy `trienw8-be-con-lai` (nối tiếp `trienw8-gop-ci-status`, nối tiếp PR #26): Lớp học 7 API, bảo lưu/mở lại, Theo dõi tập 5 API, Báo cáo 4 API + xuất Excel, quên/đặt lại mật khẩu qua email, đặt lại tại quầy (Q15), broadcast, job hết hạn gói, báo sắp hết hạn, nhắc lịch, nhắc PT xác nhận, hết hạn đơn. Kiểm tra 28/11: lint 0, typecheck 0, unit 42/42, **e2e 233/233** (16 bộ), build đạt. Quyết định tự chọn ghi ở OPEN_QUESTIONS Q27a–l. Thứ tự push: `tsonw4-tich-hop` (#26) → `trienw8-gop-ci-status` → `trienw8-be-con-lai`.

| Người | Đã xong (tuần này) | Đang làm | Đang vướng / chờ ai |
| --- | --- | --- | --- |
| Triển | Backend đủ 76/76 API + 7 job nền (28/11): lớp học, bảo lưu, theo dõi tập, báo cáo + Excel, quên mật khẩu (Nodemailer, MailHog), broadcast; e2e 233/233 | Chờ push và merge theo thứ tự #26 → `trienw8-gop-ci-status` → `trienw8-be-con-lai`; sau đó sửa bug khi Sơn nối FE | Review PR (Hồng Anh hoặc Sơn); Q27a–l (Huy Trường duyệt); Hồng Anh thêm biến mail vào `.env.example` (Q27k) |
| Hồng Anh | GitHub Actions `ci.yml` BE + FE, không deploy (`honganhw5-ci`); tài khoản UC31–UC35 có audit (`honganhw5-users`, 24 e2e); thông báo UC42 (`honganhw5-notifications`, 7 e2e); PT UC21–UC23, UC28, UC33 (`honganhw5-trainers`, 18 e2e); check-in, check-out, lịch sử UC16–UC18 + job 23:59 (`honganhw5-check-ins`, 15 e2e) | Chờ PR 5 nhánh trên. Tiếp: seed demo; tuần 6: training-notes, training-plans, freeze/unfreeze | Seed demo chờ orders/payments (Sơn, `tsonw4-tich-hop` chưa có trên GitHub), appointments (Triển); check-in làm theo Q17(b) Hồng Anh báo đã chốt, cần ghi vào `OPEN_QUESTIONS.md`; Q24 chờ duyệt |
| Sơn | Tuần 2 (nhánh `tsonw2-auth-screens`): đăng ký, khóa tạm khi đăng nhập, hồ sơ, ảnh đại diện, đổi mật khẩu; 3 mã lỗi Q16/Q21. Tuần 3 (`tsonw3-purchase`): `PurchaseFlow`, mua gói, đơn và kết quả thanh toán (chờ VNPay 3 giây/60 giây), biên lai in, lịch sử đơn và giao dịch, Gói của tôi, mã QR + tạo lại; 43 test; bàn giao `handoffs/purchase-flow-tson-to-tbang.md` | Chờ push và PR 2 nhánh; tuần 4: lịch PT hội viên | API thật: Auth + `/me` (Triển, trễ từ 14/10), Đơn, Thanh toán (Triển); danh mục gói `/packages` và component dùng chung (Bằng, chưa có commit) |
| Bằng | | Figma màn demo, token, component | |
| Huy Trường | | Tài liệu 2 v3, tiêu chí chấp nhận, bảng công việc | |
