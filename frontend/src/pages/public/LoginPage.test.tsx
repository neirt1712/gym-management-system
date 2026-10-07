import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '../../features/auth/fakeAuthApi';
import { renderApp } from '../../test/renderApp';

const fillAndSubmit = async (identifier: string, password: string) => {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Số điện thoại hoặc email'), identifier);
  await user.type(screen.getByLabelText('Mật khẩu'), password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
};

describe('LoginPage', () => {
  it('sai mật khẩu thì hiện thông điệp theo error.code', async () => {
    renderApp('/login');
    await fillAndSubmit('0900000001', 'sai-mat-khau');
    expect(await screen.findByText('Sai tài khoản hoặc mật khẩu.')).toBeInTheDocument();
  });

  it('đăng nhập đúng thì về trang chính theo vai trò', async () => {
    const router = renderApp('/login');
    await fillAndSubmit('0900000002', DEMO_PASSWORD);
    expect(await screen.findByRole('heading', { name: 'Lịch tập' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/trainer/schedule');
  });

  it('có ?next thì quay lại đúng trang đang mở', async () => {
    const router = renderApp(`/login?next=${encodeURIComponent('/member/orders')}`);
    await fillAndSubmit('0900000001', DEMO_PASSWORD);
    expect(await screen.findByRole('heading', { name: 'Đơn và thanh toán' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/member/orders');
  });

  it('không cho ?next chuyển ra trang ngoài', async () => {
    const router = renderApp(`/login?next=${encodeURIComponent('//evil.example')}`);
    await fillAndSubmit('0900000001', DEMO_PASSWORD);
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/member');
  });
});
