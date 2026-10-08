---
name: fe-lead-review
description: Review một PR hoặc nhánh frontend của dự án gym với tư cách FE Lead (Trường Sơn): kiểm hợp đồng API, phạm vi sở hữu, vibe chung, trạng thái màn hình, test. Chỉ chạy khi Sơn gõ /fe-lead-review.
disable-model-invocation: true
argument-hint: "[số PR hoặc tên nhánh]"
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git log *) Bash(gh pr view *) Bash(gh pr diff *) Bash(npm run lint*) Bash(npm run typecheck*) Bash(npm run test*)
---

# Review PR frontend

Đầu vào: $ARGUMENTS. Là số thì dùng `gh pr diff <số>`; là tên nhánh thì dùng `git diff develop...<nhánh> -- frontend`.

1. **Hiểu PR:** đọc tiêu đề và mô tả; xác định mã UC; mở dòng UC trong `docs/spec/use-cases-v3.md`.
2. **Phạm vi:** file sửa có nằm đúng phần của tác giả theo `frontend/CLAUDE.md` không. Sửa `theme/`, `components/`, `app/`, `api/` thì xem kỹ ảnh hưởng tới màn khác.
3. **Hợp đồng:** field dùng có trong `schema.d.ts`; không tự định nghĩa kiểu API; không sửa tay `schema.d.ts`; query key đúng `api/queryKeys.ts`.
4. **Nghiệp vụ:** khớp `.claude/rules/domain.md`. Ví dụ: không tự đánh dấu đã thanh toán; nút theo `allowedActions`; gửi `expectedVersion`.
5. **Vibe:** chạy theo checklist của skill `fe-ui-check` (token, một nút primary, 4 trạng thái, chữ tiếng Việt, định dạng, `ConfirmDialog`).
6. **Chất lượng:** component dưới khoảng 200 dòng; không `any`, không `console.log`; tên rõ nghĩa; không lặp code đã có trong `components/` hoặc `lib/`.
7. **Test:** có test trạng thái đang tải và lỗi; logic riêng có test. Chạy `npm run lint && npm run typecheck && npm run test`.

Kết quả là nhận xét tiếng Việt, giọng góp ý giữa bạn với bạn, chia 3 mức:
- **Phải sửa trước khi merge:** lỗi sai nghiệp vụ, sai hợp đồng, vỡ test, lệch vibe rõ.
- **Nên sửa:** cấu trúc, tên, lặp code.
- **Gợi ý:** cải thiện nhỏ, có thể để sau.

Mỗi nhận xét ghi `file:dòng` và cách sửa cụ thể. Cuối cùng kết luận một dòng: "Duyệt", "Duyệt sau khi sửa mục Phải sửa" hoặc "Chưa duyệt". Không tự sửa code của tác giả.
