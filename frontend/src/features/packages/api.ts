import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { components, paths } from '../../api/schema';

export type PackageListQuery = NonNullable<paths['/packages']['get']['parameters']['query']>;
export type CreatePackageRequest = components['schemas']['CreatePackageRequest'];
export type UpdatePackageRequest = components['schemas']['UpdatePackageRequest'];

/**
 * UC07 Danh mục gói. Khách và hội viên chỉ thấy gói đang bán; Admin thấy cả gói ngừng bán và lọc được `status`.
 * BE sắp giá tăng dần.
 */
export const usePackages = (params: PackageListQuery) =>
  useQuery({
    queryKey: queryKeys.packages(params),
    queryFn: async () => unwrap(await api.GET('/packages', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });

/** UC08 Admin thêm gói. Gói PT bắt buộc số buổi và phút mỗi buổi; gói mới luôn ACTIVE. */
export const useCreatePackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreatePackageRequest) => unwrap(await api.POST('/packages', { body })),
    onSuccess: (pkg) => {
      qc.setQueryData(queryKeys.package(pkg.id), pkg);
      void qc.invalidateQueries({ queryKey: queryKeys.packages() });
    },
  });
};

/** UC08 Admin sửa gói hoặc bật/tắt bán. Không ảnh hưởng đơn và gói hội viên đã có (đơn chụp điều khoản). */
export const useUpdatePackage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdatePackageRequest }) =>
      unwrap(await api.PATCH('/packages/{id}', { params: { path: { id } }, body })),
    onSuccess: (pkg) => {
      qc.setQueryData(queryKeys.package(pkg.id), pkg);
      void qc.invalidateQueries({ queryKey: queryKeys.packages() });
    },
  });
};
