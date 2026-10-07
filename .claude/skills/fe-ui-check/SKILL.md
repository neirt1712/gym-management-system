---
name: fe-ui-check
description: Tự rà các file frontend vừa sửa theo vibe và quy ước chung của nhóm FE (token, trạng thái, chữ tiếng Việt, allowedActions, định dạng). Dùng trước khi mở PR, sau khi dựng xong màn, hoặc khi được hỏi giao diện đã đúng kiểu chung chưa.
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git status *) Bash(npm run lint*) Bash(npm run typecheck*)
---

# Rà vibe và quy ước frontend

Phạm vi: các file trong `frontend/src` đã đổi so với `develop` (`git diff --name-only develop...HEAD -- frontend/src`), hoặc các file được chỉ định trong $ARGUMENTS.

Kiểm từng mục. Mỗi lỗi ghi `file:dòng — vấn đề — cách sửa`:

1. **Màu và số đo:** không có hex, `rgb(`, hay px lẻ (không phải bội số 8) trong `.tsx`; màu Tag lấy từ `theme/status.ts`.
2. **Một nút primary** mỗi màn; `PageHeader` có tiêu đề là danh từ.
3. **Đủ 4 trạng thái:** đang tải (Skeleton), rỗng (EmptyState có nút hành động), lỗi (ErrorState có Thử lại), 403.
4. **Gọi API** chỉ qua hook trong `features/*/api.ts`; không có `fetch(`/`axios` trong component.
5. **Lỗi** hiển thị qua `getErrorMessage`; không so chuỗi `message` của BE.
6. **Quyền:** nút hành động theo `allowedActions` hoặc vai trò route; không tự tính quyền.
7. **Chữ tiếng Việt:**
   - Nút bắt đầu bằng động từ.
   - Không dùng "OK", "Submit", không dấu chấm than.
   - Đúng thuật ngữ cố định trong `.claude/rules/frontend-ui.md`.
   - Hành động không hoàn tác được dùng `ConfirmDialog`.
8. **Định dạng:** tiền, ngày, giờ qua `lib/format.ts`; không có `toLocaleString` hay `new Date().toString` tự chế.
9. **Chống bấm lặp:** nút tạo đơn, thanh toán, check-in, accept, complete có `loading` khi đang gửi.
10. **Truy cập:** input có label; nút chỉ có icon có `aria-label`.

Cuối cùng chạy `npm run lint` và `npm run typecheck`, rồi trả bảng tóm tắt: số lỗi theo mục, mục đã đạt. Không tự sửa trừ khi được bảo.
