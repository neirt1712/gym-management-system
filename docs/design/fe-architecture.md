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
- `AuthProvider` dùng interface `AuthApi`, có 2 bản: `fakeAuthApi` (tài khoản mẫu, không cần backend) và `httpAuthApi` (POST `/auth/login`, `/auth/refresh`, `/auth/logout` theo openapi v0.1). Đổi bản không đổi component. `AuthProvider` nối token, refresh và báo hết phiên vào `api/client.ts` (`configureApiAuth`).
  - Code: `src/features/auth/` (`authApi.ts` là interface, `fakeAuthApi.ts`, `httpAuthApi.ts`, `AuthProvider.tsx`, `useAuth`). Chọn bản cài đặt ở `features/auth/index.ts` theo `VITE_AUTH_MODE` (`fake` mặc định | `http`).
  - Đăng nhập chỉ bằng số điện thoại (Q12). Tài khoản mẫu khớp ví dụ `POST /auth/login` trong openapi (Q8), mật khẩu chung `matkhau123`: Quản trị `0900000001`, Quầy `0900000002`, PT `0900000003`, Hội viên `0901234567`, bị khóa `0900000009` (thử lỗi `ACCOUNT_LOCKED`). Bản giả dùng cùng id (UUID) với ví dụ openapi. Dữ liệu seed của BE nên dùng cùng bộ SĐT và mật khẩu này.
  - Bản giả nhớ phiên qua `sessionStorage` (chỉ id người dùng, không có token) để mô phỏng refresh cookie; bản thật không dùng storage.

## Chạy với mock và với backend

- FE luôn gọi `/api/v1/...` cùng địa chỉ với trang; Vite proxy chuyển tiếp (`vite.config.ts`), nên không lo CORS và cookie refresh.
- `npm run dev:mock`: chạy Prism (cổng 4010, từ `docs/api/openapi.yaml`) cùng Vite `--mode mock`; proxy bỏ tiền tố `/api/v1` vì mock không có. Chọn ví dụ response bằng header `Prefer: example=<tên>` (ví dụ `admin`, `staff`, `trainer`, `member` cho đăng nhập). Prism không kiểm cookie thật: luồng refresh chỉ kiểm chứng đầy đủ khi có backend.
- `npm run dev`: proxy tới backend theo phần gốc của `VITE_API_URL` (mặc định `http://localhost:3000`).
- `npm run gen:api` sinh lại `src/api/schema.d.ts` mỗi khi `openapi.yaml` đổi (Triển báo qua CHANGELOG; Sơn chạy `/fe-lead-contract`).

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
| `/staff/members`, `/staff/members/:id` | Staff, Admin (Q14) | Tìm, thêm, sửa hội viên, mua hộ, bảo lưu, đặt lịch PT hộ (tuần 5–6) | UC09, UC11, UC19, UC20, UC23 | Bằng |
| `/staff/check-in` | Staff | Quét QR, nhập SĐT, đang tập | UC16–UC18 | Bằng |
| `/staff/payments` | Staff | Xác nhận tiền mặt, giao dịch trong ngày | UC13, UC14 | Bằng |
| `/admin` | Admin | Dashboard | UC39–UC41 | Bằng |
| `/admin/packages`, `/admin/users`, `/admin/trainers`, `/admin/classes`, `/admin/payments`, `/admin/notifications` | Admin | Quản trị | UC08, UC13, UC14, UC22, UC31–UC36, UC38, UC43 | Bằng |
| `/notifications` | Mọi vai trò | Trung tâm thông báo | UC42 | Bằng |

Dùng chung màn giữa các vai trò (Q14, chốt 07/10):
- Admin có mục menu "Hội viên" trỏ tới `/staff/members` (UC19 xem/tìm, UC11 bảo lưu); route này cho phép cả `STAFF` và `ADMIN`.
- Staff đặt lịch PT hộ hội viên bằng nút trong `/staff/members/:id` (UC23).
- Danh sách đăng ký lớp (UC38) nằm trong chi tiết lớp: PT mở từ `/trainer/schedule`; Staff xem trang lớp dùng chung ở chế độ chỉ đọc (route chốt khi Bằng vẽ Figma, tuần 7).

Route guard: chưa đăng nhập thì về `/login?next=…`; sai vai trò thì về trang 403. Quyền chi tiết trên từng hành động theo `allowedActions` do BE trả. `next` chỉ nhận đường dẫn nội bộ (bắt đầu bằng `/`, không phải `//`).

Trong code: route khai báo ở `src/app/router.tsx`; menu theo vai trò ở `src/app/navigation.tsx` (mỗi mục ghi UC và người làm). Route chưa có màn dùng `PlaceholderPage`; người làm màn thay bằng màn thật và thêm route chi tiết `:id`. Trang đầu sau đăng nhập theo vai trò: `ROLE_HOME` trong `src/app/roles.ts`.
