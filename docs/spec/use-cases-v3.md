# Use case v3 (đã chốt 05/10/2026) — 44 use case

Nguồn sự thật cho phạm vi chức năng. HV = hội viên. Cột "Story gốc" để truy vết về Tài liệu 2 (bản cũ ghi "cũ").
Ngoài phạm vi: nâng cấp gói (M17 cũ), mã giảm giá, điểm thưởng, hoàn tiền, SMS, hóa đơn điện tử, đánh giá PT.

| Mã | Use case | Actor | Story gốc | API | Bảng |
| --- | --- | --- | --- | --- | --- |
| UC01 | Đăng ký tài khoản | Khách | M01 | POST /auth/register | users, members |
| UC02 | Đăng nhập, giữ phiên | Tất cả | M02, T01 | POST /auth/login, /auth/refresh | users |
| UC03 | Đăng xuất | Tất cả | M03 | POST /auth/logout | users |
| UC04 | Quên mật khẩu; kích hoạt tài khoản tạo tại quầy | Khách, HV | M04 | POST /auth/forgot-password, /auth/reset-password | password_reset_tokens, users |
| UC05 | Xem, sửa hồ sơ cá nhân | Tất cả | M05, M06 | GET /me, PATCH /me, POST /uploads/avatar | users, members, trainers |
| UC06 | Đổi mật khẩu | Tất cả | M07 | POST /auth/change-password | users |
| UC07 | Xem, tìm, lọc, so sánh gói | Khách, HV | M08–M11 | GET /packages, /packages/{id} | packages |
| UC08 | Quản lý gói: thêm, sửa giá/thời hạn/số buổi/quyền lợi, ngừng bán | Admin | A06–A10 | POST /packages, PATCH /packages/{id} | packages, audit_logs |
| UC09 | Mua gói hoặc gia hạn (tự mua hoặc Staff mua hộ) | Khách, HV, Staff | M12, M16 cũ, S06 | POST /orders/quote, /orders, /orders/{id}/cancel | orders |
| UC10 | Xem gói của tôi: hạn, số buổi tổng/đã tập/còn lại, phân bổ theo tháng, lịch sử gói | HV, Staff | M14–M18, M30, M38, S05 | GET /subscriptions, /subscriptions/{id} | subscriptions, appointments |
| UC11 | Bảo lưu và mở lại gói | Staff, Admin | Bổ sung | POST /subscriptions/{id}/freeze, /unfreeze | subscriptions, audit_logs |
| UC12 | Thanh toán online VNPay, nhận xác nhận | HV, VNPay | M13, M19, M20 | POST /orders/{id}/payments, GET /payments/vnpay/ipn | payments, orders, subscriptions |
| UC13 | Thanh toán tiền mặt, xác nhận tại quầy | Staff, Admin | M19, A24 | POST /orders/{id}/payments, /payments/{id}/confirm-cash | payments, orders, audit_logs |
| UC14 | Xem lịch sử đơn, giao dịch, biên lai nội bộ | HV, Staff, Admin | M21, M22, A22, A23 | GET /orders, /orders/{id}, /payments, /payments/{id} | orders, payments |
| UC15 | Hiện mã QR cá nhân | HV | M24 | GET /me | members |
| UC16 | Check-in bằng QR hoặc SĐT, kiểm tra gói, cảnh báo sắp/đã hết hạn | Staff | M24, M27, S07, S08 | POST /check-ins | check_ins, subscriptions |
| UC17 | Check-out (tự, Staff làm hộ, tự đóng cuối ngày) | HV, Staff, Hệ thống | M25 | POST /check-ins/{id}/checkout | check_ins |
| UC18 | Xem lịch sử ra vào, người đang tập | HV, Staff | M26, S09 | GET /check-ins | check_ins |
| UC19 | Xem, tìm hội viên theo tên/SĐT/mã | Staff, Admin | S01, S02 | GET /members, /members/{id} | members, users, subscriptions |
| UC20 | Thêm, sửa hội viên tại quầy | Staff | S03, S04 | POST /members, PATCH /members/{id} | users, members |
| UC21 | Xem danh sách và hồ sơ PT | Khách, HV | M28, M29 | GET /trainers, /trainers/{id} | trainers, users |
| UC22 | Thiết lập khung giờ nhận lịch, tránh trùng | PT, Admin | T03, A16 | GET, PUT /trainers/{id}/availability | trainer_availabilities |
| UC23 | Đề xuất lịch tập PT | HV (Staff đề xuất hộ) | M31 | POST /appointments | appointments, appointment_proposals |
| UC24 | Phản hồi đề xuất: đồng ý, từ chối, đề xuất giờ khác | HV, PT | M32–M34, T04–T06 | POST /appointments/{id}/proposals, /accept, /reject | appointment_proposals, appointments |
| UC25 | Xin đổi hoặc hủy lịch đã chốt (bên kia phải đồng ý) | HV, PT | M36, T08 | POST /appointments/{id}/proposals (RESCHEDULE, CANCEL), /accept, /reject | appointment_proposals, appointments |
| UC26 | Xem lịch ngày/tuần/tháng, yêu cầu đang chờ, buổi đã tập | HV, PT, Staff | M35, M37, T02, T07 | GET /appointments, /appointments/{id}, GET /classes?trainerId | appointments, appointment_proposals, classes |
| UC27 | Xác nhận buổi hoàn thành hoặc vắng (trừ 1 buổi) | PT, Admin | T09 | POST /appointments/{id}/complete | appointments |
| UC28 | Xem hội viên mình phụ trách và số buổi còn lại | PT | T06–T07 cũ, T10 | GET /trainers/{id}/members, /members/{id} | appointments, subscriptions, members |
| UC29 | Ghi chú tình trạng, cập nhật tiến độ tập | PT (HV xem) | T08, T10 cũ | GET, POST /members/{id}/training-notes | training_notes, training_plans |
| UC30 | Lập và sửa kế hoạch tập | PT (HV xem) | T09 cũ | GET, POST /members/{id}/training-plans, PATCH /training-plans/{id} | training_plans |
| UC31 | Xem danh sách tài khoản | Admin | A01 | GET /users, /users/{id} | users |
| UC32 | Tạo tài khoản Staff, PT | Admin | A02, A11, A14 | POST /users | users, trainers |
| UC33 | Sửa tài khoản, thông tin nhân viên, chuyên môn PT | Admin | A03, A12, A15 | PATCH /users/{id}, PATCH /trainers/{id} | users, trainers |
| UC34 | Khóa/mở khóa, ngừng hoạt động tài khoản | Admin | A04, A13 | PATCH /users/{id}/status | users, audit_logs |
| UC35 | Phân quyền (đổi vai trò) | Admin | A05 | PATCH /users/{id}/role | users, trainers, audit_logs |
| UC36 | Quản lý lớp: tạo, sửa, hủy, gán PT, sức chứa | Admin | A17–A21 | POST /classes, PATCH /classes/{id} | classes |
| UC37 | Xem lớp, đăng ký, hủy đăng ký | HV | Sơ đồ Member | GET /classes, /classes/{id}, POST /classes/{id}/enrollments, DELETE /classes/{id}/enrollments/me | classes, class_enrollments |
| UC38 | Xem danh sách đăng ký của lớp | Admin, Staff, PT | A21 | GET /classes/{id}/enrollments | class_enrollments |
| UC39 | Báo cáo doanh thu theo ngày/tháng/năm và theo gói | Admin | A25, A26 | GET /reports/revenue | payments, orders |
| UC40 | Thống kê: tổng hội viên, hội viên mới, sắp hết hạn, lượt check-in, gói phổ biến | Admin | A28–A32 | GET /reports/overview, /reports/expiring-subscriptions | members, subscriptions, check_ins, orders |
| UC41 | Xuất báo cáo Excel | Admin | A27 | GET /reports/export | (như UC39–UC40) |
| UC42 | Nhận, xem, đánh dấu đã đọc thông báo | Tất cả | N01, N03–N05, M20, M23 | GET /notifications, PATCH /notifications/{id}/read | notifications |
| UC43 | Gửi thông báo chủ động | Admin | N06 | POST /notifications/broadcast | notifications |
| UC44 | Thông báo tự động: gói sắp hết hạn, nhắc lịch, nhắc PT xác nhận | Hệ thống (job) | N02, M35 cũ | (job nền) | notifications |
