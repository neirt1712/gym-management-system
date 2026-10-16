# Báo cáo tuần 1 — Triển (BE Lead)

| Mục | Nội dung |
| --- | --- |
| Tuần | 1 (Thứ Hai 05/10 – Chủ Nhật 11/10/2026) |
| Người báo cáo | Triển · BE Lead · tên file `trien` |
| Ngày viết | 12/10/2026 (nộp trễ 1 ngày) |
| Tự đánh giá | Trễ ít — 4/4 việc trong be-plan xong đúng hạn; trễ ở quy trình (PR gộp nhầm vào `main`, chưa qua review), ma trận phân quyền chưa làm, báo cáo nộp muộn 1 ngày |

## 1. Việc đã xong so với kế hoạch tuần

Kế hoạch lấy từ dòng tuần 1 trong `docs/plan/be-plan.md` và các hạng mục của Triển trong `docs/plan/preparation.md`.

| # | Việc trong kế hoạch | Hạn | Trạng thái | Bằng chứng (PR, commit, file) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 1 | ADR 0001 — chọn công nghệ | 07/10 | Xong (06/10) | `docs/adr/0001-tech-stack.md` (đưa lên repo trong commit `284e4f1`) | Chốt TypeScript cho cả BE và FE |
| 2 | openapi v0.1: xác thực, hồ sơ, gói, đơn, thanh toán, check-in, hội viên, tài khoản | 08/10 | Xong (08/10) | Commit `405f751`, PR #10 rồi PR #13 vào `develop`; `docs/api/openapi.yaml`, `docs/api/CHANGELOG.md` | 37 API + `/health` + 2 endpoint theo Q6, Q15. Redocly lint 0 lỗi; mock Prism chạy được; Sơn đã nối vào (PR #14) |
| 3 | Khung NestJS: module, format lỗi, ValidationPipe, JwtGuard + RolesGuard, `/health` | trong tuần | Xong, còn dọn | Commit `42eb570` (PR #9 rồi PR #13 vào `develop`); bản sạch ở nhánh `trienw1-be-skeleton` (commit `191e250`) | Lint, typecheck, 7 unit test, 7 e2e test, build đều đạt (chạy 08/10). Bản vào `develop` là bản `wip`, thiếu dòng husky Q11 — xem mục 3 |
| 4 | Xuất 7 sơ đồ trạng thái từ Mermaid | 09/10 | Xong (08/10) | Commit `7c23b11`, PR #12 rồi PR #13; `docs/design/state-diagrams.md` | Thêm Thanh toán, Đề xuất lịch, Đăng ký lớp, Lượt check-in; đã thử vẽ bằng mermaid-cli |
| 5 | Quy ước code và Git (cùng Sơn, preparation #2) | 07/10 | Xong (Sơn soạn chính) | `CONTRIBUTING.md` (commit do Sơn đưa lên) | Triển góp ý và đồng sở hữu file; không có commit riêng |
| 6 | Ma trận phân quyền (cùng Huy Trường, preparation #6) | 09/10 | Chưa | Chưa có `docs/spec/permissions.md` | Chờ Huy Trường khởi động; dồn sang tuần 2 (mục 3) |

## 2. Việc ngoài kế hoạch đã làm

| # | Việc | Lý do | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Thêm 2 endpoint vào openapi: `POST /me/qr-token/regenerate`, `POST /members/{id}/reset-password` | Kéo theo từ Q6 (giữ tạo lại QR) và Q15 (không có email thì đặt lại mật khẩu tại quầy) | `openapi.yaml`, commit `405f751` |
| 2 | 4 ví dụ đăng nhập theo vai trò cho mock | Q8 (Sơn nhờ) | `openapi.yaml`, `POST /auth/login` |
| 3 | Mở Q16 (Hồng Anh) và Q17 (Huy Trường) | Phát hiện thiếu mã lỗi, thiếu cột `created_at`, 5 điểm nghiệp vụ chưa rõ khi viết openapi | `docs/handoff/OPEN_QUESTIONS.md` |
| 4 | Đổi nhánh mặc định của repo từ `main` sang `develop` | PR #9, #10, #12 gộp nhầm vào `main` | Cài đặt repo trên GitHub |

## 3. Việc chưa xong hoặc trễ

| # | Việc | Lý do | Hạn mới đề xuất | Ảnh hưởng tới ai |
| --- | --- | --- | --- | --- |
| 1 | Bản sạch khung NestJS (dòng husky kiểm backend theo Q11, định dạng lại 1 file test) chưa vào `develop` | PR #11 nhắm nhầm `main` nên bị đóng; sau PR #13 thì nhánh `trienw1-be-skeleton` conflict 1 file với `develop` | 13/10 (PR nhỏ từ `develop`) | Cả nhóm (hook husky), Hồng Anh (code BE) |
| 2 | Báo cáo tuần 1 | Chưa quen quy trình báo cáo tuần và skill `/team-report` | 12/10 | Sơn (chốt tuần) |
| 3 | Ma trận phân quyền (`docs/spec/permissions.md`) | Chờ Huy Trường khởi động, chưa phân chia phần của từng người | 15/10 | Sơn (route guard theo vai trò), Huy Trường (test quyền) |

## 4. Đang vướng, chờ ai

| # | Vướng gì | Chờ ai | Từ ngày | Cần trước ngày |
| --- | --- | --- | --- | --- |
| 1 | Q16: mã lỗi còn thiếu, `details` của 3 mã lỗi, cột `created_at` cho `orders`, `payments` | Hồng Anh | 08/10 | 13/10 |
| 2 | Q17: 5 điểm nghiệp vụ (quên mật khẩu không email, check-in gói chưa tới ngày, Staff xem đơn, IPN cho payment đã thay, hội viên tự chọn tiền mặt) | Huy Trường | 08/10 | 13/10 |
| 3 | Bảng `users`, `members` và Prisma để làm auth tuần 2 | Hồng Anh | 12/10 | 13/10 |
| 4 | Thêm 2 endpoint Q6, Q15 vào `docs/spec/api-v3.md` | Huy Trường | 08/10 | 16/10 |

## 5. Bàn giao

- **Đã gửi:** openapi v0.1 cho Sơn (`docs/api/openapi.yaml`, tóm tắt điểm FE cần biết trong `docs/api/CHANGELOG.md`); Sơn đã dùng để làm lớp API client (PR #14). Chưa viết file bàn giao trong `docs/handoff/handoffs/`.
- **Đã nhận:** Không.

## 6. Câu hỏi mở liên quan

Từ `docs/handoff/OPEN_QUESTIONS.md`:
- Q3 — Sơn hỏi Triển giao phần xác thực sớm — đã có trong openapi v0.1, đề nghị đóng.
- Q5 — Hosting staging có URL công khai cho IPN VNPay (Hồng Anh) — hạn 20/10.
- Q16 — mã lỗi, `details`, cột `created_at` (Hồng Anh) — hạn 13/10.
- Q17 — 5 điểm nghiệp vụ (Huy Trường) — hạn 13/10.

## 7. Đề xuất thay đổi kế hoạch, phạm vi, hợp đồng API

- Khóa nhánh `main` bằng Rulesets (chỉ admin gộp vào lúc nộp bài) để không gộp nhầm nữa. Cần Sơn đồng ý và ghi vào `CONTRIBUTING.md`.

## 8. Kế hoạch tuần 2

Từ dòng tuần 2 trong `docs/plan/be-plan.md`, cộng việc dồn ở mục 3.

| # | Việc | Hạn | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | PR nhỏ đưa dòng husky Q11 và bản định dạng lại vào `develop` | 13/10 | — |
| 2 | Auth: register (ACTIVATION_REQUIRED), login (khóa tạm sau 5 lần sai), logout, refresh (cookie HttpOnly + `token_version`), change-password | 14/10 | Bảng `users`, `members` (Hồng Anh, 13/10) |
| 3 | `GET /me`, `PATCH /me`; hàm kiểm sở hữu dùng chung; guard so `token_version` | 14/10 | Prisma (Hồng Anh) |
| 4 | Test Supertest cho auth và `/me` | 14/10 | Docker cho Testcontainers |
| 5 | openapi đủ 74 API (7 nhóm còn lại, 36 API); cập nhật các chỗ "Chưa chốt" | 16/10 | Trả lời Q16, Q17 |
| 6 | Sơ đồ tuần tự VNPay + IPN | 16/10 | — |
| 7 | Request mẫu Postman cho Huy Trường khi auth xong | 16/10 | Auth xong |
| 8 | Review PR gói, tài khoản của Hồng Anh | 16/10 | Hồng Anh mở PR |
| 9 | Ma trận phân quyền cùng Huy Trường | 15/10 | Huy Trường |

## 9. Ghi chú, bài học

- Tạo PR phải kiểm `base: develop`; nhánh mặc định của repo nên đặt là `develop` ngay từ đầu.
- Không tự merge PR của mình khi chưa có review, kể cả PR chỉ có tài liệu.
- Cần nhìn chuỗi phụ thuộc giữa các thành viên từ đầu tuần: phần database chưa có sẽ chặn auth tuần 2.
