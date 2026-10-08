---
name: be-schema-change
description: Đề xuất hoặc thực hiện thay đổi schema Prisma/migration cho hệ thống gym mà vẫn khớp ERD v3 (bảng, cột, index, ràng buộc SQL tay). Dùng khi cần thêm/sửa cột, bảng, index, enum hoặc ràng buộc cơ sở dữ liệu.
argument-hint: "[mô tả thay đổi]"
---

# Thay đổi schema

Đầu vào: $ARGUMENTS.

1. Đối chiếu với `docs/spec/erd-v3.md`.
   - Thay đổi làm ERD khác đi (thêm bảng, đổi quan hệ): dừng lại, viết lý do và hỏi người dùng có muốn đưa ra họp Thứ Hai không. Không tự sửa file spec.
   - Thay đổi chỉ là chi tiết (index, ràng buộc, default) thì làm tiếp.
2. Kiểm tra vai trò trong `CLAUDE.local.md`.
   - **Không phải Hồng Anh:** chỉ viết đề xuất ra `docs/schema-requests/<yyyy-mm-dd>-<ten>.md`, gồm đoạn `schema.prisma` mới, SQL tay nếu có, lý do, UC liên quan, ảnh hưởng tới dữ liệu cũ. Dừng ở đây.
   - **Là Hồng Anh:** làm tiếp các bước dưới.
3. Sửa `prisma/schema.prisma` theo quy ước trong `.claude/rules/backend.md` (`@@map`, `@map`, enum).
4. Tạo migration: `npx prisma migrate dev --create-only --name <ten>`, rồi thêm SQL tay cho partial unique hoặc exclusion vào cuối file, mỗi câu có dòng `-- rule:` phía trên.
5. Chạy `npx prisma migrate dev`; cập nhật `prisma/seed.ts` nếu cần, giữ seed idempotent.
6. Chạy `npm run typecheck && npm run test:e2e` để chắc không vỡ module khác.
7. Báo cáo: migration mới, ràng buộc đã thêm, module bị ảnh hưởng, việc Triển cần cập nhật trong openapi.yaml (nếu field lộ ra API).
