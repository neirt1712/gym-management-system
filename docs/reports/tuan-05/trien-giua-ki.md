# Báo cáo giữa kỳ — Triển (BE Lead), tuần 1–5

| Mục | Nội dung |
| --- | --- |
| Giai đoạn | Tuần 1–5 (05/10 – 08/11/2026), nửa đầu của 10 tuần |
| Người báo cáo | Triển · BE Lead |
| Người nhận | Huy Trường (PM), để tổng hợp báo cáo giữa kỳ của nhóm |
| Ngày viết | 08/11/2026 |
| Nguồn số liệu | Git của repo, `docs/plan/be-plan.md`, `docs/handoff/STATUS.md`, `CONTRACT_STATUS.md`, `OPEN_QUESTIONS.md`, báo cáo tuần 1–5 trong `docs/reports/tuan-0N/trien.md` |
| Tự đánh giá chung | Phần kiến trúc, hợp đồng API, thiết kế: **đúng hoặc sớm hơn kế hoạch**. Phần code endpoint: **trễ khoảng 2 tuần**; một phần do Sơn viết bù |

## 1. Tóm tắt một trang

| Hạng mục | Kết quả đến 08/11 |
| --- | --- |
| Quyết định kiến trúc | 2 ADR được nhóm chấp nhận (0001 công nghệ, 0002 repo và quy trình AI) |
| Hợp đồng API `openapi.yaml` | **Đủ 74/74 API** theo `api-v3.md` + 2 endpoint bổ sung (Q6, Q15); 5 phiên bản (0.1.0 → 0.2.2); ~5.200 dòng; Redocly lint 0 lỗi; mock Prism cho FE làm song song |
| Sơ đồ thiết kế | 6 sơ đồ trạng thái, 4 sơ đồ tuần tự (`docs/design/`) |
| Khung backend dùng chung | Format lỗi chung, kiểm dữ liệu vào, phân quyền theo vai trò, kiểm quyền sở hữu, thu hồi phiên |
| Endpoint có code | **20/39** endpoint thuộc phần Triển (Xác thực 5, Hồ sơ 3, Đơn hàng 5, Thanh toán 5, Gói hội viên 2), **chưa vào `develop`**, đang chạy e2e qua CI. Còn lại: Lịch PT 7, Lớp 7, Báo cáo 4, ảnh đại diện 1 |
| Kiểm thử | 33 unit test đạt; 55 ca e2e (auth 27, đơn – thanh toán 28) chờ kết quả CI |
| Phối hợp | Duyệt, gộp 5 PR của Hồng Anh; 1 bàn giao cho FE; mở và theo dõi 7 câu hỏi nghiệp vụ (Q16, Q17, Q20, Q21, Q22a–i/Q24, Q23) |
| Số commit | 20 commit cá nhân (không tính merge), 9 lần gộp PR |

## 2. Đóng góp chi tiết theo hạng mục

### 2.1. Kiến trúc và quy ước (tuần 1)

- **ADR 0001** (chấp nhận 06/10): TypeScript cho cả BE và FE; NestJS 10 + Prisma 5 + PostgreSQL 15+; JWT 15 phút + refresh token trong cookie HttpOnly, thu hồi phiên bằng `token_version`; chống trùng bằng unique constraint + `SELECT … FOR UPDATE`; tiền là số nguyên VND, giờ ISO 8601 +07:00.
- **Khung NestJS:** lỗi trả một dạng `{error:{code,message,details,requestId}}`, mỗi request có `requestId`; `ValidationPipe`; `JwtAuthGuard` + `RolesGuard`; 16 module rỗng theo nhóm API để 2 người BE làm song song.
- **Helper kiểm quyền sở hữu** (tuần 2): hội viên chỉ xem được dữ liệu của mình, xem của người khác trả 404 để không lộ bản ghi có tồn tại.

### 2.2. Hợp đồng API (tuần 1–5)

| Phiên bản | Ngày | Nội dung |
| --- | --- | --- |
| 0.1.0 | 08/10 (đúng hạn) | 8 nhóm, 37 API; 33 mã lỗi; ví dụ cho mock; 4 ví dụ đăng nhập theo vai trò |
| 0.2.0 | 18/10 (trễ 2 ngày) | Đủ 74 API (thêm Gói hội viên, PT, Lịch PT, Theo dõi tập, Lớp, Báo cáo, Thông báo); quy tắc `expectedVersion`, `allowedActions` cho lịch PT |
| 0.2.1 | 20/10 | 3 mã lỗi `ORDER_NOT_PENDING`, `FREEZE_LIMIT_REACHED`, `CLASS_NOT_OPEN`; quy tắc đơn và tiền mặt |
| 0.2.2 | 07/11 | Bỏ toàn bộ 19 ghi chú "Chưa chốt" theo câu trả lời Q16, Q17, Q20 |

Ý nghĩa với nhóm: FE (Sơn, Bằng) dựng màn trên mock từ tuần 1 mà không chờ BE; mọi thay đổi có `CHANGELOG.md` để FE biết sửa gì.

### 2.3. Thiết kế

- **Sơ đồ trạng thái:** đơn hàng và gói hội viên, lịch PT, thanh toán, đề xuất lịch PT, đăng ký lớp, lượt check-in.
- **Sơ đồ tuần tự:** mua gói và thanh toán; VNPay + IPN (đủ các nhánh mã trả về 97, 01, 04, 02, thành công, thất bại); thương lượng lịch PT; kích hoạt tài khoản tạo tại quầy.
- **Quy trình hệ thống:** `docs/design/quy-trinh-he-thong.md` (tác nhân, vòng đời hội viên, 10 quy trình, job nền) — dùng được cho chương phân tích của báo cáo.

### 2.4. Code backend

| Nhóm | UC | Ai viết | Trạng thái 08/11 |
| --- | --- | --- | --- |
| Đơn hàng: báo giá, tạo (chụp điều khoản), danh sách, chi tiết kèm biên lai, hủy | UC09, UC14 | Triển viết 20/10 (nhánh `trienw3`); bản dùng chính thức do Sơn viết 07/11, Triển review và sửa | Chờ e2e trên CI |
| Thanh toán tiền mặt: tạo, xác nhận tại quầy (audit), kích hoạt gói 1 transaction | UC13 | Như trên | Chờ e2e |
| Thanh toán VNPay: link thanh toán ký HMAC SHA512, IPN kiểm chữ ký, đối soát số tiền, chặn gọi lặp | UC12 | Sơn viết 07/11, Triển review | Chờ e2e; chưa thử sandbox thật |
| Gói hội viên: danh sách, chi tiết, số buổi PT theo tháng | UC10 | Triển 20/10, bản chính thức Sơn 07/11 | Chờ e2e |
| Xác thực: đăng ký, đăng nhập (khóa tạm 15 phút sau 5 lần sai), refresh, đăng xuất, đổi mật khẩu; thu hồi phiên ngay khi khóa hoặc đổi mật khẩu | UC01–UC03, UC06 | Triển và Sơn viết song song 07/11; nhóm dùng bản của Sơn | Chờ e2e |
| Hồ sơ: xem, sửa, tạo lại mã QR | UC05, UC15 | Sơn 07/11 | Chờ e2e |

Các điểm kỹ thuật quan trọng đã xử lý (có test):
- Gói hội viên **chỉ sinh ra khi tiền đã vào**: đơn PAID, số biên lai, gói, thông báo nằm chung một transaction; bấm xác nhận 2 lần hoặc VNPay gọi IPN lặp không sinh gói thứ hai.
- Ngày kết thúc gói theo quyết định 12 (31/01 + 1 tháng → 27/02), BE tính sẵn, FE không tự tính.
- Số buổi PT tính từ lịch, không lưu cột.

### 2.5. Phối hợp và quản lý

- Duyệt và gộp 5 PR của Hồng Anh (CSDL 18 bảng, mã lỗi, gói, hội viên, báo cáo tuần).
- Bàn giao đơn hàng, thanh toán cho Sơn (`docs/handoff/handoffs/orders-trien-to-tson.md`).
- Câu hỏi nghiệp vụ: phát hiện chỗ spec chưa nói khi viết API và ghi vào `OPEN_QUESTIONS.md` thay vì tự quyết (Q16, Q17, Q20, Q21); 9 điểm tạm chốt Q24a–i ghi rõ nơi áp dụng để đổi dễ.

## 3. So với kế hoạch (`be-plan.md`)

| Tuần | Kế hoạch của Triển | Thực tế |
| --- | --- | --- |
| 1 | ADR, khung NestJS, openapi v0.1, sơ đồ trạng thái | **Xong đúng hạn** |
| 2 | Auth + `/me`; helper sở hữu; openapi đủ 74 API; sơ đồ VNPay | openapi, sơ đồ, helper: xong (trễ 2 ngày). **Auth: không làm** |
| 3 | Đơn hàng, tiền mặt, kích hoạt gói, gói hội viên, giao dịch | **Xong code**, chưa PR, chưa chạy e2e |
| 4 | VNPay + IPN; sửa bug demo; trực kỹ thuật | **Không làm trong tuần** (không có commit 22/10–06/11: Triển ôn thi giữa kỳ) |
| 5 | Lịch PT: tạo, xem, đề xuất lại, chấp nhận, từ chối | **Chưa bắt đầu**; tuần này làm việc dồn: tích hợp, review, openapi 0.2.2 |

Tỷ lệ: tài liệu và thiết kế 100% kế hoạch; code endpoint phần Triển 20/39 (tính cả bản Sơn viết bù), chưa endpoint nào vào `develop`.

## 4. Vấn đề và cách xử lý

| Vấn đề | Ảnh hưởng | Đã làm / đề xuất |
| --- | --- | --- |
| Auth trễ từ 14/10 | FE chạy mock lâu, Hồng Anh chờ `/me` | Sơn viết bù 07/11; Triển review, đang chạy e2e |
| Máy Triển chưa có Docker nên không chạy được e2e | Code "xong" nhưng chưa chắc đúng trên DB thật | Chạy e2e qua GitHub Actions (CI Sơn dựng) |
| Tuần 4 không có tiến độ vì ôn thi giữa kỳ, không báo nhóm trước | Người khác phải làm thay | Cam kết: trễ quá 2 ngày thì báo nhóm ngay |
| Câu nghiệp vụ chậm trả lời (Q17, Q20 mở từ 08/10, 18/10) | Phải tạm chốt để code tiếp | Sơn trả lời thay 05/11; **cần Huy Trường xác nhận** (mục 6) |
| Hai nhánh dùng trùng số câu hỏi Q22, Q23 | Dễ hiểu nhầm quyết định | Đổi tạm chốt của Triển thành Q24a–i |
| Bỏ staging (Q23, Sơn chốt 05/11) | Lệch `be-plan`, `fe-plan` tuần 4; VNPay chỉ thử bằng IPN tự ký hoặc ngrok | Cần nhóm xác nhận và sửa kế hoạch |

## 5. Kế hoạch nửa sau (đến đóng chức năng 30/11)

| Tuần | Việc của Triển | Mốc |
| --- | --- | --- |
| 6 (09–15/11) | E2e xanh + PR tích hợp; lịch PT đầy đủ (tạo, đề xuất lại, chấp nhận, từ chối, đổi/hủy lịch đã chốt, xác nhận buổi); thử VNPay sandbox thật; Postman | Lịch PT 15/11 |
| 7 (16–22/11) | Lớp học (7 API, kiểm sức chứa, khóa dòng khi đăng ký) | 20/11 |
| 8 (23–29/11) | Báo cáo doanh thu, thống kê, xuất Excel (4 API); rà index | 26/11 |
| 9–10 | Sửa bug, README, tài liệu API, chương cài đặt BE, slide kiến trúc BE | 09/12 đóng băng |

Rủi ro: còn 18 endpoint (lịch PT 7, lớp 7, báo cáo 4) trong 3 tuần, đang trễ sẵn 1 tuần. **Đề xuất** chuyển phần Báo cáo (UC39–UC41) sang Hồng Anh hoặc cắt xuất Excel theo thứ tự cắt giảm trong `docs/process/dor-dod.md`. Cần nhóm quyết trong họp 09/11.

## 6. Cần Huy Trường làm hoặc quyết

1. Duyệt 9 điểm tạm chốt **Q24a–i** (`OPEN_QUESTIONS.md`). Đặc biệt Q24a: Staff xem đơn mọi ngày, ngược câu trả lời Q17(c) của Sơn.
2. Xác nhận các câu Sơn trả lời thay (Q16, Q17, Q20, Q22 khóa 15 phút, Q23 không staging) là quyết định của nhóm, cập nhật biên bản và `decisions.md` nếu cần.
3. Thêm 2 endpoint Q6 (tạo lại QR), Q15 (Staff đặt lại mật khẩu) vào `docs/spec/api-v3.md`; thêm 2 cột `created_at` (Q16) vào `erd-v3.md`.
4. Ma trận phân quyền (preparation #6) chưa khởi động từ tuần 1.

## 7. Bài học

- Contract-first (openapi đủ sớm) giúp FE không bị chặn dù BE trễ; nên giữ cách làm này cho các nhóm API còn lại.
- Phải có môi trường chạy test thật (DB) ngay từ đầu; viết code mà chưa chạy e2e dễ tưởng là xong.
- Trễ thì báo sớm và ghi vào `STATUS.md`, để không có hai người làm trùng một việc.
