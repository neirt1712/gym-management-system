# Prompt cho Claude Code của Triển (07/11/2026)

Sơn soạn cùng Claude. Triển dán nguyên khối dưới vào Claude Code, ở gốc repo, sau khi `git fetch`.

```text
Tôi là Triển (BE Lead). Đầu tiên chạy /team-start cho task này rồi lập kế hoạch, chờ tôi duyệt trước khi sửa.

Bối cảnh: Sơn đã cùng Claude viết bù phần BE của tôi bị trễ, trên nhánh `tsonw4-tich-hop` (draft PR vào develop):
- Auth: register, login (khóa tạm 15 phút sau 5 lần sai, Q22), refresh (cookie HttpOnly, đổi token mỗi lần), logout, change-password.
- JwtAuthGuard giờ đọc DB để so `token_version` và `status` (thu hồi phiên). Mọi e2e phải tạo user thật trong DB; Sơn đã sửa test/packages.e2e-spec.ts theo hướng đó.
- /me (GET, PATCH), POST /me/qr-token/regenerate.
- Đơn hàng (quote, tạo, list, detail kèm biên lai, cancel), thanh toán (CASH, VNPAY checkoutUrl, confirm-cash, IPN, list, detail), GET /subscriptions và /subscriptions/{id}.
- common/time/vn-date.ts (computeEndsOn theo quyết định 12), modules/payments/vnpay.ts (ký HMAC SHA512), payment-activation.ts (PAID + receipt_no + subscription + thông báo trong một transaction).
- Đã đạt: typecheck, lint, unit test. CHƯA chạy e2e lần nào (máy Sơn không có DB). CI (.github/workflows/ci.yml) chạy e2e trên Postgres 16.

Việc của tôi, theo thứ tự:
1. Checkout `tsonw4-tich-hop`, `docker compose up -d postgres`, tạo DB gym_test, `npx prisma migrate deploy` vào gym_test, chạy `npm run test:e2e` trong backend/. Sửa đến khi xanh cả test cũ (members, packages) và mới (auth, orders-payments). Báo tôi từng lỗi và cách sửa, không tắt test.
2. Review nghiệp vụ so với docs/spec/*, docs/api/openapi.yaml và các câu đã chốt trong docs/handoff/OPEN_QUESTIONS.md (Q16, Q17, Q20, Q22, Q23). Chỗ nào code lệch hợp đồng thì liệt kê, đề xuất sửa code hay sửa yaml.
3. Cập nhật docs/api/openapi.yaml + docs/api/CHANGELOG.md: thêm ORDER_NOT_PENDING (409, details.status), FREEZE_LIMIT_REACHED, CLASS_NOT_OPEN; bỏ các ghi chú "Chưa chốt (Q16/Q17/Q20/Q21)" theo câu trả lời đã chốt; ghi Q17(e) hội viên được chọn CASH khi mua online.
4. Sau khi xanh: /team-finish, cập nhật cột BE trong docs/handoff/CONTRACT_STATUS.md, PR vào develop để Hồng Anh review chéo.
5. Dựng demo VNPay sandbox theo docs/handoff/demo-vnpay-sandbox.md:
   - Tôi tự đăng ký merchant test VNPay sandbox bằng email của tôi; tôi tự điền VNPAY_TMN_CODE, VNPAY_HASH_SECRET vào backend/.env (Claude không đọc, không in giá trị, không commit).
   - Chạy backend + frontend local, mở ngrok (`ngrok http 3000`), khai IPN URL `<ngrok>/api/v1/payments/vnpay/ipn` trên trang quản trị merchant sandbox.
   - Chạy hết kịch bản ở mục 6 của file hướng dẫn: thanh toán thành công (đơn PAID, có biên lai, gói ACTIVE, thông báo), khách hủy trên trang VNPay (đơn vẫn PENDING, trả lại được), VNPay gọi IPN lặp (không tạo gói lần hai). Đối chiếu tham số thật VNPay gửi với vnpay.ts; sai chữ ký hay sai định dạng thì sửa code và thêm unit test.
   - Sửa các chỗ ghi "(kiểm lại)" trong file hướng dẫn bằng thông tin đúng (link sandbox, vị trí cấu hình IPN, thẻ test), không ghi khóa bí mật.
   - Báo Sơn kết quả từng ca, kèm ảnh màn kết quả để dùng khi báo cáo.
6. Rồi làm việc tuần 5 theo docs/plan/be-plan.md: POST /appointments, GET list/detail (allowedActions), proposals COUNTER, accept (FOR UPDATE, expectedVersion), reject. Theo Q20(c) không chặn giờ ngoài khung rảnh ở BE.

Lưu ý:
- Không làm staging, deploy (Q23). VNPay test bằng request tự ký; hướng dẫn demo ở docs/handoff/demo-vnpay-sandbox.md.
- Chưa làm: forgot/reset-password (tuần 7, Hồng Anh), POST /uploads/avatar (chưa chốt nơi lưu file, hỏi Sơn).
- Trả lời tiếng Việt, ngắn. Báo kết quả lệnh thật.
```
