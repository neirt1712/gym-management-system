import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type Member = components['schemas']['Member'];
export type MemberDetail = components['schemas']['MemberDetail'];
export type CreateMemberRequest = components['schemas']['CreateMemberRequest'];
export type MemberListQuery = NonNullable<paths['/members']['get']['parameters']['query']>;

/** UC19 Tìm hội viên (quầy, Admin): theo tên không dấu, SĐT hoặc mã. */
export const useMembers = (params: MemberListQuery) =>
  useQuery({
    queryKey: queryKeys.members(params),
    queryFn: async () => unwrap(await api.GET('/members', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });

/** UC19 Chi tiết hội viên: gói ACTIVE, FROZEN và lượt đang trong phòng. */
export const useMember = (id: string) =>
  useQuery({
    queryKey: queryKeys.member(id),
    queryFn: async () => unwrap(await api.GET('/members/{id}', { params: { path: { id } } })),
  });

/** UC20 Thêm hội viên tại quầy (chưa có mật khẩu). SĐT đã dùng: 409 PHONE_DUPLICATED kèm `details.memberId`. */
export const useCreateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateMemberRequest) => unwrap(await api.POST('/members', { body })),
    onSuccess: (member) => {
      qc.setQueryData(queryKeys.member(member.id), member);
      void qc.invalidateQueries({ queryKey: queryKeys.members() });
    },
  });
};
