---
name: be-endpoint
description: Cài đặt một endpoint backend NestJS của hệ thống gym theo đúng openapi.yaml, ERD v3 và quy ước chung của nhóm BE (DTO, service, transaction, mã lỗi, test). Dùng khi được yêu cầu làm, viết hoặc implement API, endpoint, route cho một UC hay một nhóm API.
argument-hint: "[METHOD /path] hoặc [UCxx]"
---

# Cài đặt endpoint

Đầu vào: $ARGUMENTS (ví dụ `POST /appointments/{id}/accept` hoặc `UC24`).

1. **Đọc yêu cầu.**
   - Tìm UC trong `docs/spec/use-cases-v3.md` và endpoint trong `docs/spec/api-v3.md`.
   - Đọc schema request/response và mã lỗi trong `docs/api/openapi.yaml`. Endpoint chưa có trong yaml thì dừng lại: nếu người dùng là Triển, đề xuất đoạn yaml; nếu không, báo cần Triển bổ sung.
2. **Đọc dữ liệu.** Xem các model liên quan trong `backend/prisma/schema.prisma` và ràng buộc trong `docs/spec/erd-v3.md`. Đọc quy tắc trong `.claude/rules/domain.md`. Thiếu cột hay bảng thì dùng skill `be-schema-change`, không tự sửa schema nếu không phải Hồng Anh.
3. **Kiểm tra phạm vi.** Đối chiếu bảng sở hữu trong `backend/CLAUDE.md` với vai trò trong `CLAUDE.local.md`; module của người kia thì báo trước.
4. **Bắt chước module mẫu.** Mở một module đã có cùng kiểu (danh sách, tạo, action) và theo đúng cấu trúc của nó.
5. **Viết theo thứ tự:**
   1. DTO
   2. service: quyền sở hữu → nghiệp vụ → transaction ghi → audit nếu nhạy cảm → thông báo nếu UC yêu cầu
   3. hàm map response
   4. controller với `@Roles`
   5. đăng ký module
6. **Mã lỗi.** Chỉ dùng mã có trong `common/errors/codes.ts` và openapi.yaml.
7. **Test** `test/<domain>.e2e-spec.ts`: 1 ca thành công, 1 ca sai quyền (403/404), mỗi mã lỗi nghiệp vụ chính 1 ca. Endpoint có cạnh tranh thì thêm ca gửi song song (`Promise.all`) và kiểm tra chỉ 1 ca thành công.
8. **Chạy** `npm run lint && npm run typecheck && npm run test:e2e -- <file>` trong `backend/`.
9. **Báo cáo ngắn:** endpoint và UC đã xong, file đã sửa, test đạt, điều chưa làm, việc FE cần biết (field mới, mã lỗi mới).
