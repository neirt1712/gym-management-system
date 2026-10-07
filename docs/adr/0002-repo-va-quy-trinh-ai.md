# ADR 0002: Một repo, nguồn tài liệu và quy trình làm việc với Claude Code

- **Trạng thái:** Đã chấp nhận ngày 08/10/2026 (Sơn chốt, cả nhóm xem qua PR; OPEN_QUESTIONS Q2).
- **Người viết:** Trường Sơn (FE Lead), Triển (BE Lead) · **Người duyệt:** cả nhóm
- **Lý do có ADR này:** prompt khởi tạo của FE Lead còn nhiều điểm mở. Có điểm dựa trên giả định về Claude Code chưa đúng với tài liệu hiện hành; kiểm tra tại code.claude.com ngày 06/10/2026.

## Quyết định

| # | Điểm còn mở | Quyết định | Vì sao |
| --- | --- | --- | --- |
| D1 | Một repo hay hai repo | **Một repo** `gym-management-system`, gồm `backend/`, `frontend/`, `docs/`, `tests/`. Câu "repo FE", "repo backend" trong phân công hiểu là khung từng thư mục | Hợp đồng API, tài liệu và code đổi cùng một PR; một `CLAUDE.md`; một CI; hợp với nhóm 5 người |
| D2 | Ba file xuất nguyên tab vào `docs/source/` | **Không dùng làm nguồn.** Nguồn là `docs/spec/` (use case, ERD, API, quyết định) và `docs/plan/` (kế hoạch). Muốn lưu bản xuất nguyên văn thì để ở `docs/archive/`, chỉ để tham khảo | File nhỏ, đúng chủ đề, Claude nạp ít ngữ cảnh hơn; không có hai bản cùng nội dung có thể lệch nhau |
| D3 | Thứ tự ưu tiên khi mâu thuẫn | Phạm vi: `docs/spec/use-cases-v3.md`, `erd-v3.md`, `api-v3.md` → Nghiệp vụ: `decisions.md` → Người, hạn: `docs/plan/*` → `docs/api/openapi.yaml` → code. Gặp mâu thuẫn thì ghi `docs/handoff/OPEN_QUESTIONS.md` và hỏi, không tự chọn | Giữ đúng ý prompt, đổi sang file thật |
| D4 | Lệnh tắt `.claude/commands/` | Dùng **skill** (`.claude/skills/<ten>/SKILL.md`). Commands vẫn chạy nhưng đã gộp vào skill, và skill có thêm frontmatter điều khiển ai được gọi | Đúng tài liệu hiện hành |
| D5 | Tên lệnh, chống trùng | Chung cả nhóm: `team-start`, `team-finish`, `team-handoff`, `team-api-cr`, `team-report` (báo cáo tuần cá nhân), `team-week-close` (tổng hợp tuần, bổ sung 07/10). Nhóm FE/BE: `fe-*`, `be-*`. Riêng Lead: `fe-lead-*`, `be-lead-*`. `/review-pr` thành `fe-lead-review`, `be-lead-review`; `/sync-contract` thành `fe-lead-contract` | Trùng tên thì skill cá nhân thắng skill dự án; có tiền tố thì không ai đè ai |
| D6 | Subagent | Một subagent chỉ đọc `spec-checker` (Read, Grep, Glob) đối chiếu code với spec và openapi; `team-finish` và skill review gọi nó | Việc rà soát chạy ngoài ngữ cảnh chính |
| D7 | Hook tự format sau khi sửa | **Không dùng hook Claude Code.** Thay bằng Prettier khi lưu (VS Code), husky + lint-staged trước commit, và CI | Hook cần bash/jq, dễ hỏng trên máy Windows; lint-staged chạy cho mọi người kể cả không dùng Claude |
| D8 | Quyền của Claude | `.claude/settings.json` chung: chặn đọc `.env`, cấm push và lệnh phá dữ liệu. `.claude/settings.local.json` cá nhân: giới hạn thư mục được sửa theo vai trò | Luật chung commit một lần; phạm vi cá nhân không ép lên người khác |
| D9 | Quy tắc từng vai trò | `docs/team/roles/<vai-tro>.md` (8 mục, commit chung). `CLAUDE.local.md` của mỗi người chỉ import file vai trò của mình và thêm thói quen cá nhân | Ai cũng thấy ranh giới của người khác; nội dung vai trò chỉ có một bản |
| D10 | Khoảng 40 file tài liệu khung | **Bộ gọn khoảng 15 file** (xem README). Tài liệu kiểm thử (test plan, test case, bug log) do Huy Trường tạo khi bắt đầu việc đó, không dựng khung rỗng | File rỗng làm Claude và người đọc tưởng đã có nội dung |
| D11 | Danh mục mã lỗi | Một file `docs/api/error-codes.md` (Hồng Anh). `openapi.yaml` và `frontend/src/lib/errors.ts` đi theo file này | Một nguồn duy nhất |
| D12 | FE làm gì trước 08/10 khi chưa có openapi | Dựng router, layout, guard với `AuthApi` giả (interface + bản giả). Có openapi v0.1 thì thay bằng client thật và Prism. **FE không tự viết hợp đồng thay Triển** | Không bịa API; không bị chặn |
| D13 | "Tuần hiện tại" ghi cứng trong prompt | Không ghi cứng; `fe-lead-week`, `be-lead-week` tính tuần từ ngày hệ thống (tuần 1 bắt đầu 05/10) | Không phải sửa prompt mỗi tuần |
| D14 | Tên component dùng chung | Theo tab Phân công: PageHeader, DataTable, FormModal, StatusTag, EmptyState, **ConfirmDialog**, cộng thêm **ErrorState** | Thống nhất một tên |
| D15 | Stack | Theo ADR 0001, đã chốt TypeScript ngày 06/10 | Một ngôn ngữ cho cả nhóm |
| D16 | Số điểm dừng trong phiên khởi tạo | 3 điểm dừng thay vì 6: sau khi đọc hiểu; sau khi dựng tài liệu và quy tắc; trước khi code việc tuần 1 | Phần lớn cấu hình đã có sẵn trong bộ này |

## Hệ quả

- Ai cũng chép cùng một bộ `repo/` vào repo. Mỗi người chỉ thêm `CLAUDE.local.md` và `settings.local.json` của mình.
- Đổi quy tắc vai trò thì sửa `docs/team/roles/*` qua PR, chủ vai trò duyệt.
- Nếu sau này cần hai repo, tách `frontend/` ra và đổi các đường dẫn `@docs/...` thành submodule hoặc bản sao. Hiện chưa cần.
