/**
 * Query key của TanStack Query, một nơi cho cả FE (frontend/CLAUDE.md).
 * Dạng `['<nhóm>', params]`. Thêm key khi viết hook cho endpoint mới (`/fe-api-hook`); mutation xong invalidate đúng key.
 * Gọi không tham số (ví dụ `queryKeys.orders()`) để invalidate cả nhóm.
 * Ví dụ: useQuery({ queryKey: queryKeys.me, queryFn: ... })
 */
export const queryKeys = {
  me: ['me'] as const,
  packages: (params?: object) => (params ? (['packages', 'list', params] as const) : (['packages'] as const)),
  package: (id: string) => ['packages', 'detail', id] as const,
  trainers: (params?: object) => (params ? (['trainers', 'list', params] as const) : (['trainers'] as const)),
  trainer: (id: string) => ['trainers', 'detail', id] as const,
  availability: (id: string, params?: object) => ['trainers', 'availability', id, params ?? {}] as const,
  appointments: (params?: object) =>
    params ? (['appointments', 'list', params] as const) : (['appointments'] as const),
  appointment: (id: string) => ['appointments', 'detail', id] as const,
  users: (params?: object) => (params ? (['users', 'list', params] as const) : (['users'] as const)),
  checkIns: (params?: object) => (params ? (['checkIns', 'list', params] as const) : (['checkIns'] as const)),
  notifications: (params?: object) =>
    params ? (['notifications', 'list', params] as const) : (['notifications'] as const),
  members: (params?: object) => (params ? (['members', 'list', params] as const) : (['members'] as const)),
  member: (id: string) => ['members', 'detail', id] as const,
  orders: (params?: object) => (params ? (['orders', 'list', params] as const) : (['orders'] as const)),
  order: (id: string) => ['orders', 'detail', id] as const,
  payments: (params?: object) => (params ? (['payments', 'list', params] as const) : (['payments'] as const)),
  subscriptions: (params?: object) =>
    params ? (['subscriptions', 'list', params] as const) : (['subscriptions'] as const),
  subscription: (id: string) => ['subscriptions', 'detail', id] as const,
};
