# Vai trò: FE Lead — Trường Sơn

Chủ vai trò duyệt file này. Sửa qua PR.

## 1. Phạm vi sở hữu
- `frontend/src/app/` (router, layout, guard, providers), `frontend/src/api/` (client, `queryKeys.ts`; `schema.d.ts` sinh tự động).
- `frontend/src/features/`: auth, profile, purchase, subscriptions, appointments, classes-member. `frontend/src/pages/`: public (trừ danh mục gói), member, lịch của PT.
- Cấu hình FE: `frontend/package.json`, Vite, ESLint, Prettier, husky/lint-staged, Vitest.
- `docs/design/fe-architecture.md`, `docs/plan/fe-plan.md`, cột FE trong `docs/handoff/CONTRACT_STATUS.md`.
- Đồng sở hữu với Triển: `CONTRIBUTING.md`, `docs/adr/0002-*`.

## 2. Không được sửa
- `backend/`, `docs/spec/`, `docs/api/openapi.yaml`, `docs/api/error-codes.md`, `tests/` (chỉ đọc; thấy lỗi thì soạn tin hoặc CR).
- `frontend/src/theme/`, `frontend/src/components/` và màn của Bằng: chỉ đề xuất hoặc đưa patch, trừ khi Bằng đồng ý.

## 3. Đầu vào phải đọc
| Từ ai | File |
| --- | --- |
| Triển | `docs/api/openapi.yaml`, `docs/api/CHANGELOG.md`, `docs/handoff/CONTRACT_STATUS.md` |
| Hồng Anh | `docs/api/error-codes.md`, URL staging |
| Bằng | Figma (link trong `OPEN_QUESTIONS.md`), `frontend/src/theme/*`, `components/` |
| Huy Trường | `docs/spec/*`, tiêu chí chấp nhận, bug trên GitHub Issues |

## 4. Đầu ra phải bàn giao
| Cho ai | Cái gì | Mẫu / nơi |
| --- | --- | --- |
| Bằng | API client, `queryKeys`, kiểu sinh tự động, mock chạy được; component `PurchaseFlow` (23/10), `AppointmentCard` + `ProposalTimeline` (06/11) | `docs/handoff/handoffs/*` (`/team-handoff`) |
| Triển | CR khi API lệch | `docs/handoff/api-change-requests/` (`/team-api-cr`) |
| Huy Trường | Màn đã Real để test; 2 kịch bản Playwright luồng hội viên (tuần 8) | `STATUS.md`; `tests/e2e/` (qua PR, Huy Trường duyệt) |

## 5. Checklist trước PR
Definition of Done (`docs/process/dor-dod.md`) + `/fe-ui-check` + `/team-finish`.

## 6. Quy ước kỹ thuật riêng
- Chỉ một nơi gọi API (`api/client.ts`). Access token chỉ ở bộ nhớ. Interceptor refresh một lần cho nhiều 401.
- Trang kết quả VNPay chỉ đọc `GET /orders/{id}` (polling 3 giây, tối đa 60 giây); không tự đánh dấu đã trả.
- Lịch PT: nút theo `allowedActions`, gửi `expectedVersion`, gặp `STALE_VERSION` thì tải lại và báo người dùng.
- Khóa nút khi đang gửi với mọi thao tác tạo đơn, thanh toán, accept, complete.

## 7. Lệnh và skill thường dùng
- Lệnh: `npm run dev`, `dev:mock`, `gen:api`, `lint`, `typecheck`, `test`, `build`.
- Skill: `/team-start`, `/team-finish`, `/team-handoff`, `/team-api-cr`, `/fe-screen`, `/fe-api-hook`, `/fe-ui-check`, `/fe-lead-week`, `/fe-lead-review`, `/fe-lead-contract`.

## 8. Khi bị kẹt thì hỏi ai
API, hợp đồng: Triển · DB, staging, mã lỗi: Hồng Anh · giao diện, component: Bằng · phạm vi, tiêu chí chấp nhận, hạn: Huy Trường.
