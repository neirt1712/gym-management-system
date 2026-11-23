import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components } from '../../api/schema';

export type Me = components['schemas']['Me'];
export type UpdateMeInput = components['schemas']['UpdateMeRequest'];

/** UC05 Xem hồ sơ của tôi (`GET /me`). Hội viên có thêm `member` (mã hội viên, qrToken), PT có `trainer`. */
export const useMe = () =>
  useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => unwrap(await api.GET('/me')),
  });

/** UC05 Sửa hồ sơ (`PATCH /me`). Không đổi được SĐT (dùng để đăng nhập). */
export const useUpdateMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateMeInput) => unwrap(await api.PATCH('/me', { body })),
    onSuccess: (me) => qc.setQueryData(queryKeys.me, me),
  });
};

/** UC05 Tải ảnh đại diện (`POST /uploads/avatar`, JPEG/PNG). Trả `avatarUrl` để gửi kèm `PATCH /me`. */
export const useUploadAvatar = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const result = await api.POST('/uploads/avatar', {
        // Kiểu sinh từ openapi coi file là chuỗi nhị phân; gửi FormData nguyên trạng.
        body: { file: '' },
        bodySerializer: () => form,
      });
      return unwrap(result).avatarUrl;
    },
  });

/** UC15 Tạo lại mã QR khi bị lộ (Q6). Mã cũ hết hiệu lực ngay. */
export const useRegenerateQr = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await api.POST('/me/qr-token/regenerate')).qrToken,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
};
