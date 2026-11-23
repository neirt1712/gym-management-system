import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type CheckIn = components['schemas']['CheckIn'];
export type CheckInListQuery = NonNullable<paths['/check-ins']['get']['parameters']['query']>;

/** UC18 Lượt ra vào; `present=true` là đang trong phòng. */
export const useCheckIns = (params: CheckInListQuery) =>
  useQuery({
    queryKey: queryKeys.checkIns(params),
    queryFn: async () => unwrap(await api.GET('/check-ins', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });

const useInvalidateCheckIns = () => {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: queryKeys.checkIns() });
    void qc.invalidateQueries({ queryKey: queryKeys.members() });
  };
};

/** UC16 Check-in bằng mã QR hoặc SĐT (gửi đúng một trong hai). Không trừ buổi PT. */
export const useCreateCheckIn = () => {
  const invalidate = useInvalidateCheckIns();
  return useMutation({
    mutationFn: async (body: { qrToken: string } | { phone: string }) =>
      unwrap(await api.POST('/check-ins', { body })),
    onSuccess: invalidate,
  });
};

/** UC17 Check-out (Staff làm hộ hoặc hội viên tự bấm). Gửi lặp trả lượt hiện tại. */
export const useCheckOut = () => {
  const invalidate = useInvalidateCheckIns();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await api.POST('/check-ins/{id}/checkout', { params: { path: { id } } })),
    onSuccess: invalidate,
  });
};
