# Hướng dẫn làm giao diện cho người mới: component, quy tắc code, quy tắc viết, bộ màu

- **Ai sở hữu:** Sơn (FE Lead) viết; Bằng góp ý. Sửa qua PR.
- **Ai đọc:** Bằng trước khi làm `theme/`, `components/` và màn đầu tiên; Sơn dùng mục 9 để review.
- **Nguồn gốc:** file này giải thích lại cho dễ hiểu. Khi khác nhau, các file sau thắng: `frontend/src/theme/tokens.ts`, `frontend/src/theme/status.ts` (màu), `.claude/rules/frontend-ui.md` (giao diện, chữ), `frontend/CLAUDE.md` (code), `docs/design/fe-architecture.md` (route).

Bằng không cần thuộc hết. Cách làm an toàn: mỗi màn đi theo mục 8 (có Claude), rồi tự đối chiếu mục 9 trước khi mở PR.

---

## 1. Bằng làm ở đâu

Bản đồ thư mục: `frontend/README.md`. Phần của Bằng:

| Thư mục | Bằng làm gì | Hạn gần nhất |
| --- | --- | --- |
| `src/theme/` | Bộ màu, khoảng cách (`tokens.ts`), nhãn + màu trạng thái (`status.ts`). **Đã có sẵn**, chỉ chỉnh khi cả hai đồng ý | Chốt 09/10 |
| `src/components/` | 7 component dùng chung ở mục 5 | 09/10 |
| `src/features/<nghiệp-vụ>/` | packages-admin, users-admin, staff-counter, check-in, trainer-members, availability, classes-admin, notifications, reports | Theo tuần trong `docs/plan/fe-plan.md` |
| `src/pages/` | public (danh mục gói), `staff/`, `admin/`, các trang PT trừ lịch | Theo tuần |
| Figma | ~15 màn demo | 08/10 |

**Không sửa:** `src/app/`, `src/api/`, màn của Sơn, `backend/`, `docs/` (trừ khi được nhờ). Cần đổi thì gửi Sơn đoạn code muốn sửa (patch) hoặc nhắn.
**Không tự tạo:** API client, kiểu dữ liệu API, `PurchaseFlow`, `AppointmentCard`, `ProposalTimeline` — Sơn cung cấp.

Gắn màn vào app: mở `src/app/router.tsx`, tìm route của mình (đang là `PlaceholderPage`), báo Sơn thay bằng màn thật (vì `app/` là của Sơn). Menu và mã UC của từng route nằm ở `src/app/navigation.tsx`.

---

## 2. Bộ màu

### 2.1 Màu gốc (đã có trong `tokens.ts`)

| Tên | Mã | Dùng cho |
| --- | --- | --- |
| `primary` | `#0F766E` (xanh ngọc) | **Màu nhấn duy nhất**: nút chính, link, mục đang chọn |
| `success` | `#16A34A` | Thành công, đã thanh toán, đang hiệu lực |
| `warning` | `#D97706` | Chờ xử lý, sắp hết hạn |
| `error` | `#DC2626` | Lỗi, thất bại, hành động nguy hiểm (nút "Hủy lịch") |
| `info` | `#2563EB` | Thông tin trung tính |
| `bgLayout` | `#F6F7F9` | Nền xám rất nhạt phía sau trang |
| `bgContainer` | `#FFFFFF` | Nền thẻ, bảng, form |
| `border` | `#E5E7EB` | Viền |
| `text` | `#111827` | Chữ chính |
| `textSecondary` | `#6B7280` | Chữ phụ, mô tả |

### 2.2 Sắc độ Ant Design tự sinh

Ant Design tự tạo màu hover, active, nền nhạt, viền từ màu gốc. Đây là giá trị thật (tính bằng `theme.getDesignToken` với `tokens.ts` hiện tại):

| Màu | Nền nhạt (`…Bg`) | Viền (`…Border`) | Hover | Gốc | Active (đang nhấn) |
| --- | --- | --- | --- | --- | --- |
| primary | `#a8b5b2` ⚠ | `#5f9c90` | `#268277` | `#0F766E` | `#064f4b` |
| success | `#d3e3d6` ⚠ | `#7bc990` | | `#16A34A` | |
| warning | `#fff7e6` | `#ffd182` | | `#D97706` | |
| error | `#fff2f0` | `#ffafa6` | | `#DC2626` | |
| info | `#f0f7ff` | `#a3c9ff` | | `#2563EB` | |

Chữ mờ thêm: `colorTextTertiary` = `rgba(0,0,0,0.45)`, chữ bị vô hiệu `rgba(0,0,0,0.25)`.

⚠ **Lỗi cần sửa (chờ Sơn và Bằng đồng ý):** vì xanh ngọc và xanh lá khá đậm, nền nhạt Ant Design sinh ra bị **xám đục** (`#a8b5b2`, `#d3e3d6`). Ô đang chọn trong Select, nền thông báo thành công… sẽ trông xám. Đề xuất thêm vào `appTheme.token` trong `tokens.ts`:

```ts
colorPrimaryBg: '#E6F4F2',      // đã dùng cho Menu đang chọn
colorPrimaryBgHover: '#CCE9E4',
colorPrimaryBorder: '#99D3C9',
colorSuccessBg: '#F0FDF4',
colorSuccessBorder: '#86EFAC',
```

Sửa xong, chạy `npm run dev` và nhìn lại: menu, Select, Alert thành công.

### 2.3 Màu trạng thái (`status.ts`)

Mọi trạng thái (đơn, thanh toán, gói, lịch PT, đề xuất, lớp, đăng ký lớp, tài khoản) đã có **nhãn tiếng Việt và màu** trong `status.ts`. Không tự chọn màu cho trạng thái; luôn dùng `<StatusTag kind="..." value={...} />` (mục 5).

| Màu Tag | Nghĩa | Ví dụ |
| --- | --- | --- |
| `success` (xanh lá) | Xong, tốt | Đã thanh toán, Đang hiệu lực, Đã tập |
| `processing` (xanh dương) | Đang diễn ra | Đã xác nhận, Đang xử lý, Sắp diễn ra |
| `warning` (cam) | Đang chờ ai đó | Chờ thanh toán, Đang thỏa thuận, Chờ phản hồi |
| `error` (đỏ) | Hỏng, bị từ chối | Thất bại, Bị từ chối, Vắng mặt, Đã khóa |
| `cyan` | Tạm dừng | Đang bảo lưu |
| `default` (xám) | Kết thúc, không còn tác dụng | Đã hủy, Hết hạn |

### 2.4 Quy tắc dùng màu

1. **Không viết mã màu (`#...`) trong file `.tsx`.** Lấy màu qua `theme.useToken()`:
   ```tsx
   const { token } = theme.useToken();
   <span style={{ color: token.colorTextSecondary }}>...</span>
   ```
2. **Mỗi màn chỉ một nút `type="primary"`** (nút quan trọng nhất). Nút khác dùng mặc định hoặc `type="text"`/`type="link"`.
3. Nút nguy hiểm (hủy, khóa, xóa): `danger`, và luôn qua `ConfirmDialog`.
4. Không truyền thông tin chỉ bằng màu: Tag luôn có chữ.

---

## 3. Chữ, khoảng cách, kích thước

| Thứ | Giá trị | Lấy ở đâu |
| --- | --- | --- |
| Font | Be Vietnam Pro (Google Fonts, đã gắn trong `index.html`) | tự động |
| Cỡ chữ thường | 14px | tự động |
| Tiêu đề trang | `Typography.Title level={3}` | |
| Tiêu đề trong thẻ | `level={4}` hoặc `level={5}` | |
| Bo góc | 8px | tự động |
| Chiều cao ô nhập, nút | 36px | tự động |
| Khoảng cách | **bội số của 8**: `space.xs` 4, `space.sm` 8, `space.md` 16, `space.lg` 24, `space.xl` 32 | `import { space } from '../../theme/tokens'` |
| Điện thoại / máy tính | dưới 768px là điện thoại; từ 1200px là màn rộng | `breakpoints` trong `tokens.ts` |

Ví dụ đúng: `style={{ marginBottom: space.md }}`. Sai: `style={{ marginBottom: 15 }}`.
Icon: chỉ dùng `@ant-design/icons`.

---

## 4. Bố cục một trang và 4 trạng thái

```
┌──────────────────────────────────────────────────────┐
│ PageHeader: Tiêu đề (danh từ)        [Nút chính]    │
│ Mô tả ngắn một dòng (nếu cần)                        │
├──────────────────────────────────────────────────────┤
│ [Ô tìm kiếm]   [Bộ lọc] [Bộ lọc]          [Đặt lại] │
├──────────────────────────────────────────────────────┤
│ Danh sách → DataTable                                │
│ Chi tiết  → Card, 2 cột trên màn rộng:               │
│            thông tin chính 2/3 | hành động, tóm tắt 1/3 │
└──────────────────────────────────────────────────────┘
Điện thoại: 1 cột; bảng thành danh sách thẻ; nút chính dính đáy màn.
```

**Mỗi màn phải có đủ 4 trạng thái** (thiếu là PR bị trả lại):

| Trạng thái | Hiện gì |
| --- | --- |
| Đang tải | `Skeleton` có hình giống bố cục thật. Không dùng vòng quay toàn trang |
| Rỗng | `EmptyState`: một câu giải thích + một nút dẫn tới việc nên làm |
| Lỗi | `ErrorState` có nút "Thử lại" |
| Không có quyền | Trang 403 (route tự lo) hoặc ẩn nút theo `allowedActions` |

Màn quầy (Staff): ưu tiên thao tác nhanh — ô tìm kiếm tự focus, Enter để check-in, kết quả hiện chữ lớn.

---

## 5. Bảy component dùng chung (`src/components/`)

**Quy tắc chung cho mọi component:**
- Một file một component, tên file PascalCase trùng tên component: `PageHeader.tsx`.
- Dưới ~200 dòng; dài hơn thì tách.
- **Không gọi API bên trong component.** Dữ liệu và hàm xử lý được truyền vào qua props.
- Props có kiểu rõ (`type Props = {...}`), không dùng `any`.
- Đầu file có comment **ví dụ cách dùng** để người khác chép.
- Có file `index.ts` trong `components/` xuất cả 7 component, để màn import gọn: `import { PageHeader, DataTable } from '../../components';`.

Props dưới đây là **đề xuất ban đầu**; Bằng có thể đổi khi làm, nhưng ghi lại trong comment đầu file và báo Sơn (vì màn của Sơn cũng dùng).

| Component | Dùng để | Dựng từ Ant Design | Props đề xuất |
| --- | --- | --- | --- |
| `PageHeader` | Đầu mỗi trang: tiêu đề, mô tả, nút chính bên phải | `Typography.Title`, `Flex` | `title: string`, `description?: string`, `extra?: ReactNode` (nút) |
| `DataTable` | Bảng danh sách, tự lo đang tải / rỗng / lỗi | `Table` | các props của `Table` + `loading`, `error?: unknown`, `onRetry?: () => void`, `empty?: ReactNode` |
| `FormModal` | Hộp thoại có form (thêm, sửa) | `Modal` + `Form` | `open`, `title`, `onCancel`, `onSubmit(values)`, `submitting` (khóa nút khi đang gửi), `submitText`, `children` (các ô) |
| `StatusTag` | Nhãn trạng thái đúng màu | `Tag` + `status.ts` | `kind: StatusKind`, `value: string` |
| `EmptyState` | Màn hoặc bảng không có dữ liệu | `Empty` | `description: string`, `action?: ReactNode` |
| `ErrorState` | Có lỗi, cho thử lại | `Result` + `lib/errors.ts` | `error: unknown`, `onRetry?: () => void` — hiện `getErrorMessage(error)`, mã `getRequestId(error)` bằng chữ nhỏ |
| `ConfirmDialog` | Hỏi lại trước hành động không hoàn tác | `Modal` | `open`, `title` (câu hỏi), `content?`, `confirmText` (đúng hành động), `danger?`, `loading`, `onConfirm`, `onCancel` |

Ví dụ `StatusTag` hoàn chỉnh (mẫu để làm các component khác):

```tsx
import { Tag } from 'antd';
import { STATUS, type StatusKind } from '../theme/status';

/**
 * Nhãn trạng thái đúng chữ và màu theo theme/status.ts.
 * Ví dụ: <StatusTag kind="order" value={order.status} />
 */
type Props = { kind: StatusKind; value: string };

export const StatusTag = ({ kind, value }: Props) => {
  const def = (STATUS[kind] as Record<string, { label: string; color: string }>)[value];
  return <Tag color={def?.color ?? 'default'}>{def?.label ?? value}</Tag>;
};
```

Mỗi component có ít nhất 1 test (Vitest) kiểm tra hiện đúng chữ; `ErrorState` và `DataTable` test thêm nút "Thử lại" gọi `onRetry`.

---

## 6. Quy tắc viết code (TypeScript, TSX)

TSX = TypeScript + thẻ giống HTML. Không cần giỏi; chỉ cần giữ các luật dưới đây, phần kiểm tra để máy lo (`lint`, `typecheck`, husky).

**Đặt tên và file**
- Component, màn: PascalCase — `MemberListPage.tsx`, `CheckInForm.tsx`. Hàm, biến: camelCase — `formatVND`, `isLoading`.
- Import bằng đường dẫn tương đối (`../../components`), không dùng `@/`.

**Gọi API**
- Chỉ gọi qua hook trong `features/<nghiệp-vụ>/api.ts` (TanStack Query). Component không gọi `fetch` trực tiếp.
- Query key lấy từ `api/queryKeys.ts`. Thêm/sửa xong thì invalidate đúng key.
- Kiểu dữ liệu lấy từ `api/schema.d.ts` (sinh từ `openapi.yaml`), ví dụ `components['schemas']['Package']`. **Không tự gõ lại kiểu của API**, không bịa field.
- Dùng skill `/fe-api-hook` để Claude tạo hook đúng mẫu.

**Hiển thị**
- Tiền, ngày, giờ: `formatVND`, `formatDate`, `formatDateTime`, `formatTimeRange` trong `lib/format.ts`.
- **Không tự tính ngày nghiệp vụ** (hết hạn, bảo lưu, hạn thanh toán…): hiện đúng giá trị BE trả về (ADR 0001, Q9).
- Lỗi: `getErrorMessage(err)` trong `lib/errors.ts`. Không viết câu lỗi riêng trong component. Mã lỗi chưa có thì báo Sơn tạo CR.
- Trạng thái: `<StatusTag>`.

**Quyền và an toàn**
- Nút trong màn hiện theo `allowedActions` do BE trả, không tự đoán quyền.
- Thao tác tốn tiền hoặc lặp (tạo đơn, xác nhận tiền mặt, check-in): khóa nút khi đang gửi (`loading={isPending}`), không cho bấm hai lần.

**Cấm**
- `any`, `console.log`, mã màu `#...` trong `.tsx`, số đo lẻ ngoài bội số 8, `dangerouslySetInnerHTML`.
- Tắt lint hay bỏ qua husky (`--no-verify`).

**Khung một màn danh sách (để tham khảo)**

```tsx
import { Button } from 'antd';
import { DataTable, PageHeader, StatusTag } from '../../components';
import { useMembers } from '../../features/staff-counter/api';

/** UC19 Tìm hội viên. */
export const MemberListPage = () => {
  const { data, isLoading, error, refetch } = useMembers();
  return (
    <>
      <PageHeader title="Hội viên" extra={<Button type="primary">Thêm hội viên</Button>} />
      <DataTable
        loading={isLoading}
        error={error}
        onRetry={refetch}
        dataSource={data?.data}
        columns={[/* cột lấy field đúng theo schema.d.ts */]}
      />
    </>
  );
};
```

(`useMembers` chỉ là ví dụ tên; hook thật tạo bằng `/fe-api-hook` khi có `openapi.yaml`.)

---

## 7. Quy tắc viết chữ tiếng Việt trên giao diện

| Luật | Đúng | Sai |
| --- | --- | --- |
| Xưng "bạn", câu ngắn, không chấm than, không emoji | "Bạn chưa có lịch tập nào" | "Ôi! Chưa có lịch nào 😢" |
| Nút bắt đầu bằng động từ | "Đặt lịch", "Xác nhận thanh toán", "Thêm hội viên" | "OK", "Submit", "Hội viên mới" |
| Báo thành công `message.success`, tối đa 6 chữ | "Đã lưu", "Đã check-in" | "Thao tác của bạn đã được thực hiện thành công" |
| Lỗi nói người dùng làm gì tiếp | "Gói đã hết hạn. Gia hạn để check-in." | "Lỗi 422" |
| Hộp hỏi lại: tiêu đề là câu hỏi, nút đỏ ghi đúng hành động | "Khóa tài khoản này?" + nút "Khóa tài khoản" | "Bạn chắc chứ?" + nút "OK" |
| Tiêu đề trang là danh từ | "Hội viên", "Check-in" | "Quản lý danh sách hội viên của phòng gym" |

**Thuật ngữ cố định** (không dùng từ khác cho cùng ý): Hội viên, Khách hàng, Huấn luyện viên (PT), Gói tập, Buổi tập, Lịch tập, Đề xuất, Lớp học, Check-in, Bảo lưu, Biên lai.

**Định dạng:** tiền `1.200.000 ₫` · ngày `05/10/2026` · giờ `18:00` · khoảng giờ `18:00–19:00, T2 05/10` · số buổi `Còn 7/12 buổi`.

**Truy cập:** mọi ô nhập có label; nút chỉ có icon phải có `aria-label`.

---

## 8. Làm một màn với Claude (từng bước)

1. Lấy code mới: `git switch develop` → `git pull`.
2. Mở Claude Code ở gốc repo, gõ `/team-start UCxx <mô tả>`. Claude đọc UC, API, kiểm tra đủ điều kiện, đề xuất kế hoạch và tên nhánh (`<ten>w<tuan>-<mo-ta>`, ví dụ nếu Bằng chọn tên `bang`: `bangw2-uc08-packages-admin`). Đọc kế hoạch, hỏi lại chỗ chưa hiểu, rồi duyệt.
3. Gõ `/fe-screen UCxx` để Claude dựng màn theo đúng quy ước này.
4. Chạy `npm run dev`, tự bấm thử: đủ 4 trạng thái chưa, chữ đúng mục 7 chưa, thu nhỏ cửa sổ dưới 768px xem có vỡ không.
5. Gõ `/fe-ui-check` để Claude tự rà theo mục 9.
6. Gõ `/team-finish`: chạy `lint`, `typecheck`, `test`, `build`, soạn commit và mô tả PR. Kiểm tra lại rồi tự push, mở PR vào `develop`, gắn Sơn review.
7. Màn mà Sơn hoặc người khác dùng tiếp: `/team-handoff`.

Gặp lỗi đỏ: dán lỗi cho Claude và hỏi "lỗi này nghĩa là gì, sửa sao cho nhỏ nhất?". Không tắt kiểm tra.

---

## 9. Checklist Sơn dùng để review PR của Bằng

Bằng tự đánh dấu trong mô tả PR trước; Sơn kiểm lại.

**Phạm vi**
- [ ] Chỉ sửa trong thư mục của Bằng (mục 1). Đụng `app/`, `api/`, `lib/` thì có lý do và đã báo Sơn.
- [ ] Đúng UC trong thẻ, không làm thêm tính năng ngoài phạm vi.
- [ ] Sửa `theme/` hoặc `components/` thì PR liệt kê màn bị ảnh hưởng.

**Màu và bố cục**
- [ ] Không có `#...` hay số đo lẻ trong `.tsx` (tìm nhanh: `#` và `px` trong diff).
- [ ] Một nút `primary` mỗi màn; nút nguy hiểm có `danger` + `ConfirmDialog`.
- [ ] Trạng thái dùng `StatusTag`, không tự đặt màu.
- [ ] Bố cục theo mục 4; dưới 768px không vỡ.

**Trạng thái và dữ liệu**
- [ ] Đủ 4 trạng thái: Skeleton, EmptyState, ErrorState + Thử lại, 403.
- [ ] Gọi API chỉ qua hook; kiểu lấy từ `schema.d.ts`; không có field tự bịa.
- [ ] Lỗi qua `getErrorMessage`; tiền/ngày qua `lib/format.ts`; không tự tính ngày nghiệp vụ.
- [ ] Nút theo `allowedActions`; nút gửi bị khóa khi đang gửi.

**Chữ**
- [ ] Theo bảng mục 7 (động từ, ≤6 chữ khi thành công, câu hỏi khi xác nhận, đúng thuật ngữ).
- [ ] Ô nhập có label, nút icon có `aria-label`.

**Kiểm tra**
- [ ] `lint`, `typecheck`, `test`, `build` xanh (kết quả thật trong PR).
- [ ] Màn mới có test trạng thái đang tải và lỗi; component có test hiện đúng chữ.
- [ ] Có ảnh chụp màn (cả điện thoại nếu có) trong PR.

---

## 10. Hỏi ai

Kiến trúc FE, API, component Sơn cung cấp: **Sơn** · màu, Figma: Bằng tự quyết, đổi `theme/` thì cùng Sơn · phạm vi, tiêu chí chấp nhận, hạn: **Huy Trường** · mã lỗi: Hồng Anh (qua Sơn).
