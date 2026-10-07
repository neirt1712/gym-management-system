# Hệ thống quản lý phòng gym — ngữ cảnh dự án

Đồ án môn học của nhóm 5 người, 10 tuần (05/10 – 13/12/2026), một repo (ADR 0002).
Mốc: demo lần 1 30–31/10 · đóng chức năng 30/11 · đóng băng staging 09/12 · nộp bài 12/12.
Tuần hiện tại: tính từ ngày hôm nay, tuần 1 bắt đầu Thứ Hai 05/10/2026.

## Nguồn sự thật (đọc file, không đoán)

Thứ tự ưu tiên khi mâu thuẫn, từ cao xuống:
1. **Phạm vi:** `docs/spec/use-cases-v3.md` (44 UC), `docs/spec/erd-v3.md` (18 bảng), `docs/spec/api-v3.md` (74 API)
2. **Nghiệp vụ:** `docs/spec/decisions.md` (19 quyết định)
3. **Người, hạn, phụ thuộc:** `docs/plan/fe-plan.md`, `docs/plan/be-plan.md`
4. **Hợp đồng chi tiết:** `docs/api/openapi.yaml`, `docs/api/error-codes.md`
5. Code

Gặp mâu thuẫn hoặc thiếu thông tin: **không tự chọn**. Ghi vào `docs/handoff/OPEN_QUESTIONS.md` rồi hỏi người dùng.
Không chép nội dung spec vào CLAUDE.md, rule hay skill; trỏ tới file gốc.

Tài liệu khác:
- Quyết định kiến trúc: `docs/adr/`.
- Vai trò: `docs/team/roles/`.
- Quy trình: `CONTRIBUTING.md`, `docs/process/dor-dod.md`.
- Thiết kế: `docs/design/`.
- Trạng thái và bàn giao: `docs/handoff/`.

## Thành viên

| Người | Vai trò | File vai trò |
| --- | --- | --- |
| Triển | BE Lead | `docs/team/roles/be-lead.md` |
| Hồng Anh | BE Sub | `docs/team/roles/be-sub.md` |
| Trường Sơn | FE Lead | `docs/team/roles/fe-lead.md` |
| Thanh Bằng | FE Sub | `docs/team/roles/fe-sub.md` |
| Huy Trường | PM | `docs/team/roles/pm.md` |

- Cặp review chéo: Triển ↔ Hồng Anh, Sơn ↔ Bằng.
- Người đang dùng Claude khai vai trò trong `CLAUDE.local.md` (không commit), và file đó import file vai trò của họ.
- Chỉ sửa trong phạm vi vai trò. Việc ngoài phạm vi thì đề xuất, tạo CR hoặc đưa patch; không sửa thẳng.

## Kiến trúc (ADR 0001, đã chốt 06/10: TypeScript)

- `backend/`: NestJS 10, Prisma, PostgreSQL 15+.
- `frontend/`: React 18 + Vite + TypeScript, Ant Design, TanStack Query.
- `docs/`, `tests/api/` (Postman/Newman), `tests/e2e/` (Playwright), `docker-compose.yml`.
- Không đổi ngôn ngữ hay framework nếu không có ADR mới.

## Luật chung

- API:
  - base `/api/v1`, JSON camelCase;
  - danh sách trả `{data, meta}`;
  - lỗi trả `{error:{code,message,details,requestId}}`; xử lý theo `error.code`;
  - tiền là số nguyên VND; giờ theo ISO 8601 +07:00.
- Contract-first: đổi API thì Triển sửa `openapi.yaml` trước. Ai phát hiện lệch thì tạo CR (`/team-api-cr`). Không code theo CR chưa duyệt.
- Không bịa endpoint, field, mã lỗi, màn hình hay quy tắc. Không có trong tài liệu nghĩa là chưa tồn tại.
- Ngoài phạm vi, không tự làm: nâng cấp gói, mã giảm giá, điểm thưởng, hoàn tiền, SMS, hóa đơn điện tử, đánh giá PT, lớp lặp tuần, màn xem audit log.
- Git theo `CONTRIBUTING.md`:
  - nhánh `<ten>w<tuan>-<mo-ta>` (ví dụ `tsonw1-fe-scaffold`);
  - Conventional Commits có mã UC;
  - PR vào `develop`, 1 review, CI xanh.
- Không bao giờ: đọc hay commit `.env`, push, `--force`, xóa hàng loạt, tắt lint hay test để cho qua.
- Hỏi trước khi: thêm thư viện, đổi cấu trúc thư mục, đổi cấu hình build, làm việc ảnh hưởng người khác.

## Cách làm một task với Claude

1. `/team-start`: đọc vai trò, `docs/handoff/STATUS.md`, UC, API, bảng; kiểm Definition of Ready; lập kế hoạch ngắn. Task lớn hơn một file thì chờ duyệt.
2. Làm nhỏ, mỗi task một nhánh, một PR.
3. `/team-finish`:
   - chạy lint, typecheck, test, build (báo kết quả thật);
   - đối chiếu spec qua subagent `spec-checker`;
   - cập nhật `STATUS.md` và `CONTRACT_STATUS.md`;
   - soạn commit và PR.
4. Người khác phụ thuộc thì chạy `/team-handoff`. Đổi task thì `/clear`. Mọi thứ quan trọng phải nằm trong file, không chỉ trong trò chuyện.
5. Trả lời tiếng Việt, ngắn. Có lựa chọn thì đưa tối đa 3 phương án và khuyến nghị một. Báo cáo cuối: Đã làm · File thay đổi · Cách kiểm tra · Rủi ro và giả định · Cần ai làm tiếp.

## Skill (tên có tiền tố, không trùng nhau)

| Tiền tố | Ai dùng | Skill |
| --- | --- | --- |
| `team-` | Cả nhóm | `team-start`, `team-finish`, `team-handoff`, `team-api-cr` |
| `fe-` | Sơn, Bằng | `fe-screen`, `fe-api-hook`, `fe-ui-check` |
| `be-` | Triển, Hồng Anh | `be-endpoint`, `be-schema-change`, `be-check` |
| `fe-lead-` | Chỉ Sơn (máy cá nhân) | `fe-lead-week`, `fe-lead-review`, `fe-lead-contract` |
| `be-lead-` | Chỉ Triển (máy cá nhân) | `be-lead-week`, `be-lead-review`, `be-lead-contract` |
| `pm-` | Huy Trường (để dành) | |
