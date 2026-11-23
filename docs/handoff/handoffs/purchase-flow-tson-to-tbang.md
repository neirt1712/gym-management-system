# Bàn giao: PurchaseFlow (mua gói dùng chung) và hook đơn, thanh toán — Sơn → Bằng

- **Ngày:** 25/10/2026 · **PR:** nhánh `tsonw3-purchase` (xếp sau `tsonw2-auth-screens`) · **UC:** UC09, UC12, UC13, UC14
- Hạn trong `fe-plan.md`: `PurchaseFlow` cho Bằng 23/10 (trễ 2 ngày).

## Đã xong

- **`features/purchase/components/PurchaseFlow.tsx`:** chọn ngày bắt đầu → báo giá (`POST /orders/quote`, ngày kết thúc do BE tính) → tạo đơn (`POST /orders`) → chọn phương thức (`POST /orders/{id}/payments`). Gặp `PENDING_ORDER_EXISTS` thì hiện nút "Mở đơn đang chờ". Mọi nút gửi đều khóa khi đang chờ.
- **`features/purchase/api.ts`:** `usePackage`, `useQuote`, `useCreateOrder`, `useCreatePayment`, `useOrder` (có `pollMs`), `useCancelOrder`, `useOrders`, `usePayments`. Query key ở `api/queryKeys.ts` (`orders`, `order`, `payments`, `package`, `subscriptions`).
- **`features/subscriptions/api.ts`:** `useSubscriptions`, `useSubscription` (dùng được cho màn chi tiết hội viên ở quầy, truyền `memberId`).
- **`features/purchase/components/ReceiptView.tsx`:** biên lai in bằng trình duyệt; phần có class `no-print` bị ẩn khi in.
- **Tạm thời ở `app/feedback/`** (chờ component dùng chung của Bằng): `StatusTag`, `ApiErrorAlert`, `PageError`. Khi Bằng làm xong `components/StatusTag`, `ErrorState` thì đổi import, giữ nguyên props.

## Cách dùng (quầy mua hộ, UC09 + UC13)

```tsx
import { PurchaseFlow } from '../../features/purchase/components/PurchaseFlow';

<PurchaseFlow
  pkg={pkg}                         // Package lấy bằng usePackage(id) hoặc từ danh sách gói
  memberId={member.id}              // bắt buộc khi quầy, Admin mua hộ
  methods={['CASH']}                // quầy thường chỉ thu tiền mặt
  onOpenOrder={(orderId) => ...}    // mở đơn: màn xác nhận tiền mặt của Bằng
/>
```

- Gia hạn: truyền thêm `renewalOf={subscription.id}`; ô ngày để trống thì BE lấy ngày ngay sau khi gói cũ hết hạn.
- Sau khi chọn tiền mặt, payment ở trạng thái `PENDING`; quầy xác nhận bằng `POST /payments/{id}/confirm-cash` (hook này thuộc phần của Bằng, chưa viết).

## Dữ liệu mẫu

- `npm run dev:mock`, đăng nhập Hội viên `0901234567` / `matkhau123`, mở `/member/purchase/77777777-7777-4777-8777-777777777777` (gói "Gym 1 tháng" trong ví dụ openapi).
- Test dùng `src/test/mockApi.ts` (giả `fetch`) và `src/test/fixtures.ts` (chép từ ví dụ openapi), xem `pages/member/PurchasePage.test.tsx`.

## Còn thiếu

- Danh mục gói `/packages` (của Bằng) cần nút "Mua gói" dẫn tới `/member/purchase/:packageId`; chưa đăng nhập thì `RequireAuth` tự đưa về `/login?next=...`.
- Màn tiền mặt ở quầy và hook `confirm-cash` (Bằng, tuần 3).

## Rủi ro, lưu ý

- API thật chưa chạy (Đơn 21/10, Thanh toán 23/10 đều trễ); hiện chỉ thử trên mock Prism. Prism luôn trả cùng một ví dụ nên ngày trên màn có thể không khớp ngày đã chọn.
- Đường dẫn VNPay trả về FE do BE cấu hình; FE giả định là `/member/orders/:id`. Cần Triển xác nhận khi làm VNPay (28/10).
