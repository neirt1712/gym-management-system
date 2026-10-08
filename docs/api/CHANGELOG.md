# Lịch sử thay đổi hợp đồng API (`openapi.yaml`)

- **Ai sửa:** Triển. Mỗi lần đổi `openapi.yaml` thêm một mục ở đầu file và báo Sơn.
- **Ai đọc:** Sơn, Bằng (FE), Hồng Anh (BE), Huy Trường (test).
- Ký hiệu: **Thêm** · **Đổi** (có thể làm hỏng code đang dùng) · **Bỏ**.

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
