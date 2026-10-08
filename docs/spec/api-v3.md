# API v3 (đã chốt 05/10/2026) — 74 endpoint

Danh mục để tra nhanh. Chi tiết request/response và mã lỗi nằm ở `docs/api/openapi.yaml` (Triển soạn).
Quy ước:
- Base `/api/v1`, JSON camelCase.
- Danh sách trả `{data, meta}`; lỗi trả `{error:{code,message,details,requestId}}`.
- Tiền là số nguyên VND; thời gian ISO 8601 +07:00.
- "Của mình" nghĩa là BE kiểm tra quyền sở hữu trên mọi {id}.

| Nhóm | Endpoint | Quyền | UC |
| --- | --- | --- | --- |
| Xác thực (7) | POST /auth/register · /auth/login · /auth/refresh · /auth/forgot-password · /auth/reset-password | Public | UC01, UC02, UC04 |
| | POST /auth/logout · /auth/change-password | Đã đăng nhập | UC03, UC06 |
| Hồ sơ (3) | GET /me (hồ sơ theo vai trò, qrToken với MEMBER) · PATCH /me · POST /uploads/avatar | Đã đăng nhập | UC05, UC15 |
| Gói (4) | GET /packages (lọc q, type, minPrice, maxPrice, thời hạn) · GET /packages/{id} | Public | UC07 |
| | POST /packages · PATCH /packages/{id} | Admin | UC08 |
| Đơn hàng (5) | POST /orders/quote · POST /orders · GET /orders · GET /orders/{id} (kèm biên lai khi PAID) · POST /orders/{id}/cancel | Member (của mình), Staff, Admin | UC09, UC14 |
| Thanh toán (5) | POST /orders/{id}/payments (VNPAY hoặc CASH) · GET /payments (lọc from, to, method, memberId) · GET /payments/{id} | Member (của mình), Staff, Admin | UC12–UC14 |
| | POST /payments/{id}/confirm-cash | Staff, Admin | UC13 |
| | GET /payments/vnpay/ipn | VNPay (kiểm chữ ký) | UC12 |
| Gói hội viên (4) | GET /subscriptions · GET /subscriptions/{id} (số buổi theo tháng, lịch sử bảo lưu) | Member (của mình), Staff, Admin | UC10 |
| | POST /subscriptions/{id}/freeze · /unfreeze | Staff, Admin | UC11 |
| Check-in (3) | POST /check-ins (QR hoặc SĐT) | Staff, Admin | UC16 |
| | POST /check-ins/{id}/checkout | Member (của mình), Staff, Admin | UC17 |
| | GET /check-ins (lọc memberId, from, to, present=true) | Member (của mình), Staff, Admin | UC18 |
| Hội viên (4) | GET /members · GET /members/{id} · POST /members · PATCH /members/{id} | Staff, Admin; PT xem hội viên mình phụ trách | UC19, UC20, UC28 |
| PT (6) | GET /trainers · GET /trainers/{id} · GET /trainers/{id}/availability | Public | UC21, UC22 |
| | PUT /trainers/{id}/availability | PT (của mình), Admin | UC22 |
| | PATCH /trainers/{id} | Admin | UC33 |
| | GET /trainers/{id}/members | PT (của mình), Admin | UC28 |
| Lịch PT (7) | POST /appointments · GET /appointments (lọc from, to, status, memberId, trainerId) · GET /appointments/{id} (lịch sử đề xuất, allowedActions) | Member, PT, Staff, Admin theo sở hữu | UC23, UC26 |
| | POST /appointments/{id}/proposals (kind COUNTER, RESCHEDULE, CANCEL; expectedVersion) · POST …/accept · POST …/reject | Bên đang được hỏi | UC24, UC25 |
| | POST /appointments/{id}/complete (result COMPLETED hoặc NO_SHOW) | PT phụ trách, Admin | UC27 |
| Theo dõi tập (5) | GET, POST /members/{id}/training-notes · GET, POST /members/{id}/training-plans · PATCH /training-plans/{id} | PT phụ trách ghi; Member xem của mình; Admin | UC29, UC30 |
| Tài khoản (6) | GET /users · GET /users/{id} · POST /users · PATCH /users/{id} · PATCH /users/{id}/status · PATCH /users/{id}/role | Admin | UC31–UC35 |
| Lớp học (7) | GET /classes (lọc trainerId, from, to) · GET /classes/{id} | Public | UC26, UC37 |
| | POST /classes · PATCH /classes/{id} | Admin | UC36 |
| | POST /classes/{id}/enrollments · DELETE /classes/{id}/enrollments/me | Member | UC37 |
| | GET /classes/{id}/enrollments | Admin, Staff, PT của lớp | UC38 |
| Báo cáo (4) | GET /reports/overview · /reports/revenue · /reports/expiring-subscriptions · /reports/export | Admin | UC39–UC41 |
| Thông báo (3) | GET /notifications (meta.unreadCount) · PATCH /notifications/{id}/read | Đã đăng nhập, của mình | UC42 |
| | POST /notifications/broadcast | Admin | UC43 |
| Vận hành (1) | GET /health | Public | — |

## Mã lỗi

Danh mục đầy đủ (code, HTTP, khi nào, thông điệp FE) nằm ở `docs/api/error-codes.md`. Không liệt kê lại ở đây.
