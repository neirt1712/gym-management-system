import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { AuthApi } from '../features/auth';
import { AuthProvider } from '../features/auth/AuthProvider';
import { appTheme } from '../theme/tokens';
import { GlobalErrorToast, type ErrorNotifier } from './feedback/GlobalErrorToast';

type Props = { authApi: AuthApi; children: ReactNode };

/** Mọi provider dùng chung. Test dùng lại để chạy giống app thật. */
export const AppProviders = ({ authApi, children }: Props) => {
  // QueryClient tạo trước khi có context của Ant Design, nên báo lỗi chung qua ref do GlobalErrorToast gắn vào
  const notifyRef = useRef<ErrorNotifier>(() => undefined);
  const register = useCallback((notify: ErrorNotifier) => {
    notifyRef.current = notify;
  }, []);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: (error) => notifyRef.current(error) }),
        mutationCache: new MutationCache({ onError: (error) => notifyRef.current(error) }),
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <ConfigProvider theme={appTheme} locale={viVN}>
      <AntApp>
        <GlobalErrorToast register={register} />
        <QueryClientProvider client={queryClient}>
          <AuthProvider api={authApi}>{children}</AuthProvider>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
};
