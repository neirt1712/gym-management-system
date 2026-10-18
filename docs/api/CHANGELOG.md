# Lịch sử thay đổi hợp đồng API (`openapi.yaml`)

- **Ai sửa:** Triển. Mỗi lần đổi `openapi.yaml` thêm một mục ở đầu file và báo Sơn.
- **Ai đọc:** Sơn, Bằng (FE), Hồng Anh (BE), Huy Trường (test).
- Ký hiệu: **Thêm** · **Đổi** (có thể làm hỏng code đang dùng) · **Bỏ**.

## 0.2.0 — 18/10/2026

Đủ 74 API theo `docs/spec/api-v3.md` (thêm 7 nhóm, 36 API). Không đổi gì của bản 0.1, chỉ thêm.

**Thêm**
- Gói hội viên (4): `GET /subscriptions`, `GET /subscriptions/{id}`, `POST /subscriptions/{id}/freeze`, `/unfreeze`.
- PT (6): `GET /trainers`, `GET`/`PATCH /trainers/{id}`, `GET`/`PUT /trainers/{id}/availability`, `GET /trainers/{id}/members`.
- Lịch PT (7): `POST`/`GET /appointments`, `GET /appointments/{id}`, `POST /appointments/{id}/proposals`, `/accept`, `/reject`, `/complete`.
- Theo dõi tập (5): `GET`/`POST /members/{id}/training-notes`, `GET`/`POST /members/{id}/training-plans`, `PATCH /training-plans/{id}`.
- Lớp học (7): `GET`/`POST /classes`, `GET`/`PATCH /classes/{id}`, `POST`/`GET /classes/{id}/enrollments`, `DELETE /classes/{id}/enrollments/me`.
- Báo cáo (4): `GET /reports/overview`, `/reports/revenue`, `/reports/expiring-subscriptions`, `/reports/export` (file `.xlsx`).
- Thông báo (3): `GET /notifications`, `PATCH /notifications/{id}/read`, `POST /notifications/broadcast`.
- Ví dụ cho mock Prism ở mọi endpoint mới, và ví dụ cho 11 mã lỗi chưa có ví dụ.

**Điểm FE cần biết**
- Lịch PT: mọi hành động gửi `expectedVersion` (lấy từ `version`). Nút hiện theo `allowedActions`; bảng quy tắc ở `GET /appointments/{id}`.
  `accept`, `reject` áp dụng cho đề xuất đang `OPEN` của lịch, không cần id đề xuất. `reject` bắt buộc `reason`.
- Lỗi lịch PT kiểm theo thứ tự: `409 STALE_VERSION` (tải lại lịch) → `403 FORBIDDEN` → lỗi nghiệp vụ.
- `GET /trainers/{id}/availability` trả `slots` (khung rảnh) và `busy` (giờ đã bận, không kèm tên hội viên). `PUT` thay toàn bộ khung trong `from`..`to`.
- `GET /subscriptions/{id}` có `monthlySessions` (biểu đồ số buổi theo tháng) và `freeze`.
- `GET /classes` có `myEnrollment`, `availableSlots`, `cancelDeadline` (BE tính sẵn). Thêm tham số `mine=true` cho màn "Lớp của tôi"
  (ngoài danh sách lọc của api-v3, chỉ là tham số lọc).
- `GET /notifications` có `meta.unreadCount`.
- Tham số lọc thêm ngoài danh sách của api-v3 (chỉ là bộ lọc, không đổi dữ liệu): `GET /trainers` (`q`, `specialty`, `status`),
  `GET /trainers/{id}/members` (`q`), `GET /subscriptions` (`type`), `GET /classes` (`status`), `GET /classes/{id}/enrollments` (`status`),
  `GET /members/{id}/training-notes` (`planId`), `GET /notifications` (`isRead`).
- PT gọi khung giờ hoặc danh sách hội viên của PT khác nhận `404 NOT_FOUND` (quy ước "của mình").

**Đổi (mô tả, không đổi hợp đồng)**
- `GET /payments/vnpay/ipn`: ghi rõ nhánh thất bại (payment FAILED, đơn vẫn PENDING, thông báo PAYMENT_FAILED, RspCode 00).
- `GET /reports/export` trả file nhị phân: tải bằng `fetch` kèm `Authorization`, không dùng thẻ `<a href>`.
- Một số tham số lọc nhận nhiều giá trị: `status=PENDING&status=CONFIRMED` (`/appointments`, `/subscriptions`).

**Chưa chốt:** Q20 (nghiệp vụ, hỏi Huy Trường), Q21 (mã lỗi, hỏi Hồng Anh); Q16, Q17 vẫn mở. Xem `docs/handoff/OPEN_QUESTIONS.md`.

**Kiểm tra:** `npx @redocly/cli lint docs/api/openapi.yaml`: 0 lỗi, 4 cảnh báo có chủ đích như bản 0.1. Mock Prism trả đúng ví dụ.

## 0.1.0 — 08/10/2026

Bản đầu tiên. Gồm 8 nhóm, 37 API theo `docs/spec/api-v3.md`, cộng `/health` và 2 endpoint mới theo câu hỏi đã chốt.

**Thêm**
- Xác thực (7), Hồ sơ (3), Gói (4), Đơn hàng (5), Thanh toán (5), Check-in (3), Hội viên (4), Tài khoản (6), `GET /health`.
- `POST /me/qr-token/regenerate`: hội viên tạo lại mã QR khi bị lộ (Q6). Chờ Huy Trường thêm vào `api-v3.md`.
- `POST /members/{id}/reset-password`: Staff, Admin đặt lại mật khẩu hoặc kích hoạt tại quầy cho khách không có email; khách tự gõ mật khẩu (Q15). Chờ Huy Trường thêm vào `api-v3.md`.
- Schema dùng chung: `ErrorResponse` (đủ 33 mã lỗi), `PageMeta`, các response lỗi 400/401/403/404/429.
- Ví dụ cho mock Prism. `POST /auth/login` có 4 ví dụ theo vai trò (Q8), chọn bằng header `Prefer: example=staff`.

**Điểm FE cần biết**
- Đăng nhập gửi `{ phone, password }` (Q12), không còn `identifier`. Response `{ accessToken, expiresIn, user }`, cookie `refresh_token`.
- `email` ở mọi nơi có thể là `null` (Q15).
- `POST /auth/change-password` sai mật khẩu hiện tại trả `400 VALIDATION_ERROR` (field `currentPassword`), không trả 401.
- Đăng ký thành công thì đăng nhập luôn (trả phiên như login).
- Báo giá và đơn trả sẵn `endsOn`; FE không tự tính ngày (Q9).
- Tạo payment VNPay trả `checkoutUrl`. Sau khi VNPay trả về, FE đọc `GET /orders/{id}` để biết đã `PAID` chưa.
- Check-in trả `expiringSoon` để hiện cảnh báo gói sắp hết hạn.

**Chưa chốt** (đánh dấu "Chưa chốt" trong yaml): Q16 (mã lỗi và cột còn thiếu, hỏi Hồng Anh), Q17 (nghiệp vụ, hỏi Huy Trường). Xem `docs/handoff/OPEN_QUESTIONS.md`.

**Kiểm tra:** `npx @redocly/cli lint docs/api/openapi.yaml`: 0 lỗi, 4 cảnh báo có chủ đích (thiếu `license`; server `localhost`; IPN và `/health` không có response 4xx).
