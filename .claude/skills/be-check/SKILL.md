---
name: be-check
description: Tự rà code backend vừa sửa theo quy ước chung của nhóm BE (khớp openapi, kiểm quyền sở hữu, transaction, mã lỗi, audit, test). Dùng trước khi mở PR backend hoặc khi được hỏi code BE đã đúng chuẩn chung chưa.
allowed-tools: Read Grep Glob Bash(git diff *) Bash(git status *) Bash(npm run lint*) Bash(npm run typecheck*)
---

# Rà chuẩn backend

Phạm vi: file trong `backend/` đã đổi so với `develop` (`git diff --name-only develop...HEAD -- backend`), hoặc file chỉ định trong $ARGUMENTS.

Kiểm từng mục. Mỗi lỗi ghi `file:dòng — vấn đề — cách sửa`:

1. **Hợp đồng:** route, field request/response và mã lỗi khớp `docs/api/openapi.yaml`; không trả field ngoài hợp đồng; không trả thẳng model Prisma.
2. **Quyền:** mọi endpoint có `@Roles`; mọi `{id}` có kiểm tra sở hữu trong service; PT chỉ thấy hội viên mình phụ trách.
3. **Transaction:** ghi nhiều bảng nằm trong `$transaction`; thao tác cạnh tranh có `FOR UPDATE`; action lịch PT kiểm `expectedVersion`.
4. **Quy tắc nghiệp vụ:** khớp `.claude/rules/domain.md` (sinh gói khi SUCCESS, số buổi tính ra, NO_SHOW trừ buổi, bảo lưu 1 lần…).
5. **Lỗi:** chỉ `AppError` với mã có trong `codes.ts`; bắt `P2002` đổi thành mã nghiệp vụ; không `try/catch` nuốt lỗi.
6. **Audit:** thao tác nhạy cảm có `AuditService.log` trong cùng transaction.
7. **Dữ liệu:** tiền là `Int`; thời gian qua `common/time`; không hard-code mốc giờ (lấy từ `config/`).
8. **Bảo mật:** không lộ `password_hash`, `token_hash`, `qr_token`; không secret trong code; không `console.log`.
9. **Test:** có ca thành công, sai quyền, mã lỗi chính; endpoint cạnh tranh có ca song song; tên `describe` có mã UC.

Cuối cùng chạy `npm run lint` và `npm run typecheck`, rồi trả bảng tóm tắt theo mục. Không tự sửa trừ khi được bảo.
