# Trạng thái hợp đồng API theo nhóm endpoint

- **Ai cập nhật:**
  - Triển: cột "openapi" khi viết xong yaml.
  - BE (người làm): cột "BE" khi endpoint chạy trên staging.
  - Sơn hoặc Bằng: cột "FE" khi chuyển màn sang API thật.
- **Ai đọc:** FE trước khi bắt đầu màn (`/team-start`), Huy Trường trước khi test.

Giá trị:
- **openapi:** Chưa có / v0.1 / Đủ.
- **BE:** Chưa / Đang làm / Real (chạy trên staging) / Changed (vừa đổi, xem CR).
- **FE:** Chưa / Mock / Real.

| Nhóm (theo `docs/spec/api-v3.md`) | Số API | openapi | BE | FE | Hẹn BE xong |
| --- | --- | --- | --- | --- | --- |
| Xác thực | 7 | v0.1 | Chưa | Mock | 14/10 (Triển); quên mật khẩu 20/11 (Hồng Anh) |
| Hồ sơ | 3 | v0.1 | Chưa | Chưa | 14/10 (Triển) |
| Gói | 4 | v0.1 | Chưa | Chưa | 16/10 (Hồng Anh) |
| Đơn hàng | 5 | v0.1 | Chưa | Chưa | 21/10 (Triển) |
| Thanh toán | 5 | v0.1 | Chưa | Chưa | Tiền mặt 23/10; VNPay 28/10 (Triển) |
| Gói hội viên | 4 | Chưa có | Chưa | Chưa | Đọc 23/10 (Triển); bảo lưu 13/11 (Hồng Anh) |
| Check-in | 3 | v0.1 | Chưa | Chưa | 23/10 (Hồng Anh) |
| Hội viên | 4 | v0.1 | Chưa | Chưa | 21/10 (Hồng Anh) |
| PT | 6 | Chưa có | Chưa | Chưa | 04/11 (Hồng Anh) |
| Lịch PT | 7 | Chưa có | Chưa | Chưa | 06/11; complete 12/11 (Triển) |
| Theo dõi tập | 5 | Chưa có | Chưa | Chưa | 13/11 (Hồng Anh) |
| Tài khoản | 6 | v0.1 | Chưa | Chưa | 16/10 (Hồng Anh) |
| Lớp học | 7 | Chưa có | Chưa | Chưa | 20/11 (Triển) |
| Báo cáo | 4 | Chưa có | Chưa | Chưa | 26/11 (Triển) |
| Thông báo | 3 | Chưa có | Chưa | Chưa | 28/10; broadcast 20/11 (Hồng Anh) |
| Vận hành | 1 | v0.1 | Chưa | — | 09/10 (Triển) |
