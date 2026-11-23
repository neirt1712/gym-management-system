import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppProviders } from '../app/AppProviders';
import { routes } from '../app/router';
import type { Role } from '../app/roles';
import { createFakeAuthApi, DEMO_ACCOUNTS, FAKE_SESSION_KEY } from '../features/auth/fakeAuthApi';

/** Render cả app tại một đường dẫn. signedInAs: đăng nhập sẵn bằng tài khoản mẫu của vai trò đó. */
export const renderApp = (path: string, signedInAs?: Role) => {
  const account = DEMO_ACCOUNTS.find((a) => a.role === signedInAs && !a.locked);
  if (account) sessionStorage.setItem(FAKE_SESSION_KEY, account.id);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders authApi={createFakeAuthApi({ delayMs: 0 })}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
};
