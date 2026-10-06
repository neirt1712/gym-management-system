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
