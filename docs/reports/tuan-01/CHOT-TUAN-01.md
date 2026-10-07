# Bản chốt tuần 1 (05–11/10/2026) — Hệ thống quản lý phòng gym

> **Cách dùng:** dán **toàn bộ** file này vào Claude (web hoặc app) trước khi hỏi việc, để Claude nắm bối cảnh nhóm. Hoặc đọc như bản tin. Bản này tự đủ nghĩa, không cần mở repo.
> Cập nhật: 08/10/2026 · Người soạn: Trường Sơn (FE Lead) cùng Claude Code · Nguồn: `docs/handoff/OPEN_QUESTIONS.md`, `STATUS.md`, `docs/plan/*` trên nhánh `develop`.
> Phần của Triển, Hồng Anh, Bằng, Huy Trường lấy từ `STATUS.md` ngày 06/10; mỗi người tự sửa dòng của mình nếu đã khác.

## 1. Bối cảnh dự án

- Đồ án môn học, 5 người, 10 tuần (05/10 – 13/12/2026). Demo lần 1: **30–31/10** (luồng: Admin tạo gói → khách đăng ký, mua gói, thanh toán → hội viên xem gói, QR → Staff check-in).
- Phạm vi: 44 use case, 18 bảng CSDL, 74 API (đang bổ sung, xem Q6, Q15). 4 vai trò người dùng: Hội viên (MEMBER), Huấn luyện viên (TRAINER), Nhân viên quầy (STAFF), Quản trị (ADMIN).
- Công nghệ (đã chốt): TypeScript cho cả hai phía. Backend NestJS 10 + Prisma + PostgreSQL 15. Frontend React 18 + Vite + Ant Design 5 + TanStack Query. Hợp đồng API viết trong `openapi.yaml` trước khi code (contract-first).
- Repo GitHub: `neirt1712/gym-management-system`, một repo chung (`backend/`, `frontend/`, `docs/`, `tests/`).

| Người | Vai trò | Phụ trách chính |
| --- | --- | --- |
| Triển | BE Lead | Kiến trúc BE, viết `openapi.yaml`, auth, đơn hàng + VNPay, lịch PT, lớp học, báo cáo |
| Hồng Anh | BE Sub | Docker, CSDL, migration, mã lỗi, staging + CI; gói, tài khoản, hội viên, check-in, PT, thông báo |
| Trường Sơn | FE Lead | Kiến trúc FE, đăng nhập, cổng hội viên (mua gói, thanh toán), lịch PT, lớp học phía hội viên; review PR FE |
| Thanh Bằng | FE Sub | Figma, bộ màu, component dùng chung; màn quầy, Admin, PT, thông báo |
| Huy Trường | PM | Use case + tiêu chí chấp nhận, bảng công việc, test, biên bản, báo cáo |

## 2. Những thắc mắc đã chốt

Mỗi dòng: **thắc mắc là gì → đã chốt gì → ai phải làm gì.**

| # | Thắc mắc | Đã chốt | Ai phải làm |
| --- | --- | --- | --- |
| Q1 | Backend dùng TypeScript hay Java? | **TypeScript (NestJS)** cho cả BE và FE (06/10, ADR 0001) | Cả nhóm |
| Q2 | Quy trình nhóm: một hay hai repo, tài liệu nguồn ở đâu, dùng Claude Code thế nào? | **Một repo**; tài liệu nguồn ở `docs/spec` (phạm vi) và `docs/plan` (kế hoạch); mâu thuẫn thì ghi `OPEN_QUESTIONS.md` và hỏi, không tự chọn (ADR 0002, chấp nhận 08/10) | Cả nhóm |
| Q6 | Quyết định 13 nói mã QR check-in "cố định, tạo lại được khi bị lộ", nhưng danh mục API thiếu API tạo lại | **Giữ** chức năng tạo lại QR | Huy Trường thêm vào `api-v3.md`; Triển viết openapi; Hồng Anh làm BE tuần 3 |
| Q7 | FE được dùng thư viện nào? | Danh sách đã duyệt ghi trong `frontend/CLAUDE.md`; thêm thư viện khác phải hỏi Sơn | Sơn, Bằng |
| Q8 | Chưa có API thật thì FE thử đăng nhập 4 vai trò thế nào? | Cờ `VITE_AUTH_MODE=fake\|http`; chế độ `fake` dùng 4 tài khoản mẫu | Sơn, Bằng; Triển thêm 4 ví dụ đăng nhập vào openapi |
| Q9 | Tính ngày (hết hạn gói, bảo lưu…) ở BE hay FE? | **BE tính hết** và trả sẵn trong API; FE chỉ hiển thị. Ngày dạng `YYYY-MM-DD`, giờ ISO 8601 `+07:00` | Triển, Hồng Anh, Sơn, Bằng |
| Q10 | Đặt tên nhánh Git thế nào? | `<ten>w<tuan>-<mo-ta>`, ví dụ `tsonw1-fe-scaffold`; PR vào `develop`, 1 người review | Cả nhóm |
| Q11 | Công cụ kiểm code trước commit (husky) kiểm FE hay cả BE? | **Chỉ FE** trước; BE thêm khi có ESLint | Triển thêm dòng cho BE sau |
| Q12 | Đăng nhập bằng gì? | **Chỉ số điện thoại** + mật khẩu | Triển (openapi), Sơn (màn đăng nhập), Huy Trường (test case) |
| Q14 | Use case cho Admin xem/bảo lưu hội viên, Staff đặt lịch PT hộ, Staff/PT xem đăng ký lớp — nhưng không có màn | **Dùng lại màn có sẵn**: Admin dùng chung màn "Hội viên" của Staff; nút "Đặt lịch PT hộ" trong chi tiết hội viên; danh sách đăng ký nằm trong chi tiết lớp | Bằng (vẽ Figma, làm màn), Sơn (route), Huy Trường (test) |
| Q15 | Có bỏ email, chỉ dùng số điện thoại không? | **SĐT bắt buộc, email không bắt buộc.** Có email: tự lấy lại mật khẩu qua link email. Không có email: ra quầy, Staff đối chiếu SĐT rồi đặt lại mật khẩu / kích hoạt | Huy Trường sửa quyết định 1, UC04, `api-v3.md`; Hồng Anh cho email được trống trong ERD + mã lỗi; Triển openapi + API "Staff đặt lại mật khẩu"; Bằng form hội viên + nút đặt lại mật khẩu; Sơn màn đăng ký, quên mật khẩu |

(Q13 đã gộp vào Q15.)

## 3. Thắc mắc còn mở

| # | Thắc mắc | Hỏi ai | Hạn |
| --- | --- | --- | --- |
| Q3 | Triển giao phần đăng nhập của openapi trước được không, để FE nối sớm? | Triển | 08/10 |
| Q4 | Link Figma các màn demo | Bằng | 08/10 |
| Q5 | Staging đặt ở đâu (Render/Railway hay VPS trường)? Cần địa chỉ công khai để VNPay gọi về | Hồng Anh | 20/10 |

## 4. Mỗi người: đã làm và việc tuần này

| Người | Đã xong | Đang làm (tuần 1) | Hạn | Đang chờ |
| --- | --- | --- | --- | --- |
| Triển | ADR 0001 (chốt TypeScript) | Khung NestJS, **openapi v0.1** (auth, hồ sơ, gói, đơn, thanh toán, check-in, hội viên, tài khoản) | 08/10 | — |
| Hồng Anh | docker-compose ban đầu (Postgres 15, pgAdmin) | MailHog, extension Postgres, migration 10 bảng đầu, danh mục mã lỗi | 09/10 | — |
| Trường Sơn | Bộ cấu hình Claude Code + tài liệu dự án; **khung FE chạy được** (đăng nhập thử 4 vai trò, 13 test xanh); quy ước Git; bộ báo cáo tuần; hướng dẫn + brief Figma cho Bằng; chốt Q2, Q6–Q15 | Lớp gọi API (`api/client.ts`, mock Prism) khi có openapi | 09/10 | openapi v0.1 (Triển) |
| Thanh Bằng | — | **Figma ~15 màn demo**; 7 component dùng chung (PageHeader, DataTable, FormModal, StatusTag, EmptyState, ErrorState, ConfirmDialog) | 08/10, 09/10 | — |
| Huy Trường | — | Tài liệu use case v3 + tiêu chí chấp nhận; bảng công việc GitHub Projects (trễ, hạn 06/10); bảng thuật ngữ, ma trận phân quyền | 08–09/10 | — |

## 5. Quy ước làm việc cần nhớ

- Lấy code mới: `git switch develop` rồi `git pull`. Không commit thẳng vào `main` hay `develop`.
- Mỗi việc một nhánh `<ten>w<tuan>-<mo-ta>`, một PR vào `develop`, 1 người review (Triển ↔ Hồng Anh, Sơn ↔ Bằng).
- Đổi API: Triển sửa `openapi.yaml` trước rồi mới code. Không bịa API, trường dữ liệu, mã lỗi.
- Thắc mắc hoặc thấy tài liệu mâu thuẫn: ghi vào `docs/handoff/OPEN_QUESTIONS.md` (có cột "Ảnh hưởng ai"), báo người liên quan; không tự chọn.
- Ngoài phạm vi, không làm: nâng cấp gói, mã giảm giá, điểm thưởng, hoàn tiền, SMS, hóa đơn điện tử, đánh giá PT, lớp lặp tuần, màn xem nhật ký hệ thống.
- Báo cáo tuần: mỗi người một bản cuối tuần theo mẫu `docs/reports/_MAU-ca-nhan.md`; Huy Trường tổng hợp sáng Thứ Hai.

## 6. Lịch gần

| Ngày | Việc |
| --- | --- |
| 08/10 | openapi v0.1 (Triển); Figma màn demo (Bằng); trả lời Q3 |
| 09/10 | Migration 10 bảng (Hồng Anh); component dùng chung (Bằng); lớp API FE + mock (Sơn); thuật ngữ, ma trận phân quyền (Huy Trường) |
| 09–11/10 | Mỗi người viết báo cáo tuần 1 |
| 12/10 (Thứ Hai) | Họp: duyệt tổng hợp tuần 1, nhận việc tuần 2 |
