# Báo cáo tuần 3 — Triển (BE Lead)

| Mục | Nội dung |
| --- | --- |
| Tuần | 3 (Thứ Hai 19/10 – Chủ Nhật 25/10/2026) |
| Người báo cáo | Triển · BE Lead · tên file `trien` |
| Ngày viết | 07/11/2026 (nộp trễ 13 ngày) |
| Tự đánh giá | Trễ ít — 5/5 việc kế hoạch tuần 3 xong code (11 endpoint) nhưng chưa mở PR, chưa chạy e2e; việc dồn từ tuần 2 (Auth + `/me`, PR husky, Postman) vẫn chưa xong |

## 1. Việc đã xong so với kế hoạch tuần

Kế hoạch lấy từ dòng tuần 3 trong `docs/plan/be-plan.md`, cộng việc dồn ở mục 8 báo cáo tuần 2.

| # | Việc trong kế hoạch | Hạn | Trạng thái | Bằng chứng (PR, commit, file) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 1 | quote: addMonths − 1 ngày, 5 unit test cuối tháng | 21/10 | Xong (19/10) | Commit `154e0bd`, `backend/src/common/time/ends-on.ts` | 6 unit test: cuối tháng, năm nhuận, cộng nhiều tháng, qua năm, gói theo ngày |
| 2 | orders: tạo (chụp điều khoản, `PENDING_ORDER_EXISTS`, hạn hết ngày), list, detail kèm biên lai, cancel | 21/10 | Xong code (20/10) | Commit `f656568`, nhánh `trienw3-uc09-orders-payments` | Chưa mở PR. Từ 07/11 nhóm dùng bản của Sơn trên `tsonw4-tich-hop` (báo cáo tuần 5) |
| 3 | payments CASH + confirm-cash (audit) | 23/10 | Xong code (20/10) | Commit `f656568` | Bấm xác nhận 2 lần không sinh 2 gói; sai số tiền trả `CASH_AMOUNT_MISMATCH` |
| 4 | Hàm kích hoạt gói trong 1 transaction (PAID + `receipt_no` + subscription + thông báo) | 23/10 | Xong code (20/10) | `backend/src/modules/payments/activate-order.ts` (commit `f656568`) | Biên lai `BL-YYYYMMDD-NNNN` |
| 5 | `GET /subscriptions` (+ số buổi theo tháng), `GET /payments` (lọc from, to, method) | 23/10 | Xong code (20/10) | Commit `f656568` | Số buổi PT tính từ lịch, không lưu cột |
| 6 | Auth + `/me` + guard `token_version` + test Supertest (dồn) | 22/10 | Chưa | — | Ưu tiên đơn hàng vì Sơn cần cho màn mua gói; không kịp làm Auth |
| 7 | PR husky backend (dồn) | 19/10 | Chưa | Nhánh `trienw2-husky-backend` đã push, chưa mở PR | Sơn gộp vào nhánh tích hợp ngày 05/11 |
| 8 | Request mẫu Postman (dồn) | 22/10 | Chưa | — | Phụ thuộc Auth |
| 9 | Cập nhật openapi theo trả lời Q16, Q21 | khi có trả lời | Xong (20/10) | Commit `b236069`, `openapi.yaml` 0.2.1, `CHANGELOG.md` | 3 mã lỗi `ORDER_NOT_PENDING`, `FREEZE_LIMIT_REACHED`, `CLASS_NOT_OPEN` |
| 10 | Ma trận phân quyền cùng Huy Trường (dồn) | 23/10 | Chưa | Chưa có `docs/spec/permissions.md` | Chưa khởi động |

Kiểm tra (20/10, trên máy): lint, typecheck, build đạt; 42 unit test đạt (18 mới). 37 ca e2e trong `backend/test/orders-payments.e2e-spec.ts` đã viết, **chưa chạy** vì máy chưa có Docker/PostgreSQL.

## 2. Việc ngoài kế hoạch đã làm

| # | Việc | Lý do | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Duyệt và gộp 5 PR của Hồng Anh (#21 DB 18 bảng, #22 mã lỗi, #23 gói, #24 hội viên, #25 báo cáo) | Review chéo theo cặp | Merge commit `6408f0a`, `7a3ce11`, `fda6eb7` (20–21/10) |
| 2 | 9 điểm tạm chốt Q22a–i để code không bị chặn (Staff xem đơn, tiền mặt online, gia hạn, đơn quá hạn, số biên lai…) | Q17, Q20 chưa có trả lời | `OPEN_QUESTIONS.md` trên nhánh `trienw3` (từ 07/11 đổi số thành Q24a–i) |
| 3 | Bàn giao đơn hàng, thanh toán cho Sơn | Sơn làm màn mua gói | `docs/handoff/handoffs/orders-trien-to-tson.md` (commit `ce1cd03`) |
| 4 | Báo cáo tuần 2, mô tả hook backend trong `CONTRIBUTING.md` | Dồn từ tuần 2 | Commit `4cdabe2`, `b4287fb` |

## 3. Việc chưa xong hoặc trễ

| # | Việc | Lý do | Hạn mới đề xuất | Ảnh hưởng tới ai |
| --- | --- | --- | --- | --- |
| 1 | Auth + `/me` | Ưu tiên đơn hàng; không đủ thời gian | Sơn viết bù 05/11 | Sơn (màn đăng nhập, hồ sơ), Hồng Anh (qrToken) |
| 2 | Mở PR đơn hàng, chạy e2e | Máy chưa có Docker | Chạy qua CI tuần 5 | Sơn (FE chuyển sang API thật), Huy Trường (test) |
| 3 | PR husky, Postman, ma trận phân quyền | Dồn nhiều tuần, chưa sắp xếp được | Postman, phân quyền: tuần 6 | Cả nhóm, Huy Trường |

## 4. Đang vướng, chờ ai

| # | Vướng gì | Chờ ai | Từ ngày | Cần trước ngày |
| --- | --- | --- | --- | --- |
| 1 | Máy cài Docker để chạy e2e | Triển (tự làm) | 20/10 | 28/10 |
| 2 | Q17 (5 điểm), Q20 (9 điểm) nghiệp vụ | Huy Trường | 08/10, 18/10 | 26/10 |
| 3 | Duyệt 9 điểm tạm chốt Q22a–i | Huy Trường, Hồng Anh | 20/10 | 28/10 |

## 5. Bàn giao

- **Đã gửi:** đơn hàng, thanh toán tiền mặt, gói hội viên cho Sơn (`docs/handoff/handoffs/orders-trien-to-tson.md`); openapi 0.2.1 (3 mã lỗi mới, FE thêm vào `frontend/src/lib/errors.ts`).
- **Đã nhận:** schema 18 bảng + seed (Hồng Anh, PR #21); mã lỗi Q16, Q21 (Hồng Anh, PR #22).

## 6. Câu hỏi mở liên quan

- Q17, Q20 — nghiệp vụ (Huy Trường) — quá hạn; Sơn trả lời thay 05/11.
- Q22a–i (nay Q24a–i) — tạm chốt của Triển, chờ Huy Trường, Hồng Anh duyệt.
- Q16, Q21 — Hồng Anh đã trả lời 18/10, Triển đã cập nhật openapi 0.2.1.

## 7. Đề xuất thay đổi kế hoạch, phạm vi, hợp đồng API

- Lùi Auth + `/me` sang đầu tuần 4, làm trước VNPay vì đang chặn Sơn và Hồng Anh. Cần cả nhóm biết.

## 8. Kế hoạch tuần 4

| # | Việc | Hạn | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | Auth + `/me` + guard `token_version` + Supertest (dồn) | 27/10 | — |
| 2 | Cài Docker, chạy e2e, mở PR đơn hàng | 27/10 | — |
| 3 | VNPay sandbox: checkoutUrl, IPN kiểm chữ ký, đối soát số tiền, `gateway_payload`, thử 3 ca | 28/10 | Staging có URL công khai (Hồng Anh, Q5) |
| 4 | Sửa bug demo, trực kỹ thuật | 30–31/10 | — |

## 9. Ghi chú, bài học

- Viết code trước khi có môi trường chạy e2e làm việc "xong" không chắc chắn; phải cài Docker ngay khi bắt đầu module có DB.
- Tạm chốt có ghi rõ "nơi áp dụng" giúp đổi ý sau này dễ (mỗi điểm sửa trong 1 file).
