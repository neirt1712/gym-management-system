# 18 hạng mục chuẩn bị trước khi code

- **Ai sở hữu:** Huy Trường (theo dõi). Mỗi người tự cập nhật cột Tình trạng của hạng mục mình làm.
- **Nguồn:** mục 4 của tài liệu Tiến hành công việc (đã sửa hạn ngày 06/10 cho khớp tab Phân công).
- **Khi nào cập nhật:** khi xong một hạng mục; Huy Trường rà lại mỗi Thứ Hai.
- **Tình trạng:** Chưa / Đang làm / Xong / Bỏ (ghi lý do). Cột "FE phụ thuộc" đánh dấu hạng mục mà Sơn hoặc Bằng cần có trước.

| # | Hạng mục | Người làm | Hạn | Tình trạng | Ở đâu | FE phụ thuộc |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Quyết định công nghệ (ADR 0001) | Cả nhóm (Triển viết) | 07/10 | Xong (TypeScript, 06/10) | `docs/adr/0001-tech-stack.md` | Có |
| 2 | Quy ước code và Git | Triển, Sơn | 07/10 | Đang làm (nháp) | `CONTRIBUTING.md` | Có |
| 3 | Bảng công việc | Huy Trường | 06/10 | Chưa | GitHub Projects | |
| 4 | Tài liệu 2 v3 + tiêu chí chấp nhận | Huy Trường | 08/10 (nhóm demo), 25/10 | Đang làm | `docs/spec/use-cases-v3.md` + tiêu chí | Có |
| 5 | Bảng thuật ngữ | Huy Trường | 09/10 | Chưa | `docs/spec/glossary.md` | Có (chữ trên giao diện) |
| 6 | Ma trận phân quyền | Huy Trường, Triển | 09/10 | Chưa | `docs/spec/permissions.md` | Có (route guard) |
| 7 | Sơ đồ trạng thái | Triển | 09/10 | Đang làm (có code Mermaid) | `docs/design/state-diagrams.md` | Có |
| 8 | openapi.yaml + mock | Triển viết, Sơn dựng mock | 08/10 (v0.1), 16/10 (đủ) | Chưa | `docs/api/openapi.yaml` | **Chặn** |
| 9 | Danh mục mã lỗi + tham số cấu hình | Hồng Anh | 09/10 | Đang làm (bản nháp) | `docs/api/error-codes.md`, `backend/src/config/` | Có |
| 10 | Wireframe + sitemap + user flow | Bằng (Sơn duyệt) | 08/10 (màn demo), 25/10 | Chưa | Figma (link trong OPEN_QUESTIONS) | Có |
| 11 | Môi trường dev (docker-compose, .env.example) | Hồng Anh | 09/10 | Đang làm (đã có Postgres 15 + pgAdmin; còn MailHog, extension) | `docker-compose.yml` | Có |
| 12 | Migration + seed | Hồng Anh | 13/10 | Chưa | `backend/prisma/` | |
| 13 | Sơ đồ tuần tự luồng khó | Triển, Hồng Anh | 16/10 | Đang làm (có code Mermaid) | `docs/design/sequence-diagrams.md` | |
| 14 | Đặc tả job nền | Triển | 16/10 | Xong (trong quyết định 17) | `docs/spec/decisions.md` | |
| 15 | Yêu cầu phi chức năng | Triển | 16/10 | Đang làm (trong ADR 0001 và `.claude/rules/backend.md`) | `docs/adr/0001-tech-stack.md` | |
| 16 | Test plan | Huy Trường | 13/10 | Chưa | `tests/TEST_PLAN.md` | |
| 17 | CI + staging + sandbox VNPay | Hồng Anh | 27/10 (staging), 28/10 (CI) | Chưa | `.github/workflows/ci.yml` | Có |
| 18 | Nội dung thông báo | Huy Trường | 16/11 | Chưa | `docs/spec/notification-templates.md` | Có |
