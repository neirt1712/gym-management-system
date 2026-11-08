# Prompt tuần 6 cho Claude Code (08/11/2026)

Thay cho `prompt-trien-2026-11-07.md` và `prompt-honganh-2026-11-07.md` ở phần thứ tự việc. Mỗi người `git fetch`, dán khối của mình vào Claude Code ở gốc repo.
Kế hoạch đầy đủ: `docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md`.

## Triển

```text
Tôi là Triển (BE Lead). Đọc docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md (Sơn chốt 08/11), rồi chạy /team-start cho từng việc, chờ tôi duyệt kế hoạch.
Việc tuần 6 của tôi, theo thứ tự:
1. Hôm nay 09/11: chạy e2e nhánh tsonw4-tich-hop (Postgres local hoặc Neon, DB tên *_test), sửa tới khi xanh cả test cũ và mới, mở PR vào develop, merge khi CI xanh.
2. Lịch PT đủ 7 API theo openapi (tạo, list, detail kèm allowedActions, COUNTER, accept với FOR UPDATE + expectedVersion, reject, RESCHEDULE/CANCEL). Mở PR trước Thứ Tư 11/11, ghi docs/api/CHANGELOG.md để Sơn nối FE.
3. Xác nhận buổi tập COMPLETED/NO_SHOW (chỉ sau giờ kết thúc, trừ 1 buổi), thông báo đổi/hủy. Hạn 13/11.
Tuần 7 tôi nhận thêm thông báo (GET /notifications, PATCH read, broadcast) từ Hồng Anh.
Không deploy (Q23). Báo kết quả lệnh thật, trả lời tiếng Việt, ngắn.
```

## Hồng Anh

```text
Tôi là Hồng Anh (BE Sub). Đọc docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md (Sơn chốt 08/11), rồi chạy /team-start cho từng việc, chờ tôi duyệt kế hoạch. Mỗi việc một nhánh từ develop (sau khi PR tsonw4-tich-hop merge; nếu chưa merge thì base lên nhánh đó), một PR.
Việc tuần 6 của tôi, theo thứ tự, việc 1 và 2 đang chặn FE:
1. users 6 endpoint (list, detail, POST kèm hồ sơ PT, PATCH, PATCH status tăng token_version, PATCH role chặn MEMBER), có audit. PR trước Thứ Ba 10/11.
2. check-in: POST /check-ins (chọn gói hết hạn sớm nhất; gói chưa tới startsOn trả NO_ACTIVE_SUBSCRIPTION, gói PT ACTIVE vào được theo Q17b; cảnh báo còn ≤ 7 ngày), POST /check-ins/{id}/checkout (SELF/STAFF), GET /check-ins?present=true, job 23:59 tự đóng lượt. PR trước Thứ Năm 12/11.
3. Seed demo một lệnh, chạy lại được: gói ACTIVE, đơn PAID, vài lịch PT. Hạn 13/11.
Thông báo (GET /notifications…) đã chuyển sang Triển ở tuần 7; tôi không làm.
Mỗi endpoint có e2e (1 thành công, 1 sai quyền, mỗi mã lỗi chính 1 ca). Push ít nhất 2 lần một tuần. Không deploy (Q23). Trả lời tiếng Việt, ngắn, báo kết quả lệnh thật.
```

## Huy Trường

```text
Tôi là Huy Trường (PM). Đọc docs/plan/ke-hoach-dieu-chinh-tuan-6-10.md (Sơn chốt 08/11) và docs/handoff/OPEN_QUESTIONS.md, rồi chạy /team-start, chờ tôi duyệt kế hoạch.
Việc tuần 6 của tôi:
1. Cập nhật docs/spec/ (chỉ tôi được sửa) theo các câu đã chốt Q4, Q6, Q15, Q16, Q17, Q20, Q22, Q23, Q24: decisions.md, use-cases-v3.md, api-v3.md, erd-v3.md (2 cột created_at). Duyệt lại Q24a–Q24i của Triển: đồng ý thì ghi "Huy Trường duyệt", không thì mở câu hỏi mới.
2. Chạy request Postman trong tests/api/ (Triển soạn) trên máy local, mở GitHub Issue cho mỗi lỗi theo mẫu.
3. Viết test case TC-UCxx-nn cho UC01–UC15 trong tests/TEST_PLAN.md.
4. Ghi biên bản thật buổi họp Thứ Hai 09/11 (ai dự, đã thống nhất gì) vào docs/reports.
5. Bắt đầu báo cáo theo chương, không chờ code xong: chương Phân tích, Thiết kế viết từ docs/spec và docs/design ngay tuần này.
Không sửa code ứng dụng, không sửa openapi.yaml. Trả lời tiếng Việt, ngắn.
```
