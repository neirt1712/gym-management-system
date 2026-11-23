# Prompt cho Claude Code của Hồng Anh (07/11/2026)

Sơn soạn cùng Claude. Hồng Anh dán nguyên khối dưới vào Claude Code, ở gốc repo, sau khi `git fetch`.

```text
Tôi là Hồng Anh (BE Sub). Đầu tiên chạy /team-start cho từng task bên dưới, lập kế hoạch, chờ tôi duyệt trước khi sửa. Mỗi task một nhánh, một PR vào develop.

Bối cảnh:
- Q23 (OPEN_QUESTIONS): nhóm chỉ chạy test và npm local, KHÔNG deploy staging, production. Bỏ việc deploy Render/Neon của tuần 4.
- GitHub Actions đã có: .github/workflows/ci.yml (lint, typecheck, unit, e2e trên Postgres 16, build cho BE; lint, typecheck, test, build cho FE). Thư mục này thuộc phạm vi của tôi: review file đó trước tiên.
- Nhánh `tsonw4-tich-hop` (Sơn, chưa merge) đã có: Auth, /me + tạo lại QR, đơn hàng, thanh toán, đọc gói hội viên. Thanh toán đã tạo thông báo PAYMENT_SUCCESS và PAYMENT_FAILED. JwtAuthGuard giờ kiểm token_version trong DB, nên e2e phải tạo user thật. Nên tạo nhánh mới từ develop sau khi PR của Sơn merge; nếu cần trước thì base lên `tsonw4-tich-hop`.
- Các câu đã chốt: Q17(b) check-in khi gói chưa tới startsOn trả NO_ACTIVE_SUBSCRIPTION, gói PT ACTIVE được vào phòng tập; Q20(b)(g); Q22.

Việc của tôi, theo thứ tự (hạn gốc đã qua, làm bù):
1. Review .github/workflows/ci.yml, sửa nếu sai (DB test, tên lệnh).
2. users: GET list, GET detail, POST (kèm hồ sơ PT), PATCH, PATCH status (khóa/mở, tăng token_version), PATCH role (chặn MEMBER, ROLE_CHANGE_NOT_ALLOWED), có audit.
3. check-ins: POST /check-ins (chọn gói hết hạn sớm nhất, 5 mã lỗi, cảnh báo còn ≤ 7 ngày), POST /check-ins/{id}/checkout (SELF/STAFF), GET /check-ins (present=true); job 23:59 đóng lượt còn mở. Check-in không trừ buổi PT.
4. notifications: GET /notifications (meta có unreadCount), PATCH /notifications/{id}/read. Broadcast để tuần 7.
5. Seed demo một lệnh, chạy lại được (idempotent): có gói ACTIVE, đơn PAID, vài lịch PT để demo.
6. Việc tuần 5 theo docs/plan/be-plan.md: trainers list/detail/PATCH, availability GET/PUT (không chồng giờ), GET /trainers/{id}/members.

Lưu ý: đúng docs/api/openapi.yaml và docs/api/error-codes.md; mỗi endpoint có e2e (1 thành công, 1 sai quyền, mỗi mã lỗi chính 1 ca). Cập nhật STATUS.md, CONTRACT_STATUS.md khi xong. Trả lời tiếng Việt, ngắn, báo kết quả lệnh thật.
```
