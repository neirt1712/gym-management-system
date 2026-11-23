# Báo cáo tuần 1 — Trường Sơn (FE Lead)

| Mục | Nội dung |
| --- | --- |
| Tuần | 1 (Thứ Hai 05/10 – Chủ Nhật 11/10/2026) |
| Người báo cáo | Trường Sơn · FE Lead · tên file `tson` |
| Ngày viết | 12/10/2026 (viết trễ 1 ngày so với hạn Chủ Nhật 11/10) |
| Tự đánh giá | Trễ ít — 6/7 việc kế hoạch đã xong; việc còn lại (duyệt thiết kế) đang làm |

## 1. Việc đã xong so với kế hoạch tuần

Kế hoạch lấy từ dòng tuần 1 trong `docs/plan/fe-plan.md` và hạng mục 2, 8, 10 trong `docs/plan/preparation.md`.

| # | Việc trong kế hoạch | Hạn | Trạng thái | Bằng chứng (PR, commit, file) | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 1 | Repo FE (Vite, TS, ESLint, Prettier, AntD) | 07/10 | Xong | PR #4, commit `8bab749` | |
| 2 | husky + lint-staged | 07/10 | Xong | PR #4, `.husky/pre-commit` | Chỉ kiểm `frontend/` (Q11) |
| 3 | Router + layout 4 vai trò + route guard với `AuthApi` giả | 07/10 | Xong | PR #4 | |
| 4 | API client openapi-fetch + interceptor refresh; `gen:api` + Prism mock | từ 08/10 | Xong | PR #14, commit `fa28969` | Đăng nhập chỉ bằng SĐT (Q12); bản giả vẫn giữ qua `VITE_AUTH_MODE` (Q8) |
| 5 | Cùng Triển chốt `CONTRIBUTING.md` | 07/10 | Xong | Commit `b34baa3` (Q10), `260d244` (PR #8) | ADR 0002 chấp nhận 08/10 (`a4de275`) |
| 6 | `docs/design/fe-architecture.md` | 11/10 | Xong | File có trên `develop`; cập nhật trong PR #14 | |
| 7 | Duyệt Figma của Bằng | 08/10 | Đang làm | Nhánh `tsonw1-design-mock` (chưa commit, chưa PR) | Nhóm đổi từ Figma sang mock HTML làm bằng Claude Design; đã chốt bộ màu và hướng animation (UI-09, UI-10) nhưng chưa chốt toàn bộ thiết kế |

## 2. Việc ngoài kế hoạch đã làm

| # | Việc | Lý do | Bằng chứng |
| --- | --- | --- | --- |
| 1 | Cấu hình Claude Code chung và bộ cấu hình cá nhân cho 5 thành viên | Cả nhóm dùng Claude Code, cần cùng quy ước | Commit `284e4f1`; PR #8 (`1588df1`) |
| 2 | Skill báo cáo tuần, chốt tuần và công cụ xuất Word | Nhóm cần báo cáo tuần thống nhất | PR #5, PR #7 |
| 3 | Chốt các câu hỏi mở Q6, Q10–Q15, Q18, Q19; bản chốt tuần 1 | Sơn là người chốt | PR #6, `docs/reports/tuan-01/CHOT-TUAN-01.md` |
| 4 | Review openapi v0.1 của Triển (lint, sinh kiểu, chạy mock) | Hợp đồng chặn việc FE | PR #10 (nhận xét chưa đăng lên PR) |
| 5 | Cài skill `impeccable` (không hook) | Hỗ trợ thiết kế giao diện (Q18) | PR #15 |
| 6 | Thư mục thiết kế `docs/design/ui/`, skill `/fe-design-lock`, hướng dẫn component | Cần một nguồn chuẩn cho thiết kế (Q19) | PR #16 |
| 7 | Mock HTML 57 màn, rà qua impeccable, chốt bộ màu và animation (UI-09 → UI-14) | Thay cho Figma | Nhánh `tsonw1-design-mock`, **chưa commit** |
| 8 | Rà lại `OPEN_QUESTIONS.md` | File bị lệch sau nhiều lần sửa | Commit `5845df5` trên nhánh `tsonw1-open-questions`, **chưa có trên `develop`** |

## 3. Việc chưa xong hoặc trễ

| # | Việc | Lý do | Hạn mới đề xuất | Ảnh hưởng tới ai |
| --- | --- | --- | --- | --- |
| 1 | Duyệt và chốt thiết kế (hạn 08/10) | Nhóm đổi công cụ từ Figma sang mock HTML, bản đủ màn đến 10/10 mới có; còn thiếu ảnh thật | 14/10 | Bằng (`theme/tokens.ts`, component dùng chung), mọi màn FE tuần 2 |
| 2 | Báo cáo tuần 1 (hạn 11/10) | Ưu tiên hoàn thành mock thiết kế 57 màn trước, nên viết báo cáo sang Thứ Hai | 12/10 | Chốt tuần của cả nhóm |

## 4. Đang vướng, chờ ai

| # | Vướng gì | Chờ ai | Từ ngày | Cần trước ngày |
| --- | --- | --- | --- | --- |
| 1 | Endpoint nhóm Xác thực chạy thật để chuyển khỏi mock | Triển | 09/10 | 14/10 |
| 2 | openapi cho các nhóm chưa có (Gói hội viên, Thông báo, PT, Lịch PT…) | Triển | 08/10 | 16/10 |
| 3 | Mã lỗi mới và `created_at` (Q16) | Hồng Anh | — | 13/10 |
| 4 | 5 câu hỏi nghiệp vụ (Q17) | Huy Trường | — | 13/10 |
| 5 | Ảnh thật cho mock; `tokens.ts` và font theo bộ màu mới | Bằng, cả nhóm | 10/10 | 14/10 (cùng hạn chốt thiết kế) |

## 5. Bàn giao

- **Đã gửi:** lớp API client, `queryKeys`, kiểu sinh tự động, mock Prism cho Bằng — `docs/handoff/handoffs/api-client-tson-to-tbang.md` (PR #17).
- **Đã nhận:** openapi v0.1 (8 nhóm) và 4 sơ đồ trạng thái từ Triển (PR #10, #12).

## 6. Câu hỏi mở liên quan

Từ `docs/handoff/OPEN_QUESTIONS.md`: Q4 — bản thiết kế đầy đủ — đang làm · Q5 — staging — Hồng Anh, 20/10 · Q16 — mã lỗi, `created_at` — Hồng Anh, 13/10 · Q17 — 5 câu hỏi nghiệp vụ — Huy Trường, 13/10.

## 7. Đề xuất thay đổi kế hoạch, phạm vi, hợp đồng API

- Ghi vào kế hoạch FE việc đổi từ Figma sang mock HTML (`docs/design/ui/mock/`), và quy tắc UI-13: mock chỉ là demo, khi code lấy mock làm gốc và dùng `/impeccable`. Cần Bằng và Huy Trường biết.
- Các màn mới trong mock có chú thích endpoint chưa có trong openapi v0.1 (ví dụ danh sách giao dịch, lịch sử ra vào của hội viên): chưa đối chiếu, chưa tạo CR. Cần Triển xem khi viết openapi đủ (16/10).

## 8. Kế hoạch tuần 2

Từ dòng tuần 2 (12–18/10) trong `docs/plan/fe-plan.md`, cộng việc dồn ở mục 3.

| # | Việc | Hạn | Phụ thuộc |
| --- | --- | --- | --- |
| 1 | Commit và PR nhánh `tsonw1-design-mock`; push `tsonw1-open-questions` | 13/10 | Bằng, Huy Trường review |
| 2 | Chốt thiết kế, chạy `/fe-design-lock` | 14/10 | Ảnh thật; Bằng đổi `tokens.ts` |
| 3 | Màn đăng ký, đăng nhập, đăng xuất | 18/10 | Thiết kế đã chốt |
| 4 | Màn hồ sơ, đổi mật khẩu | 18/10 | openapi nhóm Hồ sơ (đã có v0.1) |
| 5 | Header + menu theo vai trò; trang 403/404 | 18/10 | |
| 6 | Chuyển nhóm Xác thực sang API thật | từ 14/10 | Triển (Auth API, 14/10) |
| 7 | Review PR của Bằng | cả tuần | |
| 8 | `/team-week-close xuat` cho tuần 1 | 12/10 | Báo cáo của 4 người còn lại |

## 9. Ghi chú, bài học

- Thiết kế phải chốt trước khi dựng màn; đổi công cụ giữa tuần làm trễ việc duyệt.
- Mọi quyết định ghi vào file ngay (`OPEN_QUESTIONS.md`, `quyet-dinh.md`), không để trong trò chuyện.
- Dùng `docs/design/ui/TIEP-TUC.md` để mở đoạn chat mới không phải kể lại, tiết kiệm token.
