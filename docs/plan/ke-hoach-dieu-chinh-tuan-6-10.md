# Kế hoạch điều chỉnh tuần 6–10 (Sơn chốt 08/11/2026)

File này thay phần tuần 6–10 trong `fe-plan.md` và `be-plan.md` cho tới khi Triển, Sơn sửa hai file đó cho khớp.
Mốc: **đóng chức năng 30/11** · đóng băng bản demo 09/12 · nộp bài 12/12. Hạn mặc định là Thứ Sáu của tuần.

**Quyết định của Sơn ngày 08/11:**
- Bằng bận: **Sơn nhận toàn bộ FE của Bằng.**
- Hồng Anh chưa push từ 18/10: **Triển nhận toàn bộ BE của Hồng Anh** (cả việc còn nợ tuần 2–5 và tuần 6–10). Hồng Anh chuyển sang review PR của Triển, tài liệu cài đặt, video demo.
- Chỉ chạy local (Q23). `backend/CLAUDE.md` mục "Ai sở hữu gì" cần Triển sửa theo quyết định này.

## Trạng thái ngày 08/11

| Mảng | Đã có | Còn nợ tới tuần 5 |
| --- | --- | --- |
| BE (giờ là Triển) | Auth, `/me`, gói, hội viên, đơn, thanh toán (VNPay, tiền mặt, IPN), đọc gói hội viên, openapi 0.2.2, Postman, CI | `users`; check-in + job 23:59; seed demo; `GET /notifications` + đánh dấu đã đọc; lịch PT (đang làm); PT + khung giờ rảnh + hội viên của PT; e2e chưa chạy |
| FE (giờ là Sơn) | Đăng ký, đăng nhập, hồ sơ, mua gói, đơn, kết quả VNPay, gói của tôi, QR, danh mục gói, màn quầy, component dùng chung | Admin, check-in, lịch PT, thông báo, responsive |
| PM Huy Trường | Spec v3 | Spec theo Q4–Q24; test case; biên bản thật |

## Triển: toàn bộ backend

Thứ tự theo việc nào đang chặn FE trước. Mỗi việc một PR; Hồng Anh review trong 24 giờ.

| Tuần | Việc | Hạn |
| --- | --- | --- |
| 6 (09–15/11) | 1. Chạy e2e, sửa, merge nhánh `tsonw4-tich-hop` vào `develop` | **T2 09/11** |
| | 2. `users` 6 endpoint (Admin tài khoản) | T3 10/11 |
| | 3. Lịch PT 7 API (đang làm): tạo, list, detail + `allowedActions`, COUNTER, accept, reject, RESCHEDULE/CANCEL | T4 11/11 |
| | 4. Check-in 3 endpoint + job 23:59 (Q17b) | T6 13/11 |
| 7 (16–22/11) | 5. Xác nhận buổi tập COMPLETED/NO_SHOW + thông báo đổi/hủy | T3 17/11 |
| | 6. PT: trainers list/detail/PATCH, availability GET/PUT, `GET /trainers/{id}/members` | T4 18/11 |
| | 7. Thông báo `GET /notifications` (unreadCount), `PATCH read` | T5 19/11 |
| | 8. Seed demo một lệnh; bảo lưu / mở lại gói (Q20b) | T6 20/11 |
| 8 (23–29/11) | 9. Lớp học: classes + enrollments | T3 24/11 |
| | 10. Theo dõi tập: training-notes, training-plans | T4 25/11 |
| | 11. Job: hết hạn gói, nhắc lịch, quá 24 giờ, hết hạn đơn; quên / đặt lại mật khẩu (MailHog); broadcast | T5 26/11 |
| | 12. Báo cáo doanh thu + XLSX; `POST /uploads/avatar` (lưu đĩa local) | T6 27/11 |
| 9 (30/11–06/12) | Sửa bug; rate limit, helmet, CORS; rà kiểm tra sở hữu; README chạy local | 06/12 |
| 10 (07–13/12) | Chương cài đặt BE, slide kiến trúc BE | 11/12 |

## Hồng Anh

| Tuần | Việc |
| --- | --- |
| Ngay hôm nay | Push mọi code đang có trên máy (kể cả làm dở) lên nhánh riêng, báo Triển để Triển dùng lại, không làm trùng |
| 6–9 | Review mọi PR backend của Triển trong 24 giờ (CONTRIBUTING: 1 review); chạy e2e trên máy mình khi review |
| 9 | `INSTALL.md`: cài và chạy local từ đầu (Postgres hoặc Neon, migrate, seed, chạy BE, FE); seed 3 tháng cho báo cáo doanh thu |
| 10 | Đóng băng bản demo 09/12; video demo; chương triển khai (chạy local) |

## Sơn: toàn bộ frontend

| Tuần | Việc |
| --- | --- |
| 6 | Admin quản lý gói (UC08); danh sách + hồ sơ PT (UC21); đặt lịch PT, chi tiết lịch, `AppointmentCard`, `ProposalTimeline` (mock trước, nối API khi Triển xong việc 3) |
| 7 | Admin tài khoản (UC31–UC35); check-in quầy, đang tập, check-out; PT: khung giờ rảnh, hộp yêu cầu, lịch ngày/tuần/tháng; PT xác nhận buổi |
| 8 | Thông báo (chuông, trung tâm, broadcast); bảo lưu; theo dõi tập; lớp học; Dashboard Admin; quên / đặt lại mật khẩu, kích hoạt |
| 9 | Sửa bug; responsive; kiểm tra trình duyệt; 2 kịch bản Playwright luồng hội viên cho Huy Trường |
| 10 | Chương cài đặt FE, slide FE, thao tác demo |

## Huy Trường

| Tuần | Việc |
| --- | --- |
| 6 | Cập nhật `docs/spec/` theo Q4–Q24; duyệt Q24; chạy Postman, mở Issue; test case UC01–UC15; biên bản họp thật 09/11 |
| 7 | Test case + Postman cho lịch PT, check-in, tài khoản; chương Phân tích, Thiết kế |
| 8 | Playwright 2 luồng hội viên + 1 luồng quầy; test hồi quy; chương Cài đặt phần đã có |
| 9 | Test hồi quy, phân loại bug; ảnh màn hình; nháp báo cáo đủ chương **06/12** |
| 10 | Gộp báo cáo **09/12**; slide; kịch bản demo; nộp **12/12** |

## Rủi ro

1. **Triển gánh gần gấp đôi backend** (12 nhóm việc trong 3 tuần). Chậm hơn 2 ngày ở mốc nào thì báo ngay; nhóm họp, Huy Trường chọn bỏ bớt (gợi ý thứ tự bỏ: broadcast, xuất XLSX, avatar, nhắc lịch 2 giờ).
2. **Sơn gánh gấp đôi frontend.** Tương tự; gợi ý bỏ: so sánh gói, biểu đồ số buổi theo tháng.
3. **Từ 21/10 chưa có PR nào vào `develop`.** Merge nhánh tích hợp Thứ Hai 09/11 là việc mở đường cho cả nhóm.
