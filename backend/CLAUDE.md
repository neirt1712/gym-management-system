# Backend — quy ước chung của Triển và Hồng Anh

File này giữ cho hai người code ra cùng một kiểu. Quyết định công nghệ: `docs/adr/0001-tech-stack.md`. Chi tiết viết code (pattern, transaction, lỗi) ở `.claude/rules/backend.md`.

## Stack

Node 20 LTS, NestJS 10, TypeScript strict, Prisma 5, PostgreSQL 15+ (btree_gist, unaccent, pg_trgm), class-validator, @nestjs/schedule, @nestjs/throttler, Nodemailer, date-fns + date-fns-tz, exceljs. Test: Jest + Supertest + Testcontainers.
Không thêm thư viện mới khi chưa hỏi BE Lead (Triển).

## Lệnh

- `npm run start:dev` · `npm run lint` · `npm run typecheck`
- `npm run test` (unit) · `npm run test:e2e` (tích hợp, cần Docker)
- `npx prisma migrate dev --name <ten>` · `npm run seed` · `npm run seed:demo`
- `docker compose up -d postgres mailhog` để chạy DB và mail local

## Cấu trúc thư mục

```
src/
  main.ts, app.module.ts, app.setup.ts (cấu hình dùng chung cho main và test e2e)
  common/        auth/ (JwtAuthGuard, RolesGuard, @Public, @Roles, @CurrentUser), filters/ (format lỗi),
                 http/ (requestId, ValidationPipe), errors/ (AppError + mã lỗi);
                 thêm sau: audit/ (AuditService), time/ (giờ VN), ownership
  config/        đọc .env, tham số nghiệp vụ (hạn đơn, mốc job…)
  prisma/        PrismaService
  modules/<domain>/  <domain>.controller.ts, .service.ts, dto/, <domain>.spec.ts
prisma/
  schema.prisma, migrations/, seed.ts, seed-demo.ts
test/            e2e *.e2e-spec.ts
```

Tên module trùng tên nhóm API: auth, me, packages, orders, payments, subscriptions, check-ins, members, trainers, appointments, training, users, classes, reports, notifications, health. Danh sách nạp vào app ở `src/modules/index.ts`.

Mọi endpoint mặc định cần đăng nhập (JwtAuthGuard toàn cục). Endpoint công khai gắn `@Public()`; giới hạn vai trò gắn `@Roles('ADMIN', ...)`.

## Ai sở hữu gì (sửa ngoài phạm vi thì báo người kia trước)

| Triển (BE Lead)                                                                                  | Hồng Anh (BE Sub)                                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `common/` (filters, guards, errors), `docs/api/openapi.yaml`, `docs/adr/`                        | `prisma/` (schema, migration, seed), `docker-compose.yml`, `.github/workflows/`, `config/`                                           |
| modules: auth, me, orders, payments (VNPay), subscriptions (đọc), appointments, classes, reports | modules: packages, users, members, check-ins, trainers (availability), training, subscriptions (freeze), notifications, jobs, health |

Đổi `schema.prisma` luôn qua Hồng Anh: người khác viết đề xuất (đoạn schema + lý do), Hồng Anh tạo migration.

## Nguyên tắc

- Contract-first: endpoint, field, mã lỗi phải có trong `docs/api/openapi.yaml` trước khi code. Muốn đổi thì Triển sửa yaml rồi báo FE (Sơn).
- Controller mỏng: chỉ nhận DTO, gọi service, trả kết quả. Nghiệp vụ, transaction và kiểm quyền sở hữu nằm ở service.
- Mọi lỗi nghiệp vụ ném `new AppError(code, details?)`; HTTP status tự lấy từ `common/errors/codes.ts`. Filter chung chuyển thành `{error:{code,message,details,requestId}}`.
- Tên bảng, cột: snake_case tiếng Anh (`@@map`, `@map`). Field trong code và API: camelCase.
- Không `console.log`; dùng `Logger` của Nest, có requestId.
- Không để secret trong code; mọi khóa VNPay, SMTP, JWT nằm ở `.env`.

## Test

- Unit (Jest): hàm thuần như tính ngày kết thúc, số buổi, chọn gói khi check-in, tính allowedActions.
- Tích hợp (Supertest + Testcontainers Postgres thật): mỗi endpoint có ít nhất 1 ca thành công, 1 ca sai quyền và 1 ca mã lỗi nghiệp vụ chính. Ràng buộc DB và chống trùng phải test bằng DB thật, không mock Prisma.
- Đặt tên test theo UC: `describe('UC24 accept proposal', …)`.
