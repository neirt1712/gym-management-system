import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type Package = components['schemas']['Package'];
export type OrderRequest = components['schemas']['OrderRequest'];
export type OrderQuote = components['schemas']['OrderQuote'];
export type Order = components['schemas']['Order'];
export type Payment = components['schemas']['Payment'];
export type PaymentMethod = components['schemas']['PaymentMethod'];
export type Receipt = components['schemas']['Receipt'];

export type OrderListQuery = NonNullable<paths['/orders']['get']['parameters']['query']>;
export type PaymentListQuery = NonNullable<paths['/payments']['get']['parameters']['query']>;

/** UC07 Chi tiết gói (công khai). */
export const usePackage = (id: string) =>
  useQuery({
    queryKey: queryKeys.package(id),
    queryFn: async () => unwrap(await api.GET('/packages/{id}', { params: { path: { id } } })),
  });

/** UC09 Báo giá: BE tính tổng tiền và ngày kết thúc (quyết định 12, Q9). Không tạo gì trong DB. */
export const useQuote = () =>
  useMutation({
    mutationFn: async (body: OrderRequest) => unwrap(await api.POST('/orders/quote', { body })),
  });

/** UC09 Tạo đơn PENDING. Đã có đơn chờ cùng gói: 409 PENDING_ORDER_EXISTS kèm `details.orderId`. */
export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: OrderRequest) => unwrap(await api.POST('/orders', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders() }),
  });
};

/** UC12, UC13 Chọn phương thức: VNPAY trả `checkoutUrl`, CASH trả payment PENDING chờ quầy xác nhận. */
export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, method }: { orderId: string; method: PaymentMethod }) =>
      unwrap(
        await api.POST('/orders/{id}/payments', { params: { path: { id: orderId } }, body: { method } }),
      ),
    onSuccess: (_, { orderId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      void qc.invalidateQueries({ queryKey: queryKeys.payments() });
    },
  });
};

/**
 * UC14 Chi tiết đơn, kèm biên lai khi PAID. Nguồn duy nhất để biết đã trả xong (không tin return URL của VNPay).
 * `pollMs`: lặp lại khi đang chờ kết quả VNPay; trang tự tắt sau tối đa 60 giây.
 */
export const useOrder = (id: string, pollMs: number | false = false) =>
  useQuery({
    queryKey: queryKeys.order(id),
    queryFn: async () => unwrap(await api.GET('/orders/{id}', { params: { path: { id } } })),
    refetchInterval: pollMs,
  });

/** UC14 Hủy đơn chưa thanh toán. */
export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await api.POST('/orders/{id}/cancel', { params: { path: { id } }, body: {} })),
    onSuccess: (order) => {
      qc.setQueryData(queryKeys.order(order.id), order);
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
    },
  });
};

/** UC14 Lịch sử đơn của tôi. */
export const useOrders = (params: OrderListQuery) =>
  useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: async () => unwrap(await api.GET('/orders', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });

/** UC14 Lịch sử giao dịch của tôi. */
export const usePayments = (params: PaymentListQuery) =>
  useQuery({
    queryKey: queryKeys.payments(params),
    queryFn: async () => unwrap(await api.GET('/payments', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });
