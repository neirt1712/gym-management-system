# Frontend — quy ước chung của Sơn và Bằng

File này giữ cho hai người code ra cùng một kiểu. Phần giao diện (vibe) nằm ở `.claude/rules/frontend-ui.md`. Nguồn token và trạng thái nằm trong code: `src/theme/tokens.ts`, `src/theme/status.ts`.

## Stack

React 18, Vite, TypeScript strict, React Router 6, TanStack Query 5, Ant Design 5, dayjs (timezone `Asia/Ho_Chi_Minh`), FullCalendar, html5-qrcode, qrcode.react, Recharts. Test: Vitest + React Testing Library; E2E ở `../tests/e2e` (Playwright).
Không thêm thư viện mới khi chưa hỏi FE Lead (Sơn).

## Lệnh

- `npm run dev` — chạy với API thật (`VITE_API_URL`)
- `npm run dev:mock` — chạy với mock Prism từ `../docs/api/openapi.yaml`
- `npm run gen:api` — sinh `src/api/schema.d.ts` từ openapi.yaml. Không sửa tay file này.
- `npm run lint`, `npm run typecheck`, `npm run test -- <đường dẫn>`

## Cấu trúc thư mục

```
src/
  app/                router, providers, layout theo vai trò (Sơn)
  api/                client.ts, schema.d.ts (sinh tự động), queryKeys.ts (Sơn)
  theme/              tokens.ts, status.ts (Bằng; muốn đổi phải cả hai đồng ý)
  components/         component dùng chung: PageHeader, DataTable, FormModal,
                      StatusTag, EmptyState, ErrorState, ConfirmDialog (Bằng)
  lib/                format.ts, errors.ts, dates.ts (dùng chung)
  features/<domain>/  api.ts (hook), components/, hooks/ của từng nghiệp vụ
  pages/<role>/       public | member | trainer | staff | admin
```

## Ai sở hữu gì (sửa ngoài phạm vi thì báo người kia trước)

| Sơn (FE Lead) | Bằng (FE Sub) |
| --- | --- |
| `app/`, `api/` | `theme/`, `components/` |
| `features/`: auth, profile, purchase, subscriptions, appointments, classes-member | `features/`: packages-admin, users-admin, staff-counter, check-in, trainer-members, availability, classes-admin, notifications, reports |
| `pages/public/*`, `pages/member/*`, lịch của PT (`pages/trainer/Schedule*`) | `pages/staff/*`, `pages/admin/*`, các trang PT còn lại |

## Cách viết code

- Gọi API chỉ qua hook trong `features/<domain>/api.ts` (TanStack Query). Component không gọi `fetch`/`client` trực tiếp.
- Query key lấy từ `api/queryKeys.ts`, dạng `['appointments', params]`. Mutation xong thì invalidate đúng key.
- Kiểu dữ liệu lấy từ `schema.d.ts` (`components['schemas']['Appointment']`). Không tự định nghĩa lại kiểu của API.
- Lỗi: dùng `getErrorMessage(err)` trong `lib/errors.ts` (map theo `error.code`, chép từ `docs/api/error-codes.md`); hiện `getRequestId(err)` bằng chữ nhỏ trong phần chi tiết lỗi. Mã chưa có trong danh mục thì tạo CR, không tự đặt câu.
- Quyền:
  - Route chặn theo vai trò.
  - Trong màn hình, hiện nút theo `allowedActions` do BE trả về. Không tự suy luận quyền ở FE.
- Mỗi trang xử lý đủ 4 trạng thái: đang tải (Skeleton), rỗng (EmptyState), lỗi (ErrorState có nút Thử lại), không có quyền (403).
- Hành động lặp hoặc tốn tiền (tạo đơn, thanh toán, check-in, accept): khóa nút khi đang gửi (`loading`), không cho bấm hai lần.
- Ngày giờ và tiền: dùng `formatDate`, `formatDateTime`, `formatTimeRange`, `formatVND` trong `lib/format.ts`.
- Nhãn và màu trạng thái lấy từ `theme/status.ts` qua `<StatusTag kind="appointment" value={a.status} />`.
- File component PascalCase, mỗi file một component chính, dưới khoảng 200 dòng; dài hơn thì tách.
- Không dùng `any`. Không để `console.log` trong code commit.

## Test

- Vitest cho hook và component có logic (chọn nút theo allowedActions, tính số buổi, form validate).
- Màn mới: ít nhất 1 test render trạng thái đang tải và trạng thái lỗi.
- E2E Playwright do Huy Trường chủ trì; FE thêm `data-testid` cho nút chính khi được yêu cầu.
