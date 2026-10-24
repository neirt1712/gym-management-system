/**
 * Query key của TanStack Query, một nơi cho cả FE (frontend/CLAUDE.md).
 * Dạng `['<nhóm>', params]`. Thêm key khi viết hook cho endpoint mới (`/fe-api-hook`); mutation xong invalidate đúng key.
 * Gọi không tham số (ví dụ `queryKeys.orders()`) để invalidate cả nhóm.
 * Ví dụ: useQuery({ queryKey: queryKeys.me, queryFn: ... })
 */
export const queryKeys = {
  me: ['me'] as const,
  package: (id: string) => ['packages', 'detail', id] as const,
  orders: (params?: object) => (params ? (['orders', 'list', params] as const) : (['orders'] as const)),
  order: (id: string) => ['orders', 'detail', id] as const,
  payments: (params?: object) => (params ? (['payments', 'list', params] as const) : (['payments'] as const)),
  subscriptions: (params?: object) =>
    params ? (['subscriptions', 'list', params] as const) : (['subscriptions'] as const),
  subscription: (id: string) => ['subscriptions', 'detail', id] as const,
};
