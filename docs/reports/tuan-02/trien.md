# Báo cáo tuần 2 — Triển (BE Lead)

| Mục | Nội dung |
| --- | --- |
| Tuần | 2 (Thứ Hai 12/10 – Chủ Nhật 18/10/2026) |
| Người báo cáo | Triển · BE Lead · tên file `trien` |
| Ngày viết | 18/10/2026 |
| Tự đánh giá | Trễ nhiều — 2/9 việc kế hoạch xong (openapi đủ 74 API, sơ đồ VNPay), 2 việc xong một phần; Auth trễ vì chưa có schema Prisma |

## 1. Việc đã xong so với kế hoạch tuần

Kế hoạch lấy từ dòng tuần 2 trong `docs/plan/be-plan.md`, cộng việc dồn từ tuần 1 (mục 8 báo cáo tuần 1) và hạng mục của Triển trong `docs/plan/preparation.md`.

| # | Việc trong kế hoạch | Hạn | Trạng thái | Bằng chứng (PR, commit, file) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 1 | PR đưa dòng husky Q11 và bản định dạng lại vào `develop` | 13/10 | Đang làm | Nhánh `trienw2-husky-backend`, commit `05737b1` (12/10), đã push | Chưa mở PR. Đã kiểm không xung đột với `develop` |
| 2 | Auth: register, login (khóa tạm sau 5 lần sai), logout, refresh (cookie HttpOnly + `token_version`), change-password | 14/10 | Chưa | — | Chặn: `develop` chưa có `backend/prisma/` (bảng `users`, `members`). Còn cần duyệt thư viện `bcrypt`, `cookie-parser`, `@prisma/client` |
| 3 | `GET /me`, `PATCH /me`; hàm kiểm sở hữu dùng chung; guard so `token_version` | 14/10 | Đang làm (1/3) | Helper sở hữu: commit `1e4f733`, PR #20; `backend/src/common/ownership/` | Helper xong, 6 unit test. `/me` và guard `token_version` chờ Prisma như #2 |
| 4 | Test Supertest cho auth và `/me` | 14/10 | Chưa | — | Phụ thuộc #2, #3 |
| 5 | openapi đủ 74 API (7 nhóm còn lại, 36 API) | 16/10 | Xong (18/10, trễ 2 ngày) | Commit `972e221`, PR #19; `docs/api/openapi.yaml` 0.2.0, `docs/api/CHANGELOG.md` | 74 API + 2 endpoint Q6, Q15. Redocly lint 0 lỗi; mock Prism trả đúng ví dụ; đối chiếu spec bằng `spec-checker`, đã sửa chỗ lệch. Chỗ "Chưa chốt" Q16, Q17 chưa cập nhật vì chưa có trả lời |
| 6 | Sơ đồ tuần tự VNPay + IPN (preparation #13) | 16/10 | Xong (18/10, trễ 2 ngày) | Commit `972e221`, PR #19; `docs/design/sequence-diagrams.md` | Đủ nhánh RspCode 97, 01, 04, 02, thành công, thất bại; thanh toán lại; FE polling `GET /orders/{id}` |
| 7 | Request mẫu Postman cho Huy Trường khi auth xong | 16/10 | Chưa | — | Phụ thuộc #2 |
| 8 | Review PR gói, tài khoản của Hồng Anh | 16/10 | Chưa | Danh sách PR trên GitHub: Hồng Anh chưa mở PR nào | Không có PR để review |
| 9 | Ma trận phân quyền cùng Huy Trường (preparation #6) | 15/10 | Chưa | Chưa có `docs/spec/permissions.md` | Chờ Huy Trường khởi động và chia phần; dồn sang tuần 3 |

## 2. Việc ngoài kế hoạch đã làm

| # | Việc | Lý do | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Mở Q20 (8 điểm nghiệp vụ, hỏi Huy Trường) và Q21 (mã lỗi, hỏi Hồng Anh); đóng Q3 | Phát hiện chỗ spec chưa nói khi viết 7 nhóm API còn lại; Q3 đã xong từ openapi v0.1 | `docs/handoff/OPEN_QUESTIONS.md`, PR #19 |
| 2 | Cập nhật `CONTRACT_STATUS.md` (cột openapi của 16 nhóm thành "Đủ") và dòng Triển trong `STATUS.md` | Quy trình `/team-finish` | PR #19 |
| 3 | Viết báo cáo tuần 1 (nộp trễ) | Dồn từ tuần 1 | Commit `d7008ee`, PR #18 (đang mở) |

## 3. Việc chưa xong hoặc trễ

| # | Việc | Lý do | Hạn mới đề xuất | Ảnh hưởng tới ai |
| --- | --- | --- | --- | --- |
| 1 | Auth + `/me` + guard `token_version` + test Supertest | Chưa có schema Prisma (`users`, `members`) trên `develop`; preparation #12 hạn 13/10 của Hồng Anh chưa xong | 2 ngày làm việc sau khi có schema (dự kiến 22/10) | Sơn (màn đăng nhập, đăng ký, hồ sơ đang chạy mock), Huy Trường (test auth) |
| 2 | PR husky backend | Chưa mở PR sau khi push nhánh 12/10 | 19/10 | Cả nhóm (hook kiểm backend khi commit) |
| 3 | openapi đủ 74 API, sơ đồ VNPay | Trong lúc viết gặp nhiều điểm spec chưa nói, phải mở thêm Q20 (Huy Trường), Q21 (Hồng Anh) và đánh dấu "Chưa chốt"; Q16, Q17 vẫn chưa có trả lời | Đã xong 18/10 | Sơn, Bằng (mock 7 nhóm còn lại) |
| 4 | Ma trận phân quyền | Chờ Huy Trường khởi động và chia phần (dồn từ tuần 1) | 23/10 | Sơn (route guard), Huy Trường (test quyền) |
| 5 | Request mẫu Postman | Phụ thuộc Auth | Cùng ngày Auth xong | Huy Trường |

## 4. Đang vướng, chờ ai

| # | Vướng gì | Chờ ai | Từ ngày | Cần trước ngày |
| --- | --- | --- | --- | --- |
| 1 | Schema Prisma + migration (`users`, `members` trước; sau đó `orders`, `payments`, `subscriptions` cho tuần 3) | Hồng Anh | 12/10 | 20/10 |
| 2 | Q16: mã lỗi còn thiếu, `details` của 3 mã lỗi, cột `created_at` cho `orders`, `payments` | Hồng Anh | 08/10 | 20/10 (hạn cũ 13/10) |
| 3 | Q21: 2 mã lỗi mới; dòng FORBIDDEN trong `error-codes.md` lệch với quy ước 404 của openapi | Hồng Anh | 18/10 | 26/10 |
| 4 | Q17: 5 điểm nghiệp vụ (quên mật khẩu không email, check-in gói chưa tới ngày, Staff xem đơn, IPN cho payment đã thay, hội viên tự chọn tiền mặt) | Huy Trường | 08/10 | 20/10 (hạn cũ 13/10) |
| 5 | Q20: 8 điểm nghiệp vụ của 7 nhóm API mới (hủy lớp, mở bảo lưu sớm, khung rảnh, rút yêu cầu lịch…) | Huy Trường | 18/10 | 26/10 |
| 6 | Thêm 2 endpoint Q6, Q15 vào `docs/spec/api-v3.md` | Huy Trường | 08/10 | 26/10 |

## 5. Bàn giao

- **Đã gửi:** openapi 0.2.0 đủ 74 API cho Sơn, Bằng (`docs/api/openapi.yaml`, điểm FE cần biết trong `docs/api/CHANGELOG.md` mục 0.2.0); helper kiểm sở hữu `backend/src/common/ownership/` cho Hồng Anh dùng trong module của bạn ấy. Chưa viết file bàn giao trong `docs/handoff/handoffs/`.
- **Đã nhận:** Không.

## 6. Câu hỏi mở liên quan

Từ `docs/handoff/OPEN_QUESTIONS.md`:
- Q5 — Hosting staging có URL công khai cho IPN VNPay (Hồng Anh) — hạn 20/10.
- Q16 — mã lỗi, `details`, cột `created_at` (Hồng Anh) — quá hạn 13/10.
- Q17 — 5 điểm nghiệp vụ (Huy Trường) — quá hạn 13/10.
- Q20 — 8 điểm nghiệp vụ của 7 nhóm API mới (Huy Trường) — hạn 26/10.
- Q21 — mã lỗi mới, dòng FORBIDDEN (Hồng Anh) — hạn 26/10.
- Q3 — đã đóng 18/10.

## 7. Đề xuất thay đổi kế hoạch, phạm vi, hợp đồng API

- Chốt ngày Hồng Anh giao schema Prisma + migration (`users`, `members` trước) trong họp Thứ Hai 19/10; Auth và toàn bộ việc tuần 3 của Triển đang chờ phần này. Cần Hồng Anh, Sơn đồng ý.
- Lùi hạn Auth + `/me` sang 2 ngày làm việc sau khi có schema (dự kiến 22/10); cập nhật `docs/plan/be-plan.md` và `CONTRACT_STATUS.md`, báo Sơn vì màn đăng nhập, hồ sơ đang chạy mock.
- Huy Trường trả lời Q17 (quá hạn 13/10) và Q20 trước 26/10; Hồng Anh trả lời Q16 (quá hạn 13/10) và Q21 trước 26/10, để Triển cập nhật các chỗ "Chưa chốt" trong openapi trước khi code đơn hàng, lịch PT.

## 8. Kế hoạch tuần 3

Từ dòng tuần 3 trong `docs/plan/be-plan.md`, cộng việc dồn ở mục 3.

| # | Việc | Hạn | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | PR husky backend | 19/10 | Hồng Anh review |
| 2 | Auth + `/me` + guard `token_version` + test Supertest (dồn từ tuần 2) | 22/10 | Schema `users`, `members` (Hồng Anh); duyệt thư viện `bcrypt`, `cookie-parser` |
| 3 | Request mẫu Postman cho auth (dồn) | 22/10 | Auth xong |
| 4 | quote (addMonths − 1 ngày, 5 unit test cuối tháng) | 21/10 | — (hàm thuần, không cần DB) |
| 5 | orders: tạo (snapshot, PENDING_ORDER_EXISTS, hạn 30 phút/hết ngày), list, detail kèm biên lai, cancel | 21/10 | Schema `orders` (Hồng Anh); Q16 |
| 6 | payments CASH + confirm-cash (audit); hàm kích hoạt gói 1 transaction (PAID + receipt_no + subscriptions + thông báo) | 23/10 | Schema `payments`, `subscriptions`, `notifications`; test song song |
| 7 | `GET /subscriptions` (+ số buổi theo tháng), `GET /payments` (lọc from, to, method) | 23/10 | Schema |
| 8 | Cập nhật openapi theo trả lời Q16, Q17, Q20, Q21 | khi có trả lời | Hồng Anh, Huy Trường |
| 9 | Ma trận phân quyền cùng Huy Trường (dồn) | 23/10 | Huy Trường khởi động |

## 9. Ghi chú, bài học

- Lại lỡ tự merge PR #19, #20 khi chưa có review; đã nhờ Hồng Anh review bù. Từ tuần 3 không bấm Merge PR của mình.
- Việc phụ thuộc DB bị chặn cả tuần: nên chốt ngày giao schema với Hồng Anh ngay đầu tuần và báo sớm khi trễ, thay vì đợi đến hạn.
- Subagent `spec-checker` bắt được chỗ openapi tự mâu thuẫn (403 và 404); nên chạy trước mỗi PR đổi hợp đồng.
