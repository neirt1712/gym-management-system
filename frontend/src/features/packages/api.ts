import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { paths } from '../../api/schema';

export type PackageListQuery = NonNullable<paths['/packages']['get']['parameters']['query']>;

/** UC07 Danh mục gói (công khai). Khách và hội viên chỉ thấy gói đang bán; BE sắp giá tăng dần. */
export const usePackages = (params: PackageListQuery) =>
  useQuery({
    queryKey: queryKeys.packages(params),
    queryFn: async () => unwrap(await api.GET('/packages', { params: { query: params } })),
    placeholderData: keepPreviousData,
  });
