---
name: fe-screen
description: Dựng một màn hình frontend của hệ thống gym từ mã use case (UC01–UC44), đúng quy ước và vibe chung của nhóm FE. Dùng khi được yêu cầu làm màn, dựng trang, tạo page hoặc giao diện cho một UC hay tính năng phía frontend.
argument-hint: "[UCxx] [mô tả ngắn]"
---

# Dựng màn hình từ use case

Đầu vào: $ARGUMENTS (ví dụ `UC24 màn phản hồi đề xuất lịch`).

1. **Đọc yêu cầu.** Tìm dòng UC trong `docs/spec/use-cases-v3.md`; ghi lại actor, API, bảng. Đọc quy tắc liên quan trong `.claude/rules/domain.md`. Không thấy UC thì dừng và hỏi.
2. **Đọc hợp đồng.** Tra các endpoint trong `src/api/schema.d.ts` (hoặc `docs/api/openapi.yaml`). Chỉ dùng field có trong đó; thiếu field thì liệt kê ra và hỏi, không bịa.
3. **Kiểm tra phạm vi.** Đối chiếu bảng sở hữu trong `frontend/CLAUDE.md` và vai trò trong `CLAUDE.local.md`. Màn thuộc người kia thì báo trước khi làm.
4. **Tìm mẫu.** Glob `src/pages/**` và `src/features/**` tìm màn tương tự; bắt chước cấu trúc của màn đó thay vì tự nghĩ kiểu mới.
5. **Hook dữ liệu.** Hook còn thiếu thì tạo theo skill `fe-api-hook`.
6. **Dựng trang** theo `.claude/rules/frontend-ui.md`:
   - `PageHeader` có một nút chính.
   - Đủ 4 trạng thái: đang tải, rỗng, lỗi, không có quyền.
   - Nút theo `allowedActions`.
   - Định dạng tiền, ngày qua `lib/format.ts`; trạng thái qua `StatusTag`.
   - Lỗi qua `getErrorMessage`.
   - Chữ trên giao diện bằng tiếng Việt, đúng thuật ngữ cố định.
7. **Gắn route và menu** đúng vai trò trong `src/app/`. Nếu `app/` không thuộc phạm vi người đang dùng thì đưa đoạn code cần thêm để Sơn gắn.
8. **Test.** Viết ít nhất 1 test Vitest cho trạng thái đang tải và lỗi, thêm test cho logic riêng nếu có.
9. **Kiểm tra.** Chạy `npm run lint && npm run typecheck && npm run test -- <file test>` trong `frontend/`.
10. **Báo cáo ngắn:** file đã tạo/sửa, UC đáp ứng, việc còn thiếu (field chờ BE…). Sau đó chạy `fe-ui-check` trên các file vừa làm.
