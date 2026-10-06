# 19 quyết định đã chốt (05/10/2026)

Muốn đổi quyết định nào: nêu trong họp Thứ Hai, Huy Trường ghi biên bản, rồi mới sửa file này.

| # | Câu hỏi | Quyết định |
| --- | --- | --- |
| 1 | Gửi mã đặt lại mật khẩu qua đâu | Email chứa link, hạn 30 phút. Dev dùng MailHog/Mailtrap, staging dùng Gmail SMTP (App Password) |
| 2 | Kênh thông báo | Chỉ trong ứng dụng (chuông). Email chỉ dùng cho đặt lại mật khẩu |
| 3 | Buổi vắng (NO_SHOW) | Có trạng thái NO_SHOW, vẫn trừ 1 buổi; PT đánh dấu sau giờ tập |
| 4 | Hủy lịch đã xác nhận | Đề xuất CANCEL, bên kia phải đồng ý; hủy được chấp nhận thì không trừ buổi |
| 5 | Nâng cấp gói | Không làm; mua thêm gói mới |
| 6 | Giảm giá, điểm thưởng, hoàn tiền, đánh giá PT | Không làm |
| 7 | Biên lai hay hóa đơn điện tử | Biên lai nội bộ (`orders.receipt_no`), in bằng trình duyệt |
| 8 | Cổng thanh toán | VNPay sandbox + tiền mặt; MoMo chỉ làm nếu dư thời gian |
| 9 | Hạn thanh toán của đơn | 30 phút với VNPay; hết ngày với tiền mặt |
| 10 | Bảo lưu | Staff/Admin làm trực tiếp; tối đa 1 lần/gói, 30 ngày |
| 11 | Quyền vào lớp | Admin bật `includes_class` trên từng gói; hạn hủy mặc định 120 phút |
| 12 | Cộng tháng vào ngày cuối tháng | Cộng bằng thư viện ngày (date-fns `addMonths`) rồi trừ 1 ngày; 31/01 + 1 tháng → kết thúc 27/02 |
| 13 | QR | Cố định, có chức năng tạo lại khi lộ |
| 14 | Khung giờ rảnh PT | FE nhập mẫu theo thứ, sinh khoảng cho 4 tuần rồi gọi PUT; đổi khung không ảnh hưởng lịch đã xác nhận |
| 15 | Lớp lặp tuần | Không; Admin tạo từng buổi, FE có nút nhân bản sang tuần sau |
| 16 | PT phụ trách hội viên | Suy ra từ lịch (có lịch PENDING/CONFIRMED/COMPLETED với PT đó) |
| 17 | Mốc job nền | Báo gói sắp hết hạn trước 7 ngày (08:00); nhắc lịch PT trước 2 giờ; tự đóng check-in 23:59; nhắc PT xác nhận sau 24 giờ; hết hạn đơn PENDING mỗi 5 phút. Để trong file config |
| 18 | Tên bảng, cột trong code | Tiếng Anh snake_case; báo cáo có bảng ánh xạ sang tên tiếng Việt |
| 19 | Staff xem báo cáo doanh thu | Không; chỉ xem giao dịch trong ngày để đối soát tiền mặt |
