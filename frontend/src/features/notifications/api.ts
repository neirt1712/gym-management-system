import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type Notification = components['schemas']['Notification'];
export type NotificationListQuery = NonNullable<paths['/notifications']['get']['parameters']['query']>;

/** Hỏi lại số chưa đọc mỗi phút để chuông cập nhật. */
const POLL_MS = 60_000;

/** UC42 Thông báo của tôi; `meta.unreadCount` là tổng chưa đọc. */
export const useNotifications = (params: NotificationListQuery, options: { poll?: boolean } = {}) =>
  useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: async () => unwrap(await api.GET('/notifications', { params: { query: params } })),
    placeholderData: keepPreviousData,
    refetchInterval: options.poll ? POLL_MS : false,
  });

/** UC42 Đánh dấu một thông báo đã đọc. */
export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await api.PATCH('/notifications/{id}/read', { params: { path: { id } } })),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.notifications() }),
  });
};
