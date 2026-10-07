import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppProviders } from '../app/AppProviders';
import { routes } from '../app/router';
import { createFakeAuthApi, FAKE_SESSION_KEY } from '../features/auth/fakeAuthApi';

/** Render cả app tại một đường dẫn. signedInAs: id tài khoản mẫu (u-member, u-trainer, u-staff, u-admin). */
export const renderApp = (path: string, signedInAs?: string) => {
  if (signedInAs) sessionStorage.setItem(FAKE_SESSION_KEY, signedInAs);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders authApi={createFakeAuthApi({ delayMs: 0 })}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
};
