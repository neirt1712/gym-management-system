# Vai trò: BE Lead — Triển

Chủ vai trò duyệt file này. Sửa qua PR.

## 1. Phạm vi sở hữu
- `backend/src/common/` (format lỗi, guard, kiểm sở hữu, audit, time).
- Modules: auth, me, orders, payments (VNPay, IPN), subscriptions (đọc, số buổi theo tháng), appointments, classes, reports.
- `docs/api/openapi.yaml`, `docs/api/CHANGELOG.md`, `docs/adr/`, `docs/plan/be-plan.md`, cột "openapi" trong `CONTRACT_STATUS.md`, sơ đồ trạng thái và tuần tự trong `docs/design/`.
- Đồng sở hữu với Sơn: `CONTRIBUTING.md`.

## 2. Không được sửa
- `frontend/`, `docs/spec/` (chỉ đọc; đổi spec phải qua họp).
- `backend/prisma/`, `docker-compose.yml`, CI, module của Hồng Anh: viết đề xuất (`/be-schema-change`) hoặc patch.

## 3. Đầu vào phải đọc
- Huy Trường: `docs/spec/*`, tiêu chí chấp nhận, bug.
- Hồng Anh: `schema.prisma`, `docs/api/error-codes.md`.
- Sơn: CR trong `docs/handoff/api-change-requests/`.

## 4. Đầu ra phải bàn giao
| Cho ai | Cái gì | Hạn |
| --- | --- | --- |
| Cả nhóm | ADR 0001 | 07/10 |
| Sơn | openapi v0.1 (xác thực, hồ sơ, gói, đơn, thanh toán, check-in, hội viên, tài khoản) | 08/10 |
| Sơn | openapi đủ 74 API | 16/10 |
| Sơn | Endpoint Real theo hạn trong `CONTRACT_STATUS.md` | theo tuần |
| Huy Trường | Request mẫu cho Postman khi endpoint xong | theo tuần |

## 5. Checklist trước PR
Definition of Done + `/be-check` + `/team-finish`. Đổi API thì PR có sửa yaml, CHANGELOG và tin báo Sơn (`/be-lead-contract`).

## 6. Quy ước kỹ thuật riêng
Xem `backend/CLAUDE.md` và `.claude/rules/backend.md`. Riêng: lịch PT, kích hoạt gói, IPN luôn có test song song và test IPN gửi lặp.

## 7. Lệnh và skill thường dùng
- Lệnh: `npm run start:dev`, `test`, `test:e2e`, `npx @redocly/cli lint docs/api/openapi.yaml`.
- Skill: `/team-*`, `/be-endpoint`, `/be-schema-change`, `/be-check`, `/be-lead-week`, `/be-lead-review`, `/be-lead-contract`.

## 8. Khi bị kẹt thì hỏi ai
DB, hạ tầng: Hồng Anh · nhu cầu màn hình: Sơn · phạm vi, nghiệp vụ: Huy Trường.
