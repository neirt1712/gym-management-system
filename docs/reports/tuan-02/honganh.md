# Báo cáo tuần 2 — Hồng Anh (BE Sub)

| Mục | Nội dung |
| --- | --- |
| Tuần | 2 (Thứ Hai 12/10 – Chủ Nhật 18/10/2026), gộp cả việc tuần 1 (05/10 – 11/10) vì tuần 1 chưa có báo cáo |
| Người báo cáo | Hồng Anh · BE Sub · tên file `honganh` |
| Ngày viết | 19/10/2026 |
| Tự đánh giá | Trễ nhiều — 8/10 việc kế hoạch đã xong code (đều xong ngày 18/10, trễ 2–9 ngày; PR đang chờ duyệt, chưa merge) |

## 1. Việc đã xong so với kế hoạch tuần

Kế hoạch lấy từ dòng tuần 1 và tuần 2, cột Hồng Anh, trong `docs/plan/be-plan.md`, và hạng mục 9, 11, 12, 13 trong `docs/plan/preparation.md`.

| # | Việc trong kế hoạch | Hạn | Trạng thái | Bằng chứng (PR, commit, file) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 1 | docker-compose: Postgres + btree_gist, unaccent, pg_trgm; MailHog | 09/10 | Xong (18/10) | PR #21, commit `9d4b19f`, `docker-compose.yml` | Postgres 16 theo ADR 0001; volume mới `pgdata16` |
| 2 | `.env.example` | 09/10 | Xong (18/10) | PR #21, `backend/.env.example` | Bỏ `.env.example` ở gốc vì compose mới không dùng |
| 3 | `schema.prisma` + migration 10 bảng đầu; unique có điều kiện bằng SQL | 09/10 | Xong (18/10) | PR #21, `backend/prisma/schema.prisma`, `prisma/sql/rules.sql` | Làm gộp với mục 5 trong một migration `init_18_tables` |
| 4 | Danh mục mã lỗi + config tham số | 09/10 | Xong (18/10) | PR #21 (`backend/src/config/business.config.ts`), PR #22 (`docs/api/error-codes.md`) | Thêm 3 mã theo Q16, Q21 |
| 5 | Migration 8 bảng còn lại + exclusion constraint | 13/10 | Xong (18/10) | PR #21 | 16 phép thử ràng buộc trên Postgres 16 thật đều đúng |
| 6 | Seed (1 admin, 2 staff, 3 PT, 30 hội viên, 5 gói) | 13/10 | Xong (18/10) | PR #21, `backend/prisma/seed.ts` | Chạy lại không sinh trùng; giá gói là số demo |
| 7 | packages CRUD (audit trước/sau, benefits) | 16/10 | Xong (18/10) | PR #23, commit `4cb5a81` | 4 endpoint UC07, UC08; 20 ca test e2e |
| 8 | users: list, detail, POST (kèm hồ sơ PT), PATCH, status (tăng token_version), role (chặn MEMBER) | 16/10 | Chưa | | Xem mục 3 |
| 9 | Hàm audit dùng chung | 16/10 | Xong (18/10) | PR #23, `backend/src/common/audit/` | Đặt trong `common/` (thư mục của Triển), ghi rõ trong PR để Triển duyệt |
| 10 | Sơ đồ tuần tự luồng khó (cùng Triển) | 16/10 | Chưa | `docs/design/sequence-diagrams.md` | Triển đã vẽ 4 luồng (mua gói, VNPay + IPN, lịch PT, kích hoạt tài khoản); phần của Hồng Anh chưa có, xem mục 7 |

## 2. Việc ngoài kế hoạch đã làm

| # | Việc | Lý do | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Cài môi trường máy: Node.js 20, Docker Desktop, WSL2 | Máy chưa có, không chạy được DB và backend | Ngày 18/10 |
| 2 | 4 endpoint hội viên UC19, UC20, UC28 (việc tuần 3, hạn 21/10, làm sớm) | Màn quầy và mua hộ cho demo 30/10 cần | PR #24, commit `6835f2f`; 18 ca test e2e, có 2 ca gửi song song |
| 3 | Chốt Q5 hosting staging: Render + Neon | Câu hỏi giao cho Hồng Anh, hạn 20/10 | PR #22, commit `2820622` |
| 4 | Sửa `JwtAuthGuard`: route `@Public()` có token hợp lệ vẫn biết người gọi | `GET /packages` cần cho Admin thấy cả gói ngừng bán | PR #23 (Triển duyệt) |
| 5 | DB test riêng `gym_test`; `test:e2e` chạy `--runInBand` | Test tích hợp không đụng DB dev; các file test dùng chung một DB | PR #23, PR #24 |

## 3. Việc chưa xong hoặc trễ

| # | Việc | Lý do | Hạn mới đề xuất | Ảnh hưởng tới ai |
| --- | --- | --- | --- | --- |
| 1 | DB 18 bảng, seed, gói, audit (mục 1–7, 9 ở trên): xong code nhưng trễ 5–9 ngày | Máy chưa cài môi trường (Node, Docker, WSL2) tới 18/10; chưa nắm Prisma, NestJS; bận môn khác và thi; bộ kit nhận 09/10 chưa đưa vào repo, phải chờ bộ mới | Đã xong 18/10; cần merge trước 20/10 | Triển (Auth và việc tuần 3 bị chặn bởi schema `users`, `members`) |
| 2 | 6 endpoint `users` (UC31–UC35) | Như trên; ưu tiên gói, hội viên cho demo trước | 25/10, hoặc tuần 4 nếu họp đồng ý (demo dùng tài khoản seed) | Bằng, Sơn (màn Admin tài khoản) |
| 3 | Sơ đồ tuần tự phần của Hồng Anh | Chưa rõ cần vẽ luồng nào | 25/10, sau khi Triển xác nhận | Huy Trường (tài liệu) |

## 4. Đang vướng, chờ ai

| # | Vướng gì | Chờ ai | Từ ngày | Cần trước ngày |
| --- | --- | --- | --- | --- |
| 1 | Duyệt và merge PR #21 (DB), #22 (mã lỗi, Q5), #23 (gói, sửa `common/`), #24 (hội viên); merge theo thứ tự #21 → #23 → #24 | Triển | 18/10 | 20/10 |
| 2 | Q17(b): check-in khi gói chưa tới ngày bắt đầu báo lỗi gì; gói PT có được vào phòng tự do không | Huy Trường | 08/10 | 22/10 (check-in hạn 23/10) |
| 3 | `qrToken` trong `GET /me` và `POST /me/qr-token/regenerate` (module `me` của Triển) | Triển | 18/10 | 23/10 |
| 4 | Chốt email có phân biệt hoa thường không (dùng chung cho Auth và hội viên) | Triển | 18/10 | 25/10 |

## 5. Bàn giao

- **Đã gửi:**
  - Cả nhóm: DB 18 bảng và tài khoản seed cho 4 vai trò (admin `0900000001`, staff `0900000011`, PT `0900000021`, hội viên `0910000001`–`0910000030`; mật khẩu nhắn riêng), qua PR #21.
  - Sơn, Bằng: 4 endpoint gói (PR #23) và 4 endpoint hội viên (PR #24), dùng được khi PR merge. Chưa viết file trong `docs/handoff/handoffs/`.
- **Đã nhận:**
  - Bộ `ha-kit-w3` (schema 18 bảng, rules.sql, seed) từ Claude web.
  - Helper `common/ownership` của Triển.

## 6. Câu hỏi mở liên quan

Từ `docs/handoff/OPEN_QUESTIONS.md`:

- **Q5:** hosting staging. Hồng Anh trả lời 18/10 (Render + Neon), nằm trong PR #22.
- **Q16:** ý 2, 3, 4 đã trả lời; ý 1 (quên mật khẩu khi tài khoản không có email) chờ Q17(a).
- **Q17:** (a) quên mật khẩu; (b) check-in trước ngày bắt đầu gói. Hỏi Huy Trường, hạn 13/10, đã quá hạn.
- **Q20:** (b) mở lại gói bảo lưu sớm; (g) người nhận thông báo chủ động. Hạn 26/10.
- **Q21:** đã trả lời 18/10 (PR #22).

## 7. Đề xuất thay đổi kế hoạch, phạm vi, hợp đồng API

- Dời 6 endpoint `users` sang 24–25/10, hoặc sang tuần 4. Lý do: demo 30/10 cần gói → hội viên → check-in → staging trước; demo dùng tài khoản seed. Cần Huy Trường duyệt.
- `AuditService` đặt ở `common/audit/` và guard cho route `@Public()` nhận diện người gọi: cần Triển duyệt trong PR #23. Nếu đồng ý thì sửa `.claude/rules/backend.md` cho khớp chữ ký `AuditService.log(tx, entry)`.
- Nhờ Triển xác nhận còn cần vẽ sơ đồ tuần tự nào. Gợi ý: check-in và bảo lưu.
- Test e2e đang dùng Postgres local (`gym_test`), chưa dùng Testcontainers. Khi làm CI (27/10) sẽ dùng service Postgres của GitHub Actions.

## 8. Kế hoạch tuần 3

Từ dòng tuần 3, cột Hồng Anh, trong `docs/plan/be-plan.md`, cộng việc dồn ở mục 3.

| # | Việc | Hạn | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | Sửa PR #21–#24 theo góp ý review cho tới khi merge | 20/10 | Triển duyệt |
| 2 | `POST /check-ins` (chọn gói hết hạn sớm nhất, 5 mã lỗi, cảnh báo ≤ 7 ngày), checkout SELF/STAFF, `GET /check-ins?present=true`, job 23:59 | 23/10 | Q17(b) (Huy Trường); PR #21 merge |
| 3 | `qrToken` trong `/me` + tạo lại mã QR | 23/10 | Triển (module `me`) |
| 4 | 6 endpoint `users` (dồn từ tuần 2) | 25/10 (hoặc tuần 4) | Họp duyệt mục 7 |
| 5 | Sơ đồ tuần tự phần của Hồng Anh (dồn từ tuần 2) | 25/10 | Triển xác nhận luồng |
| 6 | Chuẩn bị staging Render + Neon và GitHub Actions (lint, test) | 27/10 (tuần 4) | Q5 đã chốt |

## 9. Ghi chú, bài học

- Nên kiểm môi trường máy (Node, Docker) ngay tuần đầu. Thiếu môi trường làm mọi việc DB dồn tới cuối tuần 2.
- Đối chiếu spec bằng subagent `spec-checker` trước PR bắt được 2 lỗi thật: gửi `null` ra 500, và trùng SĐT khi hai yêu cầu đến cùng lúc thì thiếu `memberId`.
- Test e2e chạy trên DB riêng `gym_test`, không đụng dữ liệu dev; ràng buộc DB phải test bằng Postgres thật.
