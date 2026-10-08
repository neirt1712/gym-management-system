---
paths:
  - "backend/**/*.ts"
  - "backend/prisma/**"
---

# Vibe code backend chung (Triển và Hồng Anh phải ra cùng một kiểu)

Tinh thần: đơn giản, đọc là hiểu, an toàn dữ liệu trước, tối ưu sau. Mỗi module trông như một bản sao cấu trúc của module bên cạnh.

## Một endpoint chuẩn

1. DTO dùng class-validator, tên `CreateOrderDto`, `ListOrdersQueryDto`. Validate mọi input; số tiền là `@IsInt() @Min(0)`; ngày là `@IsISO8601()`.
2. Controller: decorator `@Roles(...)`, route đúng `docs/spec/api-v3.md`, trả thẳng kết quả service. Không `try/catch` trong controller.
3. Service:
   - Bắt đầu bằng kiểm tra quyền sở hữu (`assertOwnership(user, resource)`), rồi kiểm tra nghiệp vụ, rồi ghi.
   - Ghi nhiều bảng thì gói trong `prisma.$transaction(async (tx) => …)`.
4. Kết quả trả về là object API camelCase, map qua hàm `toXxxResponse(entity)` đặt cạnh service. Không trả thẳng model Prisma.
5. Danh sách luôn có `page`, `pageSize` (mặc định 20, tối đa 100) và trả `{ data, meta: { page, pageSize, total, totalPages } }`.

## Transaction và chống trùng

- Thao tác có cạnh tranh (accept lịch, tạo/sửa lớp, đăng ký lớp): mở transaction, khóa dòng bằng `SELECT … FOR UPDATE` qua `tx.$queryRaw`, kiểm tra lại điều kiện, rồi ghi.
- Chống xử lý lặp dựa vào unique constraint (xem `docs/spec/erd-v3.md`). Bắt `P2002` của Prisma rồi đổi thành mã lỗi nghiệp vụ tương ứng (ví dụ PENDING_ORDER_EXISTS).
- Action lịch PT: so `expectedVersion` với `version` trong DB; khác thì ném `STALE_VERSION` (409); thành công thì `version + 1`.

## Thời gian và tiền

- Lưu `timestamptz` (UTC). Tính ngày nghiệp vụ bằng `date-fns-tz` với `Asia/Ho_Chi_Minh` qua `common/time`.
- Ngày kết thúc gói = `addMonths`/`addDays` từ ngày bắt đầu rồi trừ 1 ngày; `ends_on` tính cả ngày đó.
- Tiền là `Int` VND, không dùng float.

## Lỗi và log

- Mã lỗi lấy từ `common/errors/codes.ts` (khớp `docs/api/error-codes.md`). Mã mới: Hồng Anh thêm vào error-codes.md, Triển cập nhật openapi.yaml.
- `message` tiếng Việt ngắn cho dev đọc; FE không dựa vào `message`.
- Thao tác nhạy cảm (khóa tài khoản, đổi vai trò, sửa giá gói, xác nhận tiền mặt, bảo lưu, hủy đơn hộ): gọi `AuditService.log({ action, targetType, targetId, before, after, reason })` trong cùng transaction.

## Prisma

- Model PascalCase số ít (`Appointment`), `@@map("appointments")`, field camelCase `@map("snake_case")`.
- Enum Prisma trùng giá trị trong ERD (`PENDING`, `CONFIRMED`…).
- Ràng buộc Prisma không biểu diễn được (partial unique, exclusion) viết bằng SQL trong file migration, ghi chú `-- rule: <mô tả>` ngay phía trên.
- Seed phải chạy lại được (idempotent): dùng `upsert` theo khóa tự nhiên.

## Bảo mật

- Mật khẩu: bcrypt cost 10. JWT access 15 phút; refresh token trong cookie HttpOnly, SameSite=Lax, kèm `tokenVersion`.
- IPN VNPay: kiểm chữ ký trước mọi xử lý; đối soát `merchantRef` và số tiền; ghi `gateway_payload`.
- Không bao giờ trả `password_hash`, `token_hash`, `qr_token` của người khác.
