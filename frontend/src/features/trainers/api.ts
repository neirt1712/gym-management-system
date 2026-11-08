import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type Trainer = components['schemas']['Trainer'];
export type TrainerAvailability = components['schemas']['TrainerAvailability'];
export type TimeRange = components['schemas']['TimeRange'];
export type TrainerListQuery = NonNullable<paths['/trainers']['get']['parameters']['query']>;

/** UC21 Danh sách PT (công khai). */
export const useTrainers = (params: TrainerListQuery) =>
  useQuery({
    queryKey: queryKeys.trainers(params),
    queryFn: async () => unwrap(await api.GET('/trainers', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });

/** UC21 Hồ sơ PT (công khai, không có SĐT, email). */
export const useTrainer = (id: string) =>
  useQuery({
    queryKey: queryKeys.trainer(id),
    queryFn: async () => unwrap(await api.GET('/trainers/{id}', { params: { path: { id } } })),
    enabled: !!id,
  });

/** UC22, UC23 Khung giờ rảnh và giờ bận; không gửi khoảng thì BE lấy 4 tuần từ hôm nay. */
export const useAvailability = (id: string, range: { from?: string; to?: string } = {}) =>
  useQuery({
    queryKey: queryKeys.availability(id, range),
    queryFn: async () =>
      unwrap(await api.GET('/trainers/{id}/availability', { params: { path: { id }, query: range } })),
    enabled: !!id,
  });

/** UC22 PT thay toàn bộ khung giờ trong khoảng `from`..`to` (không ảnh hưởng lịch đã có). */
export const useReplaceAvailability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: components['schemas']['ReplaceAvailabilityRequest'];
    }) => unwrap(await api.PUT('/trainers/{id}/availability', { params: { path: { id } }, body })),
    onSuccess: (_, { id }) => void qc.invalidateQueries({ queryKey: ['trainers', 'availability', id] }),
  });
};
