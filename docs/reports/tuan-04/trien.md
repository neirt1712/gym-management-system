# Báo cáo tuần 4 — Triển (BE Lead)

| Mục | Nội dung |
| --- | --- |
| Tuần | 4 (Thứ Hai 26/10 – Chủ Nhật 01/11/2026) |
| Người báo cáo | Triển · BE Lead · tên file `trien` |
| Ngày viết | 07/11/2026 (nộp trễ 6 ngày) |
| Tự đánh giá | Trễ nhiều — 0/4 việc kế hoạch tuần 4 xong trong tuần; repo không có commit nào của Triển từ 22/10 đến 06/11 vì ôn thi giữa kỳ. Phần BE còn trễ do Sơn viết bù 05–07/11, Triển làm tiếp từ 07/11 (báo cáo tuần 5) |

## 1. Việc đã xong so với kế hoạch tuần

Kế hoạch lấy từ dòng tuần 4 trong `docs/plan/be-plan.md`, cộng việc dồn ở mục 8 báo cáo tuần 3.

| # | Việc trong kế hoạch | Hạn | Trạng thái | Bằng chứng (PR, commit, file) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 1 | Auth + `/me` + guard `token_version` + Supertest (dồn) | 27/10 | Chưa trong tuần | — | Sơn viết bù trên `tsonw4-tich-hop` (commit `9f8bfe0`, 07/11) |
| 2 | Cài Docker, chạy e2e, mở PR đơn hàng (dồn) | 27/10 | Chưa | — | Từ 07/11 chạy e2e qua GitHub Actions thay cho Docker trên máy |
| 3 | VNPay sandbox: checkoutUrl (`vnp_TxnRef = merchantRef`), IPN kiểm chữ ký, đối soát số tiền, `gateway_payload`, unique `gateway_txn_id`; thử 3 ca | 28/10 | Chưa trong tuần | — | Sơn viết bù (commit `03b0905`, 07/11): ký HMAC SHA512, IPN, e2e cho ca thành công, thất bại, gọi lặp. Chưa thử trên sandbox VNPay thật |
| 4 | Sửa bug demo, trực kỹ thuật (demo lần 1, 30–31/10) | 30–31/10 | Chưa | — | Triển ôn thi giữa kỳ, không trực kỹ thuật cho demo |

## 2. Việc ngoài kế hoạch đã làm

| # | Việc | Lý do | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Không có | | |

## 3. Việc chưa xong hoặc trễ

| # | Việc | Lý do | Hạn mới đề xuất | Ảnh hưởng tới ai |
| --- | --- | --- | --- | --- |
| 1 | Toàn bộ 4 việc ở mục 1 | Triển ôn thi giữa kỳ từ 26/10 đến 06/11, dự án bị bỏ ngỏ; không báo nhóm trước | Làm bù từ 07/11 (báo cáo tuần 5) | Sơn (FE chạy mock, phải tự viết bù BE), Hồng Anh (chờ `/me`), Huy Trường (chưa test được API thật) |
| 2 | Thử VNPay trên sandbox thật | Cần tài khoản merchant test của Triển | Tuần 6 | Huy Trường (ảnh chụp cho báo cáo) |

## 4. Đang vướng, chờ ai

| # | Vướng gì | Chờ ai | Từ ngày | Cần trước ngày |
| --- | --- | --- | --- | --- |
| 1 | Q17, Q20 nghiệp vụ | Huy Trường | 08/10, 18/10 | 26/10 (Sơn trả lời thay 05/11) |
| 2 | Q22a–i tạm chốt (nay Q24) | Huy Trường, Hồng Anh | 20/10 | 28/10 |

## 5. Bàn giao

- **Đã gửi:** Không.
- **Đã nhận:** Không. (Sơn bàn giao nhánh tích hợp và prompt giao việc ngày 07/11, ghi ở báo cáo tuần 5.)

## 6. Câu hỏi mở liên quan

- Q5 — staging Render + Neon (Hồng Anh chốt 18/10); Sơn chốt lại 05/11 ở Q23: chỉ chạy local, không làm staging.
- Q17, Q20 — Huy Trường chưa trả lời trong tuần.

## 7. Đề xuất thay đổi kế hoạch, phạm vi, hợp đồng API

- Không có trong tuần. (Đề xuất dời việc ở báo cáo tuần 5.)

## 8. Kế hoạch tuần 5

| # | Việc | Hạn | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | Hoàn tất Auth, đơn hàng, thanh toán, VNPay (dồn): chạy e2e, mở PR | 06/11 | Docker hoặc CI |
| 2 | Lịch PT: `POST /appointments`, list/detail (`allowedActions`), COUNTER, accept, reject | 04–06/11 | Auth xong |
| 3 | Viết bù báo cáo tuần 3, 4 | 08/11 | — |

## 9. Ghi chú, bài học

- Không báo sớm khi bị trễ khiến người khác phải làm thay mà không có kế hoạch. Lần sau trễ quá 2 ngày thì nhắn nhóm ngay.
- Lịch thi biết trước nên phải báo nhóm từ đầu tuần và nhờ người làm thay có kế hoạch, thay vì để việc dừng.
