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
| Q12 | 07/10 | Claude (Sơn) | Đăng nhập (`POST /auth/login`) nhận số điện thoại **hoặc** email, hay chỉ một loại? Spec chưa nói; FE đang làm ô "Số điện thoại hoặc email" | Triển | 08/10 (openapi v0.1) | UC02, api-v3 Xác thực, `frontend/src/pages/public/LoginPage.tsx` |
| Q13 | 07/10 | Claude (Sơn) | Khi Staff tạo hội viên tại quầy (UC20), email có bắt buộc không? ERD ghi `users.email UK` không ghi được trống (khác `password_hash` có ghi "null nếu chưa kích hoạt"), và kích hoạt tài khoản cần link gửi qua email (quyết định 1, sơ đồ kích hoạt). (a) Bắt buộc — khớp ERD và luồng kích hoạt, khách không có email thì không tạo được hồ sơ (Sơn khuyên); (b) Không bắt buộc — khách vẫn tập bằng SĐT/QR nhưng không tự kích hoạt được, phải sửa ERD. FE đang để email có thể trống (`string` hoặc `null`) | Triển, Hồng Anh | 08/10 (openapi v0.1) | UC20, UC04, erd-v3 users, `frontend/src/features/auth/types.ts`, form thêm hội viên của Bằng |
| Q14 | 07/10 | Claude (Sơn) | Bản đồ route chưa có chỗ cho vài actor mà use case có nêu: Staff đề xuất lịch PT hộ (UC23), Staff/PT xem đăng ký lớp (UC38), Admin bảo lưu gói (UC11) và xem hội viên (UC19). Thêm vào route nào, ai làm? | Huy Trường, Bằng | 25/10 (Figma đủ màn) | `docs/design/fe-architecture.md`, use-cases-v3 |

## Đã trả lời

| # | Câu hỏi | Trả lời | Đã cập nhật ở |
| --- | --- | --- | --- |
| Q1 | Stack BE TypeScript hay Java? | TypeScript (NestJS) cho cả BE và FE, chốt 06/10 | ADR 0001, CLAUDE.md |
| Q8 | Đăng nhập theo vai trò trên mock (Prism không phân biệt tài khoản) | (a), Sơn chốt 06/10: cờ `VITE_AUTH_MODE=fake\|http`. Chế độ `fake`: xác thực qua `fakeAuthApi`, API khác qua Prism. Nhờ Triển thêm 4 example có tên (mỗi vai trò một) cho `POST /auth/login` khi viết openapi v0.1; việc này không chặn FE | OPEN_QUESTIONS; sẽ ghi vào `docs/design/fe-architecture.md` trong PR khung route |
| Q10 | Quy ước tên nhánh | Sơn chốt 07/10: `<ten>w<tuan>-<mo-ta-ngan>` (ví dụ `tsonw1-fe-scaffold`); task gắn UC mở đầu mô tả bằng mã UC, sửa bug bằng `fix-`. Nhánh `tsonw1` giữ tên cũ | `CONTRIBUTING.md`, `CLAUDE.md`, `.claude/skills/team-start/SKILL.md` |
| Q7 | Bổ sung thư viện vào Stack của `frontend/CLAUDE.md` | Sơn duyệt 06–07/10: runtime `openapi-fetch`, `@ant-design/icons`; dev `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-config-prettier`, `prettier`, `husky`, `lint-staged`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `openapi-typescript`, `@stoplight/prism-cli`, `concurrently`. Font Be Vietnam Pro qua Google Fonts `<link>`. Không alias `@/`. 07/10 duyệt thêm gói nền có trong khung FE: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@eslint/js`, `globals`, `@testing-library/dom`. `openapi-fetch`, `openapi-typescript`, husky, lint-staged cài ngay ở PR khung FE (theo zip); chỉ `prism-cli`, `concurrently` để PR lớp API (08/10) | `frontend/CLAUDE.md` mục Stack, cập nhật trong PR khung FE |
| Q9 | date-fns (ADR 0001, quyết định 12) hay dayjs (FE)? | Sơn chốt 07/10 thay Triển: BE là nơi duy nhất tính ngày nghiệp vụ (date-fns-tz) và trả sẵn kết quả trong API (ngày kết thúc trong quote/subscription, hạn thanh toán của order…; tên field do Triển đặt trong openapi). FE giữ dayjs (Ant Design 5 yêu cầu), chỉ hiển thị và nhập liệu, không tự cộng trừ ngày. Ngày thuần `YYYY-MM-DD`, thời điểm ISO 8601 `+07:00` | ADR 0001 (dòng Thời gian, tiền), `frontend/CLAUDE.md` (Cách viết code) |
| Q6 | Quyết định 13 cho tạo lại QR nhưng `api-v3.md` chưa có endpoint | Sơn chốt 07/10: **giữ** chức năng tạo lại QR khi lộ (đúng quyết định 13 và be-plan tuần 3). Việc kéo theo: Huy Trường thêm endpoint vào `docs/spec/api-v3.md` (nhóm Hồ sơ), Triển viết trong `openapi.yaml` (tên endpoint, ai được gọi do Triển đặt), Hồng Anh làm BE tuần 3 | OPEN_QUESTIONS; chờ cập nhật `api-v3.md`, `openapi.yaml` |
| Q11 | Hook husky kiểm FE hay cả BE | Sơn chốt 07/10: (a) hook `.husky/pre-commit` chỉ kiểm `frontend/`, commit backend đi qua; khi `backend/` có ESLint + Prettier, Triển thêm dòng `cd ../backend && npx lint-staged` | `CONTRIBUTING.md` mục "Trước khi commit" |
