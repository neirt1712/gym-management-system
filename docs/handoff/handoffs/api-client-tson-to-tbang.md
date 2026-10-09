# Bàn giao: lớp API client + mock — Sơn → Bằng

- **Ngày:** 09/10/2026 · **PR:** #14 (`tsonw1-uc02-api-client`, đã merge vào `develop`) · **UC:** UC02, UC03 (khung dùng chung cho mọi màn)
- Kiến trúc chi tiết: `docs/design/fe-architecture.md` (mục "Lớp truy cập API", "Chạy với mock và với backend"). Quy ước: `frontend/CLAUDE.md`.

## Đã xong

- **`src/api/client.ts`:** nơi **duy nhất** gọi API (openapi-fetch). Tự gắn `Authorization: Bearer`, gặp 401 thì refresh một lần rồi gửi lại, hết phiên thì về `/login`. Bằng **không cần** tự xử lý token hay 401.
- **`src/api/schema.d.ts`:** kiểu của mọi endpoint, sinh từ `docs/api/openapi.yaml` v0.1 bằng `npm run gen:api`. **Không sửa tay.** Có 8 nhóm: xác thực, hồ sơ, gói, đơn, thanh toán, check-in, hội viên, tài khoản.
- **`unwrap(result)`** (trong `client.ts`): trả `data` khi thành công; lỗi thì ném `{ error: { code, message, details, requestId } }`, đưa thẳng vào `getErrorMessage(err)` và `getRequestId(err)` của `src/lib/errors.ts`.
- **`src/api/queryKeys.ts`:** chỗ khai báo query key dùng chung; hiện mới có `me`. Bằng thêm key cho nhóm của mình khi viết hook.
- **Mock:** `npm run dev:mock` chạy Prism (từ openapi) và Vite cùng lúc; FE gọi `/api/v1/...` như với backend thật.
- **Đăng nhập chỉ bằng SĐT** (Q12); tài khoản mẫu khớp ví dụ trong openapi (bảng dưới).

## Cách chạy / cách dùng

```powershell
cd frontend
npm install          # lần đầu, hoặc sau khi pull có package.json mới
npm run dev:mock     # http://localhost:5173 — FE + mock API
npm run gen:api      # chạy lại khi Triển đổi openapi.yaml (Sơn sẽ báo qua /fe-lead-contract)
```

**Viết hook cho một endpoint** trong `src/features/<nghiệp-vụ>/api.ts` (hoặc gõ `/fe-api-hook GET /packages` để Claude viết theo mẫu). Đoạn dưới đã được biên dịch thử với `schema.d.ts` hiện tại:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import type { components, paths } from '../../api/schema';

type PackageQuery = NonNullable<paths['/packages']['get']['parameters']['query']>;
export type Package = components['schemas']['Package'];

/** UC07 Danh sách gói. */
export const usePackages = (params: PackageQuery = {}) =>
  useQuery({
    queryKey: ['packages', params],
    queryFn: async () => unwrap(await api.GET('/packages', { params: { query: params } })),
  });

/** UC08 Admin tạo gói; xong thì làm mới danh sách. */
export const useCreatePackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: components['schemas']['CreatePackageRequest']) =>
      unwrap(await api.POST('/packages', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });
};
```

Trong màn: `const { data, isLoading, error, refetch } = usePackages();` → `DataTable` nhận `loading={isLoading}`, `error={error}`, `onRetry={refetch}`, `dataSource={data?.data}` (danh sách luôn trả `{ data, meta }`). Lỗi hiện bằng `getErrorMessage(error)`. Nút gửi: `loading={mutation.isPending}`.

Quy tắc: component **không** gọi `api` hay `fetch` trực tiếp, chỉ gọi hook; kiểu lấy từ `schema.d.ts`, không tự gõ lại; query key thống nhất dạng `['<nhóm>', params]`.

## Dữ liệu mẫu

Đăng nhập chỉ bằng SĐT, mật khẩu chung `matkhau123` (chế độ `VITE_AUTH_MODE=fake`, mặc định):

| Vai trò | SĐT | Trang đầu sau đăng nhập |
| --- | --- | --- |
| Quản trị | `0900000001` | `/admin` |
| Nhân viên quầy | `0900000002` | `/staff/check-in` |
| Huấn luyện viên | `0900000003` | `/trainer/schedule` |
| Hội viên | `0901234567` | `/member` |
| Bị khóa | `0900000009` | báo "Tài khoản đã bị khóa" |

Mock Prism trả **ví dụ có sẵn trong openapi** (luôn cùng dữ liệu, không lưu khi thêm/sửa). Muốn chọn ví dụ khác: gửi header `Prefer: example=<tên>` (tên ví dụ xem trong `openapi.yaml`); muốn dữ liệu ngẫu nhiên theo schema: chạy `npx prism mock ../docs/api/openapi.yaml -p 4010 -d` thay cho `npm run mock`.

## Còn thiếu

- Hook cho từng nghiệp vụ chưa có: mỗi người viết hook của nghiệp vụ mình (Bằng: gói, tài khoản, hội viên, check-in, thanh toán tại quầy…).
- **API thật chưa chạy:** theo `docs/handoff/CONTRACT_STATUS.md`, gói và tài khoản 16/10 (Hồng Anh), hội viên 21/10, check-in 23/10. Trước đó làm trên mock.
- Mã lỗi mới chờ Q16 (Hồng Anh, 13/10); khi chốt Sơn chép vào `lib/errors.ts`.
- Component dùng chung (PageHeader, DataTable, ErrorState…) là việc của Bằng (hạn 09/10); ví dụ trên giả định `DataTable` có props `loading`, `error`, `onRetry` như đề xuất trong `docs/design/fe-huong-dan-component.md` mục 5.

## Rủi ro, lưu ý

- Mock không lưu dữ liệu và không kiểm tra cookie: tạo gói xong danh sách vẫn như cũ là bình thường trên mock.
- Sau mỗi lần `openapi.yaml` đổi: chạy `npm run gen:api`, rồi `npm run typecheck` để thấy chỗ hỏng (Sơn sẽ phân việc sửa).
- Tài khoản mẫu đã đổi so với khung FE lúc đầu (0900000001 giờ là Quản trị, mật khẩu `matkhau123`).
- Đừng sửa `src/api/` hay `src/app/` trực tiếp (của Sơn): cần thêm gì thì nhắn Sơn hoặc đưa patch.
