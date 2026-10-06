# ADR 0001: Công nghệ và quy ước nền cho hệ thống quản lý phòng gym

- **Trạng thái:** Đã chấp nhận ngày 06/10/2026. Nhóm chốt dùng TypeScript cho cả backend và frontend; các lựa chọn khác trong bảng giữ nguyên.
- **Người viết:** Triển (BE Lead) · **Người duyệt:** Hồng Anh, Trường Sơn, Thanh Bằng, Huy Trường
- **Liên quan:** `docs/spec/erd-v3.md`, `docs/spec/api-v3.md`, `docs/spec/decisions.md`

## Bối cảnh

Nhóm 5 người (2 BE, 2 FE, 1 PM), 10 tuần, demo lần 1 sau 4 tuần. Bản chuẩn v3 có 18 bảng và 74 API.
ERD dùng các tính năng chỉ PostgreSQL có:
- exclusion constraint chống trùng lịch;
- partial unique index;
- `text[]`, `jsonb`;
- `unaccent` + `pg_trgm` để tìm tên không dấu.

Cần một stack mà cả 4 bạn code học nhanh, đọc được code của nhau, và FE không phải chờ BE.

## Quyết định

| Lớp | Chọn | Lý do chính |
| --- | --- | --- |
| Ngôn ngữ | TypeScript cho cả BE và FE | Một ngôn ngữ cho 4 người; FE dùng chung kiểu sinh từ OpenAPI |
| CSDL | PostgreSQL 15+ + btree_gist, unaccent, pg_trgm | Bắt buộc theo ERD v3 |
| Backend | NestJS 10 | Module, guard, DTO validate, Swagger có sẵn; cấu trúc ép hai người viết giống nhau |
| ORM | Prisma 5; ràng buộc đặc biệt viết SQL tay trong migration | Schema dễ đọc, kiểu an toàn, seed bằng script |
| Hợp đồng API | `docs/api/openapi.yaml` là nguồn duy nhất (contract-first); Prism chạy mock; openapi-typescript sinh kiểu cho FE | FE làm song song từ tuần 1 |
| Xác thực | JWT access 15 phút + refresh trong cookie HttpOnly; thu hồi phiên bằng `users.token_version`; bcrypt | Không cần bảng phiên; khóa/đổi mật khẩu là hủy mọi phiên |
| Chống trùng, tương tranh | Unique constraint + `SELECT … FOR UPDATE` trong transaction; `expectedVersion` cho lịch PT | Không cần bảng idempotency; dễ giải thích khi bảo vệ |
| Thời gian, tiền | Lưu `timestamptz`; tính ngày nghiệp vụ theo `Asia/Ho_Chi_Minh` (date-fns-tz); tiền `Int` VND | Tránh lệch ngày, lệch số |
| Đặt tên | Bảng, cột snake_case tiếng Anh; API camelCase; mã lỗi UPPER_SNAKE | Khớp code và API; báo cáo có bảng ánh xạ tiếng Việt |
| Job nền, email | @nestjs/schedule; Nodemailer (MailHog ở dev, Gmail SMTP ở staging) | Chỉ 5 job; không cần hàng đợi |
| Frontend | React 18 + Vite, Ant Design 5, TanStack Query, React Router | Nhiều bảng và form quản trị |
| Đóng gói, CI | Docker Compose (postgres, mailhog, backend, frontend); GitHub Actions (lint, test, build) | Ai cũng chạy cùng môi trường bằng một lệnh |
| Kiểm thử | Jest + Supertest + Testcontainers (BE); Vitest (FE); Postman/Newman (API); Playwright (E2E); k6 (tương tranh) | Có báo cáo HTML đưa vào báo cáo môn học |

## Phương án đã cân nhắc

- **Spring Boot 3 + JPA + Flyway (Java 17):** chắc chắn, nhưng hai ngôn ngữ trong nhóm và nhiều code khuôn mẫu hơn. Không chọn (06/10).
- **Express thuần:** nhẹ, nhưng không ép cấu trúc, nên hai người BE dễ viết hai kiểu.
- **MySQL:** không có exclusion constraint và `text[]`, buộc phải dời các ràng buộc ERD lên tầng code.
- **TypeORM, Drizzle:** dùng được, nhưng Prisma dễ học hơn cho người mới và migration rõ hơn.

## Hệ quả

- **Tốt:**
  - FE code trên mock ngay sau khi có openapi v0.1 (08/10).
  - Một bộ quy ước cho cả repo (CLAUDE.md, `.claude/rules/`).
  - Ràng buộc quan trọng nằm ở DB, test được bằng DB thật.
- **Phải chấp nhận:**
  - Prisma không sinh partial unique và exclusion, phải viết SQL tay và ghi chú.
  - Muốn đổi API phải sửa yaml trước.
  - Refresh token không thu hồi riêng từng thiết bị (đăng xuất chỉ xóa cookie máy đó).
- **Việc kéo theo:**
  - Hồng Anh: docker-compose và migration 10 bảng đầu (09/10).
  - Triển: khung NestJS và openapi v0.1 (08/10).
  - Sơn: khung FE và mock (09/10).
  - Huy Trường: ghi quyết định vào biên bản tuần 1.
