# Prompt tuần 6 cho Claude Code (08/11/2026, bản gộp BE vào Triển)

Thay cho `prompt-trien-2026-11-07.md` và `prompt-honganh-2026-11-07.md`. Mỗi người `git fetch`, dán khối của mình vào Claude Code ở gốc repo.
Kế hoạch đầy đủ: `docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md`.

## Triển

```text
Tôi là Triển. Từ 08/11 Sơn giao tôi TOÀN BỘ backend, gồm cả phần của Hồng Anh (docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md). Hồng Anh chỉ review PR của tôi.
Đọc file kế hoạch đó, docs/handoff/OPEN_QUESTIONS.md, docs/api/openapi.yaml, rồi chạy /team-start cho TỪNG việc dưới đây, lập kế hoạch ngắn, chờ tôi duyệt rồi mới sửa. Mỗi việc một nhánh từ develop, một PR, CI phải xanh.

Tuần 6, theo đúng thứ tự:
1. [T2 09/11] Nhánh tsonw4-tich-hop: dựng DB test (Postgres local hoặc Neon, tên DB kết thúc _test), chạy `npm run test:e2e` trong backend/, sửa đến khi xanh cả test cũ (members, packages) và mới (auth, orders-payments). Mở PR vào develop, merge khi CI xanh. Không tắt test.
2. [T3 10/11] users 6 endpoint theo openapi: GET list, GET detail, POST (kèm hồ sơ PT), PATCH, PATCH status (khóa/mở, tăng token_version để thu hồi phiên), PATCH role (chặn MEMBER, ROLE_CHANGE_NOT_ALLOWED). Có audit cho khóa/mở, đổi vai trò.
3. [T4 11/11] Lịch PT 7 API (đang làm): tạo, list, detail kèm allowedActions, COUNTER (version + 1), accept (FOR UPDATE dòng PT, kiểm trùng, quota, expectedVersion → STALE_VERSION), reject có lý do, RESCHEDULE/CANCEL. Không chặn giờ ngoài khung rảnh (Q20c). Ghi docs/api/CHANGELOG.md để Sơn nối FE.
4. [T6 13/11] Check-in: POST /check-ins (chọn gói hết hạn sớm nhất; gói chưa tới startsOn trả NO_ACTIVE_SUBSCRIPTION; gói PT ACTIVE vào được; cảnh báo còn ≤ 7 ngày; ALREADY_CHECKED_IN), POST /check-ins/{id}/checkout (SELF/STAFF, gửi lặp trả 200), GET /check-ins?present=true, job 23:59 tự đóng lượt (AUTO). Check-in không trừ buổi PT.

Trước khi làm việc 2 và 4: hỏi Hồng Anh đã có code users, check-in trên máy chưa (Hồng Anh sẽ push nhánh riêng); có thì dùng lại.
Mỗi endpoint có e2e: 1 thành công, 1 sai quyền, mỗi mã lỗi chính 1 ca; thao tác cạnh tranh có ca Promise.all.
Xong mỗi việc: /team-finish, cập nhật docs/handoff/STATUS.md và cột BE trong CONTRACT_STATUS.md, báo Sơn.
Tuần 7–8 làm tiếp theo bảng trong file kế hoạch. Không deploy (Q23). Trả lời tiếng Việt, ngắn, báo kết quả lệnh thật.
```

## Hồng Anh

```text
Tôi là Hồng Anh. Từ 08/11 Sơn chuyển toàn bộ việc backend của tôi sang Triển (docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md). Việc của tôi:
1. Hôm nay: kiểm tra máy tôi còn code nào chưa push (users, check-in, notifications, trainers, seed demo). Có thì commit vào nhánh `honganhw6-ban-giao` (làm dở cũng được, ghi rõ trong commit là làm dở), push, rồi soạn tin báo Triển nhánh đó có gì.
2. Tuần 6–9: review mọi PR backend của Triển trong 24 giờ. Mỗi lần review: checkout nhánh, chạy `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e` trong backend/ (DB tên *_test), đối chiếu openapi.yaml và error-codes.md, ghi nhận xét cụ thể trên PR. Dùng /team-start trước mỗi lần review.
3. Tuần 9: viết INSTALL.md (cài và chạy local từ đầu: Postgres hoặc Neon, migrate, seed, chạy BE và FE); seed 3 tháng dữ liệu cho báo cáo doanh thu (prisma/ là phạm vi của tôi).
4. Tuần 10: đóng băng bản demo 09/12, quay video demo, viết chương triển khai (chạy local).
Không sửa code tính năng backend nữa trừ khi Triển nhờ. Trả lời tiếng Việt, ngắn, báo kết quả lệnh thật.
```
