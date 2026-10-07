# Câu hỏi còn mở

- **Ai thêm:** bất kỳ ai, kể cả Claude, khi gặp mâu thuẫn hoặc thiếu thông tin. Không tự chọn đáp án.
- **Ai đóng:** người được hỏi trả lời; Huy Trường đưa vào họp Thứ Hai nếu cần cả nhóm quyết. Đóng thì chuyển sang mục "Đã trả lời", ghi kết quả và nơi đã cập nhật.

## Đang mở

| # | Ngày | Người hỏi | Câu hỏi | Hỏi ai | Hạn cần trả lời | Liên quan |
| --- | --- | --- | --- | --- | --- | --- |
| Q2 | 06/10 | Sơn | Duyệt ADR 0002: một repo, nguồn tài liệu `docs/spec`, quy trình Claude Code | Cả nhóm | 07/10 (họp) | ADR 0002 |
| Q3 | 06/10 | Sơn | Triển giao phần xác thực của openapi trước (07/10) được không, để FE nối đăng nhập sớm? | Triển | 07/10 | CONTRACT_STATUS |
| Q4 | 06/10 | Sơn | Link Figma của Bằng | Bằng | 08/10 | fe-plan tuần 1 |
| Q5 | 06/10 | Sơn | Hosting staging: Render/Railway hay VPS trường? Có URL công khai cho IPN VNPay | Hồng Anh | 20/10 | be-plan tuần 4 |
| Q6 | 06/10 | Claude (Sơn) | Quyết định 13 nói QR "có chức năng tạo lại khi lộ", nhưng `api-v3.md` không có endpoint tạo lại QR (chỉ `GET /me` trả `qrToken`). Thêm endpoint, hay bỏ chức năng? | Triển, Huy Trường | 16/10 (openapi đủ) | decisions #13, api-v3 Hồ sơ, UC15 |
| Q7 | 06/10 | Claude (Sơn) | Stack trong `frontend/CLAUDE.md` thiếu các thư viện mà `fe-plan.md`, `fe-architecture.md`, ADR 0001, `CONTRIBUTING.md` và `.claude/rules/frontend-ui.md` đã nhắc: ESLint, Prettier, husky, lint-staged, openapi-fetch, openapi-typescript, Prism, `@ant-design/icons`, font Be Vietnam Pro. Có bổ sung vào stack không? | Sơn | 07/10 | frontend/CLAUDE.md, fe-plan tuần 1 |
| Q9 | 06/10 | Claude (Sơn) | ADR 0001 ghi xử lý thời gian bằng date-fns-tz và quyết định 12 ghi date-fns `addMonths`, còn `frontend/CLAUDE.md` và `lib/format.ts` dùng dayjs. FE chỉ hiển thị và để BE tính ngày (quote) có đúng không? | Triển | 14/10 | ADR 0001, decisions #12, lib/format.ts |
| Q10 | 06/10 | Sơn | Quy ước tên nhánh: `CONTRIBUTING.md` (nháp) ghi `feature/UCxx-…`, `chore/…`; nhánh cấu hình đang đặt theo tên + tuần (`tsonw1`, đã push, PR vào `develop`). Chốt một quy ước chung | Sơn, Triển | 07/10 (họp) | CONTRIBUTING.md mục Nhánh |

## Đã trả lời

| # | Câu hỏi | Trả lời | Đã cập nhật ở |
| --- | --- | --- | --- |
| Q1 | Stack BE TypeScript hay Java? | TypeScript (NestJS) cho cả BE và FE, chốt 06/10 | ADR 0001, CLAUDE.md |
| Q8 | Đăng nhập theo vai trò trên mock (Prism không phân biệt tài khoản) | (a), Sơn chốt 06/10: cờ `VITE_AUTH_MODE=fake\|http`. Chế độ `fake`: xác thực qua `fakeAuthApi`, API khác qua Prism. Nhờ Triển thêm 4 example có tên (mỗi vai trò một) cho `POST /auth/login` khi viết openapi v0.1; việc này không chặn FE | OPEN_QUESTIONS; sẽ ghi vào `docs/design/fe-architecture.md` trong PR khung route |
