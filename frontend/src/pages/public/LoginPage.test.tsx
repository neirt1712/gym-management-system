import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '../../features/auth/fakeAuthApi';
import { renderApp } from '../../test/renderApp';

/** Dán cả chuỗi thay vì gõ từng ký tự: ô nhập Ant Design xử lý mỗi phím khá nặng, gõ từng ký tự làm test chậm và chập chờn. */
const fillAndSubmit = async (phone: string, password: string) => {
  const user = userEvent.setup();
  await user.click(await screen.findByLabelText('Số điện thoại'));
  await user.paste(phone);
  await user.click(screen.getByLabelText('Mật khẩu'));
  await user.paste(password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
};

describe('LoginPage', () => {
  it('sai mật khẩu thì hiện thông điệp theo error.code', async () => {
    renderApp('/login');
    await fillAndSubmit('0901234567', 'sai-mat-khau');
    expect(await screen.findByText('Sai tài khoản hoặc mật khẩu.')).toBeInTheDocument();
  });

  it('đăng nhập đúng thì về trang chính theo vai trò', async () => {
    const router = renderApp('/login');
    await fillAndSubmit('0900000003', DEMO_PASSWORD);
    expect(await screen.findByRole('heading', { name: 'Lịch tập' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/trainer/schedule');
  });

  it('có ?next thì quay lại đúng trang đang mở', async () => {
    const router = renderApp(`/login?next=${encodeURIComponent('/member/orders')}`);
    await fillAndSubmit('0901234567', DEMO_PASSWORD);
    expect(await screen.findByRole('heading', { name: 'Đơn và thanh toán' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/member/orders');
  });

  it('không cho ?next chuyển ra trang ngoài', async () => {
    const router = renderApp(`/login?next=${encodeURIComponent('//evil.example')}`);
    await fillAndSubmit('0901234567', DEMO_PASSWORD);
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/member');
  });
});
