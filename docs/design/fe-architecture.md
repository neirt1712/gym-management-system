# Kiến trúc frontend và bản đồ route

- **Ai sở hữu:** Sơn (FE Lead). Bằng góp ý; thay đổi lớn ghi ADR.
- **Ai đọc:** Sơn, Bằng, Claude (khi dựng màn).
- **Khi nào cập nhật:** thêm route hay đổi cấu trúc thư mục.
- Stack và cấu trúc thư mục: xem `frontend/CLAUDE.md`. Stack theo ADR 0001 (đã chốt 06/10).

## Lớp truy cập API

```
component ──> hook (features/<domain>/api.ts, TanStack Query)
                 └─> api/client.ts (openapi-fetch, kiểu từ api/schema.d.ts)
                        ├─ gắn Authorization: Bearer <access token trong bộ nhớ>
                        ├─ 401: gọi POST /auth/refresh (cookie HttpOnly) một lần, chạy lại request;
                        │       refresh lỗi thì xóa phiên, về /login
                        └─ lỗi: trả {error:{code,message,details,requestId}} cho hook
```

- Access token chỉ giữ trong bộ nhớ (biến trong `AuthProvider`), không lưu `localStorage`. Tải lại trang thì gọi `/auth/refresh` để lấy token mới.
- Nhiều request cùng gặp 401 thì chỉ gọi refresh 1 lần; các request khác chờ kết quả.
- Mã HTTP: 401 → refresh; 403 → trang hoặc toast "không có quyền"; 409, 422 → thông điệp theo `error.code`; 429 → thông điệp và khóa nút trong `retryAfterSeconds`.
- **Trước 08/10** (chưa có openapi): `AuthProvider` dùng interface `AuthApi` với bản giả `fakeAuthApi` (4 tài khoản mẫu, mỗi vai trò một). Có openapi v0.1 thì thay bằng `httpAuthApi`; không đổi component.
  - Code: `src/features/auth/` (`authApi.ts` là interface, `fakeAuthApi.ts`, `AuthProvider.tsx`, `useAuth`). Chọn bản cài đặt ở `features/auth/index.ts` theo `VITE_AUTH_MODE` (`fake` | `http`).
  - Tài khoản mẫu, mật khẩu chung `Demo@123`: Hội viên `0900000001`, PT `0900000002`, Quầy `0900000003`, Quản trị `0900000004`, tài khoản bị khóa `0900000009` (thử lỗi `ACCOUNT_LOCKED`).
  - Bản giả nhớ phiên qua `sessionStorage` (chỉ id người dùng, không có token) để mô phỏng refresh cookie; bản thật không dùng storage.

## Bản đồ route

| Đường dẫn | Vai trò | Màn | UC | Người làm |
| --- | --- | --- | --- | --- |
| `/` , `/packages`, `/packages/:id` | Công khai | Trang chủ, danh mục gói, chi tiết, so sánh | UC07 | Bằng |
| `/trainers`, `/trainers/:id` | Công khai | Danh sách và hồ sơ PT | UC21 | Sơn |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/activate` | Công khai | Xác thực, kích hoạt | UC01–UC04 | Sơn |
| `/me/profile` | Mọi vai trò | Hồ sơ, đổi mật khẩu | UC05, UC06 | Sơn |
| `/member` | Member | Tổng quan: gói, buổi còn lại, lịch sắp tới, QR | UC10, UC15 | Sơn |
| `/member/purchase/:packageId`, `/member/orders`, `/member/orders/:id` | Member | Mua gói, đơn, kết quả thanh toán, biên lai | UC09, UC12, UC14 | Sơn |
| `/member/appointments`, `/member/appointments/:id` | Member | Lịch PT, chi tiết và thương lượng | UC23–UC26 | Sơn |
| `/member/classes` | Member | Lớp học, lớp của tôi | UC37 | Sơn |
| `/member/training` | Member | Kế hoạch và tiến độ tập | UC29, UC30 | Bằng |
| `/trainer/schedule` | Trainer | Lịch ngày/tuần/tháng, yêu cầu chờ, xác nhận buổi | UC24–UC27 | Sơn |
| `/trainer/availability` | Trainer | Khung giờ theo mẫu tuần | UC22 | Bằng |
| `/trainer/members`, `/trainer/members/:id` | Trainer | Hội viên phụ trách, ghi chú, kế hoạch | UC28–UC30 | Bằng |
| `/staff/members`, `/staff/members/:id` | Staff | Tìm, thêm, sửa hội viên, mua hộ, bảo lưu | UC09, UC11, UC19, UC20 | Bằng |
| `/staff/check-in` | Staff | Quét QR, nhập SĐT, đang tập | UC16–UC18 | Bằng |
| `/staff/payments` | Staff | Xác nhận tiền mặt, giao dịch trong ngày | UC13, UC14 | Bằng |
| `/admin` | Admin | Dashboard | UC39–UC41 | Bằng |
| `/admin/packages`, `/admin/users`, `/admin/trainers`, `/admin/classes`, `/admin/payments`, `/admin/notifications` | Admin | Quản trị | UC08, UC13, UC14, UC22, UC31–UC36, UC38, UC43 | Bằng |
| `/notifications` | Mọi vai trò | Trung tâm thông báo | UC42 | Bằng |

Route guard: chưa đăng nhập thì về `/login?next=…`; sai vai trò thì về trang 403. Quyền chi tiết trên từng hành động theo `allowedActions` do BE trả. `next` chỉ nhận đường dẫn nội bộ (bắt đầu bằng `/`, không phải `//`).

Trong code: route khai báo ở `src/app/router.tsx`; menu theo vai trò ở `src/app/navigation.tsx` (mỗi mục ghi UC và người làm). Route chưa có màn dùng `PlaceholderPage`; người làm màn thay bằng màn thật và thêm route chi tiết `:id`. Trang đầu sau đăng nhập theo vai trò: `ROLE_HOME` trong `src/app/roles.ts`.
