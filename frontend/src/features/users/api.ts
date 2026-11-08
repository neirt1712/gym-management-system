import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type User = components['schemas']['User'];
export type CreateUserRequest = components['schemas']['CreateUserRequest'];
export type UserListQuery = NonNullable<paths['/users']['get']['parameters']['query']>;

/** UC31 Admin xem, tìm tài khoản theo tên/SĐT, lọc vai trò, trạng thái. */
export const useUsers = (params: UserListQuery) =>
  useQuery({
    queryKey: queryKeys.users(params),
    queryFn: async () => unwrap(await api.GET('/users', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });

const useInvalidateUsers = () => {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: queryKeys.users() });
    void qc.invalidateQueries({ queryKey: queryKeys.trainers() });
  };
};

/** UC32 Admin tạo tài khoản Staff hoặc PT (kèm hồ sơ PT). */
export const useCreateUser = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async (body: CreateUserRequest) => unwrap(await api.POST('/users', { body })),
    onSuccess: invalidate,
  });
};

/** UC34 Khóa/mở tài khoản kèm lý do (BE tăng token_version, thu hồi mọi phiên). */
export const useUpdateUserStatus = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: components['schemas']['UpdateUserStatusRequest'];
    }) => unwrap(await api.PATCH('/users/{id}/status', { params: { path: { id } }, body })),
    onSuccess: invalidate,
  });
};

/** UC35 Đổi vai trò kèm lý do; không đổi được thành MEMBER (ROLE_CHANGE_NOT_ALLOWED). */
export const useUpdateUserRole = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: components['schemas']['UpdateUserRoleRequest'] }) =>
      unwrap(await api.PATCH('/users/{id}/role', { params: { path: { id } }, body })),
    onSuccess: invalidate,
  });
};
