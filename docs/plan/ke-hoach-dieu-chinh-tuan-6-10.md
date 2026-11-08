# Dồn việc còn nợ tuần 1–5 (Sơn chốt 08/11/2026)

**Quyết định của Sơn ngày 08/11:**
- Mọi việc **backend** tuần 1–5 chưa xong (của Triển và Hồng Anh) **dồn hết cho Triển**, làm trong tuần 6. Prompt: `docs/handoff/handoffs/prompt-tuan-6-2026-11-08.md`.
- Mọi việc **frontend** tuần 1–5 chưa xong (của Sơn và Bằng) **Sơn làm hết**, vì Bằng bận.
- Từ tuần 6 trở đi, mỗi người làm việc của tuần đó theo `be-plan.md`, `fe-plan.md` (phần của Bằng do Sơn làm). Chỉ chạy local (Q23): bỏ deploy staging.

## Backend còn nợ tuần 1–5 → Triển

| # | Việc | Tuần gốc, người gốc | Đang chặn |
| --- | --- | --- | --- |
| 1 | Chạy e2e, sửa, merge nhánh `tsonw4-tich-hop` (Auth, `/me`, đơn, thanh toán, gói hội viên) vào `develop` | 2–4, Triển | Mọi việc sau |
| 2 | `users` 6 endpoint | 2, Hồng Anh | FE Admin tài khoản |
| 3 | Lịch PT: tạo, list, detail + `allowedActions`, COUNTER, accept, reject, thông báo | 5, Triển | FE lịch PT |
| 4 | PT: trainers list/detail/PATCH, availability GET/PUT, `GET /trainers/{id}/members` | 5, Hồng Anh | FE đặt lịch, khung giờ rảnh |
| 5 | Check-in 3 endpoint + job 23:59 | 3, Hồng Anh | FE check-in |
| 6 | `GET /notifications` (unreadCount), `PATCH /notifications/{id}/read` | 4, Hồng Anh | FE chuông thông báo |
| 7 | Seed demo một lệnh | 4, Hồng Anh | Demo |
| 8 | `POST /uploads/avatar` (lưu đĩa local) | 2, Triển | FE ảnh đại diện |

Đã xong hoặc không làm nữa: GitHub Actions (đã có), thông báo PAYMENT_SUCCESS/FAILED (đã có), qrToken + tạo lại QR (đã có), deploy staging (bỏ theo Q23).

## Frontend còn nợ tuần 1–5 → Sơn

| # | Việc | Tuần gốc, người gốc |
| --- | --- | --- |
| 1 | Admin quản lý gói (UC08) | 2, Bằng |
| 2 | Bỏ mock, chạy với backend local; toast lỗi theo `error.code`; rà loading, rỗng, lỗi | 4, Sơn |
| 3 | Danh sách + hồ sơ PT (UC21) | 5, Sơn |
| 4 | Đề xuất lịch, chi tiết lịch (dòng thời gian, nút theo `allowedActions`, STALE_VERSION), `AppointmentCard`, `ProposalTimeline` | 5, Sơn |
| 5 | Admin tài khoản (UC31–UC35) | 2, Bằng (chờ backend #2) |
| 6 | Check-in QR và SĐT, đang tập, check-out | 3, Bằng (chờ backend #5) |
| 7 | Chuông + danh sách thông báo | 4, Bằng (chờ backend #6) |
| 8 | PT: khung giờ theo mẫu tuần, hộp yêu cầu chờ phản hồi; Admin quản lý PT | 5, Bằng (chờ backend #3, #4) |
| 9 | Responsive màn quầy (tablet), đồng bộ giao diện các màn demo | 4, Bằng |

Đã xong: component dùng chung bản đầu, danh mục gói, màn quầy (hội viên, mua hộ, thu tiền).

## Rủi ro

- Triển làm 8 việc nợ trong tuần 6 cộng việc tuần 6 của mình: nếu tới Thứ Tư 11/11 chưa xong #1–#3, báo Sơn để chia lại.
- Sơn làm 9 việc nợ FE: #5–#8 phụ thuộc thứ tự Triển xong backend.
