# Vai trò: FE Sub — Thanh Bằng

Chủ vai trò duyệt file này. Sửa qua PR.

## 1. Phạm vi sở hữu
- `frontend/src/theme/` (token, trạng thái), `frontend/src/components/`: PageHeader, DataTable, FormModal, StatusTag, EmptyState, ErrorState, ConfirmDialog.
- `frontend/src/features/`: packages-admin, users-admin, staff-counter, check-in, trainer-members, availability, classes-admin, notifications, reports.
- `frontend/src/pages/`: danh mục gói công khai, staff, admin, các trang PT trừ lịch.
- Figma: wireframe, sitemap, user flow; tài liệu thiết kế trong `docs/design/ui/` (brief, theo dõi màn, ảnh, nhật ký quyết định). Sơn duyệt và chốt (Q19).

## 2. Không được sửa
- `backend/`, `docs/` (chỉ đọc), trừ `docs/design/ui/`, `docs/handoff/`, `docs/reports/`.
- `frontend/src/app/`, `frontend/src/api/` và màn của Sơn: đưa patch để Sơn gắn.
- Không tự tạo API client, kiểu dữ liệu, `PurchaseFlow`, `AppointmentCard`, `ProposalTimeline` riêng; dùng bản Sơn cung cấp.

## 3. Đầu vào phải đọc
- Sơn: `api/client.ts`, `queryKeys.ts`, `schema.d.ts`, bàn giao trong `docs/handoff/handoffs/`.
- Hồng Anh: `docs/api/error-codes.md`.
- Huy Trường: `docs/spec/*`, tiêu chí chấp nhận.

## 4. Đầu ra phải bàn giao
| Cho ai | Cái gì |
| --- | --- |
| Sơn | Figma màn demo (08/10), toàn bộ màn (25/10); token và component (09/10) kèm cách dùng |
| Huy Trường | Màn đã Real để test; kịch bản Playwright luồng quầy (tuần 8) |

## 5. Checklist trước PR
Definition of Done + `/fe-ui-check` + `/team-finish`. Sửa `theme/` hoặc `components/` thì liệt kê màn bị ảnh hưởng trong PR.

## 6. Quy ước kỹ thuật riêng
- Token là nguồn duy nhất của màu và khoảng cách; muốn đổi giá trị phải cả hai đồng ý.
- Component dùng chung: props có kiểu rõ, có ví dụ dùng trong comment đầu file, không gọi API bên trong.
- Màn quầy ưu tiên thao tác nhanh: ô tìm kiếm tự focus, Enter để check-in, kết quả hiển thị lớn.

## 7. Lệnh và skill thường dùng
- Lệnh: `npm run dev`, `dev:mock`, `lint`, `typecheck`, `test`.
- Skill: `/team-start`, `/team-finish`, `/team-handoff`, `/team-api-cr`, `/fe-screen`, `/fe-api-hook`, `/fe-ui-check`.

## 8. Khi bị kẹt thì hỏi ai
Kiến trúc FE, API: Sơn (Sơn hỏi Triển) · phạm vi, hạn: Huy Trường.
