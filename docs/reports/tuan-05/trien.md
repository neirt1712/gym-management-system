# Báo cáo tuần 5 — Triển (BE Lead)

| Mục | Nội dung |
| --- | --- |
| Tuần | 5 (Thứ Hai 02/11 – Chủ Nhật 08/11/2026) |
| Người báo cáo | Triển · BE Lead · tên file `trien` |
| Ngày viết | 07/11/2026 |
| Tự đánh giá | Trễ nhiều — việc dồn (Auth, đơn hàng, VNPay) đã có code và đang chạy e2e qua CI; 0/6 việc lịch PT của tuần 5 chưa bắt đầu |

## 1. Việc đã xong so với kế hoạch tuần

Kế hoạch lấy từ dòng tuần 5 trong `docs/plan/be-plan.md`, cộng việc dồn ở mục 8 báo cáo tuần 4.

| # | Việc trong kế hoạch | Hạn | Trạng thái | Bằng chứng (PR, commit, file) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 1 | Auth: register, login (khóa tạm sau 5 lần sai), logout, refresh, change-password + Supertest (dồn) | 06/11 | Đang làm (chờ e2e) | Bản của Sơn: commit `9f8bfe0` trên `tsonw4-tich-hop`. Bản của Triển: commit `71f5616` trên `trienw5-uc01-auth` (chỉ trên máy, giữ tham khảo) | Hai người viết song song cùng ngày; nhóm chọn bản của Sơn. Khóa tạm 15 phút (Q22) |
| 2 | Đơn hàng, thanh toán tiền mặt + VNPay + IPN, gói hội viên (dồn) | 06/11 | Đang làm (chờ e2e) | Commit `03b0905` (Sơn), `70a9464` (Triển sửa sau review) | Xem mục 2, việc 1 |
| 3 | openapi: bỏ ghi chú "Chưa chốt" theo Q16, Q17, Q20, Q21 | 06/11 | Xong (07/11) | Commit `2d0b717`, `openapi.yaml` 0.2.2, `CHANGELOG.md` | Gộp lại 0.2.1 (3 mã lỗi); thay 19 ghi chú; Redocly lint hợp lệ, 4 cảnh báo cũ |
| 4 | `POST /appointments` (gói PT ACTIVE, trong hạn, còn buổi) | 04/11 | Chưa | — | Chờ Auth vào `develop` |
| 5 | `GET /appointments`, `GET /appointments/{id}` (lịch sử đề xuất, `allowedActions`) | 06/11 | Chưa | — | |
| 6 | Đề xuất COUNTER (version + 1) | 06/11 | Chưa | — | |
| 7 | accept (`FOR UPDATE` dòng PT, kiểm trùng, quota, `expectedVersion`), reject có lý do | 04/11 | Chưa | — | |
| 8 | Thông báo lịch PT; 10 test tích hợp | 06/11 | Chưa | — | |
| 9 | Viết bù báo cáo tuần 3, 4 | 08/11 | Xong (07/11) | `docs/reports/tuan-03/trien.md`, `tuan-04/trien.md` | |

## 2. Việc ngoài kế hoạch đã làm

| # | Việc | Lý do | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Review nghiệp vụ code BE của Sơn (42 file, ~2.900 dòng) và sửa chỗ lệch tạm chốt: Staff xem đơn mọi ngày (Q24a); gia hạn gói đã hủy trả 400, gói đã hết hạn bắt đầu hôm nay (Q24d); đơn quá hạn chuyển EXPIRED khi xem (Q24e); biên lai lấy tên gói lúc thanh toán (Q24g); guard chặn `sub` không phải UUID (trước đó lỗi 500); `app.e2e` dùng user thật | Sơn viết bù phần BE trễ (prompt `docs/handoff/handoffs/prompt-trien-2026-11-07.md`) | Commit `70a9464`; thêm 3 ca e2e |
| 2 | Đổi số 9 điểm tạm chốt thành Q24a–i (trùng Q22, Q23 của Sơn) | Hai nhánh cùng dùng số Q22, Q23 cho câu khác nhau | `docs/handoff/OPEN_QUESTIONS.md` (commit `2d0b717`) |
| 3 | Tài liệu cho báo cáo giữa kỳ: quy trình hệ thống, tổng hợp 44 UC, báo cáo tiến độ | Chuẩn bị báo cáo với thầy | `docs/design/quy-trinh-he-thong.md` (chưa commit), `docs/reports/tuan-05/trien-giua-ki.md` |

Kiểm tra (07/11, trên máy, nhánh `tsonw4-tich-hop`): lint, typecheck, build đạt; 33 unit test đạt. **E2e chưa có kết quả:** máy chưa có Docker, chạy qua GitHub Actions sau khi push và mở PR.

## 3. Việc chưa xong hoặc trễ

| # | Việc | Lý do | Hạn mới đề xuất | Ảnh hưởng tới ai |
| --- | --- | --- | --- | --- |
| 1 | E2e xanh + PR nhánh tích hợp vào `develop` | Chờ CI | 10/11 | Sơn (FE sang API thật), Hồng Anh (review), Huy Trường (test) |
| 2 | Lịch PT (6 endpoint, 10 test) | Phải làm xong việc dồn trước | 13/11 | Sơn (màn lịch PT), Hồng Anh (test trùng lịch) |
| 3 | Thử VNPay trên sandbox thật (`docs/handoff/demo-vnpay-sandbox.md`) | Cần Triển đăng ký merchant test | 12/11 | Huy Trường (ảnh cho báo cáo) |
| 4 | Request mẫu Postman, ma trận phân quyền | Dồn từ tuần 2 | 15/11 | Huy Trường |

## 4. Đang vướng, chờ ai

| # | Vướng gì | Chờ ai | Từ ngày | Cần trước ngày |
| --- | --- | --- | --- | --- |
| 1 | Push nhánh và mở draft PR để CI chạy e2e | Triển | 07/11 | 08/11 |
| 2 | Duyệt Q24a–i (đặc biệt Q24a ngược câu trả lời Q17c của Sơn) | Huy Trường | 20/10 | 09/11 (họp Thứ Hai) |
| 3 | Xác nhận các câu Sơn "chốt thay" (Q16, Q17, Q20, Q22, Q23) là quyết định của nhóm | Huy Trường | 05/11 | 09/11 |
| 4 | Review PR tích hợp | Hồng Anh | khi mở PR | 11/11 |

## 5. Bàn giao

- **Đã gửi:** openapi 0.2.2 cho Sơn, Bằng (mục 0.2.2 trong `CHANGELOG.md`: màn quên mật khẩu luôn ghi "liên hệ quầy").
- **Đã nhận:** từ Sơn: code BE viết bù trên `tsonw4-tich-hop`, CI (`.github/workflows/ci.yml`), hướng dẫn demo VNPay, prompt giao việc.

## 6. Câu hỏi mở liên quan

- Q24a–i — tạm chốt của Triển — chờ Huy Trường, Hồng Anh duyệt.
- Q22 (khóa 15 phút), Q23 (chỉ chạy local) — Sơn chốt 05/11; Q23 lệch `be-plan`, `fe-plan` tuần 4 (staging), các file kế hoạch chưa sửa.

## 7. Đề xuất thay đổi kế hoạch, phạm vi, hợp đồng API

- Dời lịch PT tuần 5 sang tuần 6 và nén việc tuần 6 (RESCHEDULE/CANCEL, complete) vào cùng tuần; cân nhắc chuyển báo cáo (UC39–UC41, tuần 8) sang Hồng Anh để kịp đóng chức năng 30/11. Cần cả nhóm duyệt trong họp 09/11.
- Sửa `be-plan.md` tuần 4 theo Q23 (bỏ staging, deploy) sau khi nhóm xác nhận.

## 8. Kế hoạch tuần 6

| # | Việc | Hạn | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | E2e xanh, `/team-finish`, PR nhánh tích hợp (dồn) | 10/11 | CI, Hồng Anh review |
| 2 | Lịch PT: create, list/detail, COUNTER, accept, reject (dồn tuần 5) | 13/11 | PR tích hợp vào `develop` |
| 3 | Lịch PT: RESCHEDULE/CANCEL cho lịch đã chốt, complete (COMPLETED/NO_SHOW), thông báo | 15/11 | Việc 2 |
| 4 | Thử VNPay sandbox thật, ảnh màn kết quả | 12/11 | Tài khoản merchant |
| 5 | Request mẫu Postman cho Auth, đơn, thanh toán | 15/11 | Việc 1 |
| 6 | Review PR của Hồng Anh (bảo lưu, theo dõi tập) | 15/11 | Hồng Anh mở PR |

## 9. Ghi chú, bài học

- Hai người cùng viết một phần mà không báo nhau (Auth) là phí công; nhận việc thì ghi vào `STATUS.md` ngay.
- Số câu hỏi trong `OPEN_QUESTIONS.md` nên giữ trên `develop` trước khi dùng, tránh hai nhánh dùng trùng số.
- Chạy e2e qua CI khi máy chưa có DB là cách nhanh để có kết quả thật.
