import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DESK_PROFILE_PHONE } from '../../features/auth/fakeAuthApi';
import { renderApp } from '../../test/renderApp';

const fill = async (phone: string, password = 'matkhau123', confirm = password) => {
  const user = userEvent.setup();
  await user.click(await screen.findByLabelText('Họ và tên'));
  await user.paste('Trần Văn Bảo');
  await user.click(screen.getByLabelText('Số điện thoại'));
  await user.paste(phone);
  await user.click(screen.getByLabelText('Mật khẩu'));
  await user.paste(password);
  await user.click(screen.getByLabelText('Nhập lại mật khẩu'));
  await user.paste(confirm);
  await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
};

describe('RegisterPage', () => {
  it('đăng ký xong thì vào luôn trang hội viên', async () => {
    const router = renderApp('/register');
    await fill('0912345678');
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/member');
  });

  it('hai mật khẩu không khớp thì báo ngay trên form', async () => {
    renderApp('/register');
    await fill('0912345678', 'matkhau123', 'matkhau999');
    expect(await screen.findByText('Hai mật khẩu chưa khớp.')).toBeInTheDocument();
  });

  it('SĐT đã có hồ sơ tại quầy thì hướng dẫn kích hoạt, không báo trùng', async () => {
    renderApp('/register');
    await fill(DESK_PROFILE_PHONE);
    expect(await screen.findByText('Số điện thoại này đã có hồ sơ tại quầy')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kích hoạt' })).toHaveAttribute('href', '/activate');
  });
});
