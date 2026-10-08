# Cấu hình Claude Code cá nhân cho từng thành viên

Mỗi thư mục là bộ file cá nhân của một người. Chép một lần khi bắt đầu, hoặc khi file mẫu ở đây được cập nhật (PR sẽ báo).

| File | Chép tới | Để làm gì |
| --- | --- | --- |
| `CLAUDE.local.md` | gốc repo | "Thẻ tên": Claude biết bạn là ai và nạp file vai trò `docs/team/roles/<vai-tro>.md` (phạm vi, việc phải làm, phải bàn giao) |
| `settings.local.json` | `.claude/settings.local.json` | "Khóa cửa": cho phép sửa thư mục của bạn, hỏi trước khi sửa thư mục dùng chung, chặn thư mục của người khác |
| `skills/*` (chỉ Lead) | `~/.claude/skills/` (thư mục người dùng, ví dụ `C:\Users\<tên>\.claude\skills\`) | Skill riêng: `fe-lead-*` của Sơn, `be-lead-*` của Triển |

Hai file đầu đã có trong `.gitignore` ở vị trí đích, nên bản chép ra không bị commit. Muốn sửa luật chung cho vai trò thì sửa file mẫu ở đây qua PR (chủ vai trò duyệt), rồi chép lại.

| Người | Thư mục | File vai trò |
| --- | --- | --- |
| Triển (BE Lead) | `trien/` | `docs/team/roles/be-lead.md` |
| Hồng Anh (BE Sub) | `honganh/` | `docs/team/roles/be-sub.md` |
| Trường Sơn (FE Lead) | `tson/` | `docs/team/roles/fe-lead.md` |
| Thanh Bằng (FE Sub) | `tbang/` | `docs/team/roles/fe-sub.md` |
| Huy Trường (PM) | `htruong/` | `docs/team/roles/pm.md` |

## Cách chép (nói với Claude Code)

> Chép `docs/team/claude-local/<tên>/CLAUDE.local.md` ra gốc repo và `docs/team/claude-local/<tên>/settings.local.json` thành `.claude/settings.local.json`. Nếu có thư mục `skills`, chép các skill trong đó vào thư mục skill người dùng `~/.claude/skills/`. Sau đó nhắc tôi đóng và mở lại Claude Code.

Claude sẽ hỏi quyền vì `.claude/` là thư mục được bảo vệ; bấm cho phép. Mở lại Claude Code để luật mới có hiệu lực, rồi gõ `/permissions` để xem.

## Luật trong `settings.local.json`

- Thứ tự áp dụng: **chặn (deny) > hỏi (ask) > cho phép (allow)**. Luật chung của cả nhóm ở `.claude/settings.json` (chặn đọc `.env`, cấm push, hỏi trước khi commit, cài thư viện, sửa `docs/spec/`, `.claude/`, `CLAUDE.md`) luôn áp dụng thêm.
- Thư mục không có trong danh sách: Claude hỏi trước khi sửa.
- Mỗi người tự xem lại file của mình khi review PR: chặn sai thì vướng việc, chặn thiếu thì không có tác dụng.
