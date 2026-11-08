# Kế hoạch điều chỉnh tuần 6–10 (Sơn chốt 08/11/2026)

File này thay phần tuần 6–10 trong `fe-plan.md` và `be-plan.md` cho tới khi Triển, Sơn sửa hai file đó cho khớp.
Lý do: nhiều việc tuần 2–5 còn nợ; Bằng bận nên **Sơn nhận toàn bộ phần FE của Bằng**; chỉ chạy local (Q23).
Hạn mặc định là Thứ Sáu của tuần. Mốc: **đóng chức năng 30/11** · đóng băng bản demo 09/12 · nộp bài 12/12.

## Trạng thái ngày 08/11

| Mảng | Đã có (nhánh `tsonw4-tich-hop`, chưa vào `develop`) | Còn nợ từ tuần 2–5 |
| --- | --- | --- |
| BE Triển | Auth, `/me`, đơn, thanh toán (VNPay, tiền mặt, IPN), đọc gói hội viên, openapi 0.2.2, Postman | Lịch PT tuần 5 (đang làm, chưa push); `POST /uploads/avatar` |
| BE Hồng Anh | Gói, hội viên (đã merge) | `users`, check-in + job 23:59, seed demo, PT + khung giờ rảnh (**chưa có commit nào từ 18/10**) |
| FE Sơn + Bằng | Đăng ký, đăng nhập, hồ sơ, mua gói, đơn, kết quả VNPay, gói của tôi, QR, danh mục gói, màn quầy (hội viên, mua hộ, thu tiền), component dùng chung | Lịch PT, check-in, Admin, thông báo, responsive |
| PM Huy Trường | Spec v3, Postman do Triển soạn | Spec chưa cập nhật Q4–Q24; test case; biên bản |

## Phân việc theo tuần

Nguyên tắc: BE xong API trước **thứ Tư** để FE nối trong tuần; FE màn nào chưa có API thì dựng trên mock Prism rồi nối sau. Mỗi người push ít nhất 2 lần một tuần.

### Tuần 6 (09–15/11): trả nợ, gỡ chặn

| Người | Việc | Hạn |
| --- | --- | --- |
| Triển | (1) Chạy e2e, review, merge PR `tsonw4-tich-hop` vào `develop` | **Thứ Hai 09/11** |
| Triển | (2) Lịch PT đủ 7 API: tạo, list, detail + `allowedActions`, COUNTER, accept, reject, RESCHEDULE/CANCEL; mở PR, ghi CHANGELOG | Thứ Tư 11/11 |
| Triển | (3) Xác nhận buổi tập (COMPLETED/NO_SHOW), thông báo đổi/hủy | 13/11 |
| Hồng Anh | (1) `users` 6 endpoint (Admin tài khoản) | **Thứ Ba 10/11** |
| Hồng Anh | (2) Check-in 3 endpoint + job 23:59 tự đóng lượt (Q17b) | Thứ Năm 12/11 |
| Hồng Anh | (3) Seed demo một lệnh (có gói ACTIVE, đơn PAID, vài lịch PT) | 13/11 |
| Sơn | Admin quản lý gói (UC08); danh sách + hồ sơ PT (UC21); màn đặt lịch PT, chi tiết lịch, `AppointmentCard`, `ProposalTimeline` (trên mock, nối API khi Triển xong) | 13/11 |
| Huy Trường | (1) Cập nhật `docs/spec/` theo Q4, Q6, Q15–Q17, Q20, Q22–Q24 (chỉ Huy Trường được sửa); (2) chạy Postman của Triển trên máy, mở Issue cho lỗi; (3) test case `TC-UCxx-nn` cho UC01–UC15; (4) biên bản họp Thứ Hai 09/11 | 13/11 |

### Tuần 7 (16–22/11)

| Người | Việc |
| --- | --- |
| Triển | Lớp học: classes + enrollments (FOR UPDATE, CLASS_FULL, NO_CLASS_BENEFIT, CLASS_NOT_OPEN); **thông báo** `GET /notifications` (unreadCount), `PATCH read`, broadcast (chuyển từ Hồng Anh sang để san tải) |
| Hồng Anh | PT: trainers list/detail/PATCH, availability GET/PUT (không chồng giờ), `GET /trainers/{id}/members`; bảo lưu / mở lại gói (FREEZE_LIMIT_REACHED, cộng ngày theo Q20b) |
| Sơn | Check-in quầy (QR + SĐT), danh sách đang tập, check-out; Admin tài khoản (UC31–UC35); PT: khung giờ rảnh, hộp yêu cầu chờ phản hồi, lịch ngày/tuần/tháng |
| Huy Trường | Test case + Postman cho lịch PT, check-in, tài khoản; viết chương Phân tích, Thiết kế của báo cáo từ `docs/spec`, `docs/design` (không chờ code) |

### Tuần 8 (23–29/11): đóng chức năng 30/11

| Người | Việc |
| --- | --- |
| Triển | Báo cáo: overview, revenue, expiring + xuất XLSX; `POST /uploads/avatar` (lưu file trên đĩa máy local); sửa bug từ Issues |
| Hồng Anh | Theo dõi tập: training-notes, training-plans; job: hết hạn gói 08:00, nhắc lịch 2 giờ, quá 24 giờ, hết hạn đơn 5 phút; quên / đặt lại mật khẩu + gửi mail qua MailHog |
| Sơn | Thông báo (chuông, trung tâm, broadcast); bảo lưu trong chi tiết hội viên; theo dõi tập (PT ghi chú, hội viên xem kế hoạch); lớp học (hội viên + Admin); Dashboard Admin; quên / đặt lại mật khẩu, kích hoạt |
| Huy Trường | Playwright 2 luồng hội viên (Sơn đưa kịch bản) + 1 luồng quầy; test hồi quy toàn bộ API; chương Cài đặt (phần đã có) |

### Tuần 9 (30/11–06/12): sửa lỗi, không thêm chức năng

| Người | Việc |
| --- | --- |
| Triển | Sửa bug; README chạy local; tài liệu API từ Swagger; rà hiệu năng (EXPLAIN, index) cùng Hồng Anh |
| Hồng Anh | Seed 3 tháng cho báo cáo doanh thu; rate limit, helmet, CORS; rà kiểm tra sở hữu mọi `{id}`; log requestId; `INSTALL.md`; bản chạy thử cuối (RC) **03/12** |
| Sơn | Sửa bug FE; responsive điện thoại cổng hội viên, PT; màn quầy trên tablet; kiểm tra Chrome, Edge, Android |
| Huy Trường | Test hồi quy, phân loại bug; ảnh màn hình; bản nháp báo cáo đủ chương **06/12** |

### Tuần 10 (07–13/12): báo cáo và bảo vệ

| Người | Việc |
| --- | --- |
| Triển | Chương cài đặt BE, slide kiến trúc BE |
| Hồng Anh | Đóng băng bản demo **09/12**; video demo; chương triển khai (chạy local) |
| Sơn | Chương cài đặt FE, slide kiến trúc và giao diện FE; thao tác demo |
| Huy Trường | Gộp báo cáo **09/12**; slide tổng; kịch bản demo; nộp bài **12/12** |

## Rủi ro cần cả nhóm biết

1. **Sơn ôm hai phần FE**: khoảng gấp đôi khối lượng gốc. Nếu tới 22/11 chậm hơn 1 tuần, nhóm họp chọn bỏ bớt (gợi ý thứ tự bỏ: so sánh gói, biểu đồ số buổi theo tháng, broadcast, xuất XLSX). Huy Trường quyết phạm vi.
2. **Hồng Anh chưa push từ 18/10**: việc tuần 6 của Hồng Anh chặn check-in và Admin tài khoản của FE. Nếu tới Thứ Tư 11/11 chưa có PR `users`, Triển nhận check-in.
3. **Chưa có PR nào vào `develop` từ 21/10**: Thứ Hai 09/11 phải merge được nhánh tích hợp, sau đó mỗi task một PR như `CONTRIBUTING.md`.
