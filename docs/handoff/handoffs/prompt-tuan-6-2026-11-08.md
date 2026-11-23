# Prompt cho Claude Code của Triển: toàn bộ backend còn nợ tuần 1–5 (08/11/2026)

Thay cho `prompt-trien-2026-11-07.md` và `prompt-honganh-2026-11-07.md`. Triển `git fetch`, dán khối dưới vào Claude Code ở gốc repo.
Danh sách nợ: `docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md`.

```text
Tôi là Triển (BE Lead). Sơn chốt 08/11: mọi việc backend tuần 1–5 chưa xong, của tôi và của Hồng Anh, dồn hết cho tôi, làm xong TRONG HÔM NAY 08/11 (ngày cuối tuần 5), theo đúng thứ tự dưới đây.
Đọc docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md, docs/handoff/OPEN_QUESTIONS.md (Q16, Q17, Q20, Q22, Q23, Q24), docs/api/openapi.yaml, docs/api/error-codes.md.
Với TỪNG việc dưới đây: chạy /team-start, lập kế hoạch ngắn, chờ tôi duyệt rồi mới sửa. Mỗi việc một nhánh từ develop (riêng việc 1 làm trên tsonw4-tich-hop), một PR, CI phải xanh.

Làm đúng thứ tự (việc trước chặn việc sau hoặc chặn FE của Sơn):

1. [hôm nay 08/11] Nhánh tsonw4-tich-hop: dựng DB test (Postgres local hoặc Neon, tên DB kết thúc _test), chạy `npm run test:e2e` trong backend/, sửa tới khi xanh cả test cũ (members, packages) và mới (auth, orders-payments). Mở PR vào develop, merge khi CI xanh. Không tắt, không bỏ qua test.

2. [hôm nay 08/11] users 6 endpoint: GET list, GET detail, POST (kèm hồ sơ PT), PATCH, PATCH status (khóa/mở, tăng token_version để thu hồi phiên), PATCH role (chặn MEMBER, ROLE_CHANGE_NOT_ALLOWED). Audit cho khóa/mở và đổi vai trò.

3. [hôm nay 08/11] Lịch PT: POST /appointments (gói PT ACTIVE, trong hạn, còn buổi), GET list/detail (lịch sử đề xuất, allowedActions), proposals COUNTER (version + 1), accept (FOR UPDATE dòng PT, kiểm trùng PT/hội viên/lớp, quota, expectedVersion → STALE_VERSION), reject có lý do, thông báo cho bên kia. Không chặn giờ ngoài khung rảnh (Q20c). Ghi docs/api/CHANGELOG.md để Sơn nối FE.

4. [hôm nay 08/11] PT: GET /trainers, GET/PATCH /trainers/{id} (fullName lưu ở users), GET/PUT availability (không chồng giờ), GET /trainers/{id}/members.

5. [hôm nay 08/11] Check-in: POST /check-ins (chọn gói hết hạn sớm nhất; gói chưa tới startsOn trả NO_ACTIVE_SUBSCRIPTION; gói PT ACTIVE vào được; cảnh báo còn ≤ 7 ngày; ALREADY_CHECKED_IN; INVALID_QR), POST /check-ins/{id}/checkout (SELF/STAFF, gửi lặp trả 200), GET /check-ins?present=true, job 23:59 tự đóng lượt (AUTO). Check-in không trừ buổi PT.

6. [hôm nay 08/11] Thông báo: GET /notifications (phân trang, meta có unreadCount), PATCH /notifications/{id}/read. Chỉ thấy thông báo của mình. Broadcast để tuần 7.

7. [hôm nay 08/11] Seed demo một lệnh, chạy lại được (upsert): gói ACTIVE, đơn PAID, vài lịch PT ở các trạng thái, vài lượt check-in, thông báo.

8. [hôm nay 08/11] POST /uploads/avatar: multipart field `file`, chỉ JPEG/PNG (INVALID_FILE), lưu trên đĩa máy local, trả avatarUrl.

Trước việc 2, 4, 5, 6, 7: hỏi Hồng Anh có code làm dở chưa push không; có thì dùng lại, không làm trùng.
Mỗi endpoint có e2e: 1 thành công, 1 sai quyền (403/404), mỗi mã lỗi chính 1 ca; thao tác cạnh tranh có ca Promise.all chỉ 1 thành công.
Xong mỗi việc: /team-finish, cập nhật docs/handoff/STATUS.md và cột BE trong CONTRACT_STATUS.md, báo Sơn.
Không deploy (Q23). Hết hôm nay việc nào chưa xong thì báo Sơn ngay, ghi rõ việc nào xong, việc nào dở. Trả lời tiếng Việt, ngắn, báo kết quả lệnh thật.
```
