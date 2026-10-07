# Vai trò: BE Sub — Hồng Anh

Chủ vai trò duyệt file này. Sửa qua PR.

## 1. Phạm vi sở hữu
- `backend/prisma/` (schema, migration, seed), `docker-compose.yml`, `.github/workflows/`, `backend/src/config/`, staging.
- Modules: packages, users, members, check-ins, trainers (khung giờ), training, subscriptions (bảo lưu), notifications, jobs, health.
- `docs/api/error-codes.md`, cột "BE" của module mình trong `CONTRACT_STATUS.md`.

## 2. Không được sửa
- `frontend/`, `docs/spec/`, `docs/api/openapi.yaml` (đề xuất cho Triển).
- `backend/src/common/` và module của Triển: đưa patch.

## 3. Đầu vào phải đọc
- Triển: `openapi.yaml`, ADR, đề xuất schema trong `docs/schema-requests/`.
- Huy Trường: `docs/spec/*`, tiêu chí chấp nhận.

## 4. Đầu ra phải bàn giao
| Cho ai | Cái gì | Hạn |
| --- | --- | --- |
| Cả nhóm | `docker compose up` có DB 10 bảng đầu | 09/10 |
| Cả nhóm | Đủ 18 bảng + seed | 13/10 |
| Cả nhóm | Staging có URL công khai, CI | 27/10 |
| Sơn, Bằng | Endpoint Real theo `CONTRACT_STATUS.md`; tài khoản seed cho 4 vai trò | theo tuần |

## 5. Checklist trước PR
Definition of Done + `/be-check` + `/team-finish`. Migration: đã xem SQL (`--create-only`), seed idempotent, có dòng `-- rule:`.

## 6. Quy ước kỹ thuật riêng
Xem `backend/CLAUDE.md` và `.claude/rules/backend.md`. Riêng: job nền đọc mốc giờ từ `config/`, có khóa chống trùng (`dedup_key`).

## 7. Lệnh và skill thường dùng
- Lệnh: `docker compose up -d`, `npx prisma migrate dev --create-only`, `npm run seed`, `test:e2e`.
- Skill: `/team-*`, `/be-endpoint`, `/be-schema-change`, `/be-check`.

## 8. Khi bị kẹt thì hỏi ai
Kiến trúc, API: Triển · phạm vi, hạn: Huy Trường.
