import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useState, type ReactNode } from 'react';
import type { AuthApi } from '../features/auth';
import { AuthProvider } from '../features/auth/AuthProvider';
import { appTheme } from '../theme/tokens';

type Props = { authApi: AuthApi; children: ReactNode };

/** Mọi provider dùng chung. Test dùng lại để chạy giống app thật. */
export const AppProviders = ({ authApi, children }: Props) => {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

  return (
    <ConfigProvider theme={appTheme} locale={viVN}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <AuthProvider api={authApi}>{children}</AuthProvider>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
};
