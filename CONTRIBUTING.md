# Quy ước Git và đóng góp

Bản nháp của Sơn và Triển, chốt trong họp 07/10/2026. Áp dụng cho cả `backend/`, `frontend/`, `docs/`, `tests/`.

## Nhánh

| Nhánh | Dùng cho | Ai merge vào |
| --- | --- | --- |
| `main` | Bản đã demo hoặc nộp. Chỉ merge từ `develop` ở các mốc (demo 30/10, RC 03/12, bản cuối 09/12) | Triển hoặc Sơn |
| `develop` | Nhánh tích hợp; staging deploy từ đây | Qua PR, sau 1 review |
| `<ten>w<tuan>-<mo-ta-ngan>` | Một task (tính năng, sửa bug, cấu hình, tài liệu). Ví dụ `tsonw1-fe-scaffold`, `tsonw3-uc09-purchase-flow` | |

- `<ten>`: tên viết tắt không dấu, mỗi người tự chọn một lần và dùng cố định (ví dụ `tson`). `<tuan>`: số tuần dự án (tuần 1 bắt đầu 05/10/2026). `<mo-ta-ngan>`: vài chữ nói nhánh làm gì; task gắn UC thì mở đầu bằng mã UC (`uc09-…`), sửa bug thì mở đầu bằng `fix-`.
- Loại thay đổi (tính năng, sửa bug, cấu hình) thể hiện ở `type` của commit, không ở tên nhánh.
- Nhánh `tsonw1` (bộ cấu hình, tạo trước khi chốt quy ước) giữ nguyên tên.
- Tên nhánh viết thường, nối bằng gạch ngang, không dấu.
- Không commit thẳng lên `main` hay `develop`. Không `git push --force` lên nhánh chung.
- Nhánh sống tối đa khoảng 3 ngày; lâu hơn thì chia nhỏ task.

## Commit (Conventional Commits)

```
<type>(<phạm vi>): <UCxx> <mô tả ngắn tiếng Việt>
```

- **type:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`.
- **phạm vi:** `fe`, `be`, `db`, `api` (openapi.yaml), `docs`, `ci`, `test`.
- **Ví dụ:**
  - `feat(fe): UC09 luồng mua gói`
  - `fix(be): UC24 kiểm expectedVersion khi accept`
  - `docs(api): UC12 thêm mã lỗi CASH_AMOUNT_MISMATCH`
- Mỗi commit phải build được. Không commit `.env`, khóa, token, file build.

## Pull request

1. Mở PR vào `develop`, điền đúng mẫu `.github/PULL_REQUEST_TEMPLATE.md`.
2. CI phải xanh: lint, typecheck, test, build.
3. **1 review bắt buộc:** Triển và Hồng Anh review chéo cho backend; Sơn và Bằng review chéo cho frontend. PR đụng `docs/api/openapi.yaml` thì Triển duyệt, và Sơn phải biết.
4. Người review trả lời trong 24 giờ (ngày làm việc). Quá hạn thì nhắc trong nhóm chat.
5. Merge kiểu **Squash and merge**, tiêu đề theo quy ước commit. Xóa nhánh sau khi merge.
6. Sau merge: cập nhật `docs/handoff/STATUS.md`, báo Huy Trường test (trong vòng 1 ngày).

## Bảng công việc (GitHub Projects)

- Cột: Backlog → Tuần này → Đang làm → Review → Test → Xong.
- Mỗi thẻ gắn mã UC, người làm, hạn. Mỗi PR liên kết thẻ (`Closes #số`).
- Trễ quá 2 ngày thì báo Huy Trường.

## Trước khi commit (tự động)

husky + lint-staged chạy Prettier và ESLint trên file đã stage. Không dùng `--no-verify` để bỏ qua bước này.

- Hook nằm ở `.husky/pre-commit` (gốc repo), hiện **chỉ kiểm file trong `frontend/`**; commit chỉ có `backend/`, `docs/` vẫn đi qua bình thường (Q11, chốt 07/10).
- Mỗi người chạy `npm install` trong `frontend/` một lần để bật hook trên máy mình.
- Khi `backend/` có ESLint và Prettier, Triển thêm dòng `cd ../backend && npx lint-staged` vào cuối `.husky/pre-commit` (không chạy `husky init` lần nữa).

## Đồng bộ thông tin

### Nguyên tắc

1. **Repo (`develop`) là sự thật duy nhất.** Điều gì chưa vào repo qua PR thì chưa chốt, kể cả đã nói trong chat hay Claude web.
2. **Thông tin chạy một vòng:** repo → `/team-week-close xuat` → Claude web (chỉ đề xuất) → họp Thứ Hai (người quyết) → `/team-week-close nhap` → repo. Gói gửi Claude web luôn xuất mới từ repo, không dán lại câu trả lời cũ.
3. **Cập nhật hằng ngày:** lấy code `develop` mới trước khi làm; `/team-start` tự báo thay đổi liên quan tới mình (bước "Có gì mới"). Ai chốt một câu hỏi thì báo những người ở cột "Ảnh hưởng ai" trong `docs/handoff/OPEN_QUESTIONS.md`.
4. **Người mới:** không cần đọc lịch sử chat. Đọc trạng thái hiện tại: bản chốt tuần mới nhất (`docs/reports/tuan-NN/CHOT-TUAN-NN.md`), `OPEN_QUESTIONS.md`, `STATUS.md`, file vai trò.

### Khi thông tin mâu thuẫn

Thứ tự ưu tiên: spec (`docs/spec/`) → quyết định (`decisions.md`) → kế hoạch (`docs/plan/`) → `openapi.yaml` → code. Claude web và chat chỉ là đề xuất, đứng sau tất cả.

| Loại mâu thuẫn | Ai thắng | Xử lý |
| --- | --- | --- |
| Báo "xong" nhưng repo không có bằng chứng (PR, commit, file) | Repo | Ghi "cần xác nhận", hỏi người đó trong họp |
| Đề xuất đổi một điều đã chốt trong `OPEN_QUESTIONS.md` | Điều đã chốt, cho tới khi họp đổi | Mở lại thành câu hỏi mới, đưa ra họp; không ghi đè lặng lẽ |
| Đề xuất trái spec hoặc ngoài phạm vi | Spec | Bỏ; nếu nhóm muốn đổi thì Huy Trường sửa spec qua PR trước, mọi người làm theo sau |
| Nhắc tới API, field, mã lỗi không có trong tài liệu | Spec, `openapi.yaml` | Bỏ; cần thật thì tạo CR (`/team-api-cr`) gửi Triển |
| Hai người cùng sửa một file (GitHub báo conflict ở PR) | Chủ file | Nhờ Claude giải quyết xung đột, giữ cả hai thay đổi, hỏi chỗ không chắc; chủ file quyết |
| Thông tin cũ (bản chốt hoặc câu trả lời Claude web của tuần trước) | Repo hiện tại | Xuất gói mới rồi hỏi lại |

### Chủ file

Muốn sửa file của người khác: nhờ chủ file, hoặc mở PR và gắn chủ file vào review.

| File | Chủ |
| --- | --- |
| `docs/spec/*` (use case, ERD, API, quyết định) | Huy Trường, sửa sau khi họp đồng ý |
| `docs/api/openapi.yaml`, `docs/plan/be-plan.md` | Triển |
| `docs/api/error-codes.md`, phần CSDL trong ERD | Hồng Anh |
| `docs/plan/fe-plan.md`, `docs/design/fe-*.md`, `docs/reports/` (bản chốt, gói Claude web) | Sơn |
| `docs/handoff/OPEN_QUESTIONS.md` | Ai cũng thêm câu hỏi; người được hỏi trả lời; Huy Trường quản lý và đóng câu (theo `docs/team/roles/pm.md`) |
| `docs/plan/preparation.md`, `docs/process/dor-dod.md`, `tests/` | Huy Trường |
| `frontend/src/theme/`, `frontend/src/components/` | Bằng |
| `docs/handoff/STATUS.md` | Mỗi người sửa dòng của mình |
| `CONTRIBUTING.md`, ADR 0002 | Sơn và Triển |
