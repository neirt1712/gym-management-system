import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { authApi } from '../features/auth';
import { AppProviders } from './AppProviders';
import { createAppRouter } from './router';

export const App = () => {
  const [router] = useState(createAppRouter);
  return (
    <AppProviders authApi={authApi}>
      <RouterProvider router={router} />
    </AppProviders>
  );
};
