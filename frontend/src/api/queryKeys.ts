/**
 * Query key của TanStack Query, một nơi cho cả FE (frontend/CLAUDE.md).
 * Dạng `['<nhóm>', params]`. Thêm key khi viết hook cho endpoint mới (`/fe-api-hook`); mutation xong invalidate đúng key.
 * Ví dụ: useQuery({ queryKey: queryKeys.me, queryFn: ... })
 */
export const queryKeys = {
  me: ['me'] as const,
};
