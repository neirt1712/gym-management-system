import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type Subscription = components['schemas']['Subscription'];
export type SubscriptionDetail = components['schemas']['SubscriptionDetail'];
export type SubscriptionListQuery = NonNullable<paths['/subscriptions']['get']['parameters']['query']>;

/** UC10 Gói của tôi. MEMBER chỉ thấy gói của mình; số buổi PT do BE tính sẵn trong `sessions`. */
export const useSubscriptions = (params: SubscriptionListQuery = {}) =>
  useQuery({
    queryKey: queryKeys.subscriptions(params),
    queryFn: async () => unwrap(await api.GET('/subscriptions', { params: { query: params } })),
  });

/** UC10 Chi tiết gói: số buổi theo tháng, thông tin bảo lưu. */
export const useSubscription = (id: string) =>
  useQuery({
    queryKey: queryKeys.subscription(id),
    queryFn: async () => unwrap(await api.GET('/subscriptions/{id}', { params: { path: { id } } })),
  });
