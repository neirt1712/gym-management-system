import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';

describe('route guard', () => {
  it('chưa đăng nhập thì về trang đăng nhập, giữ lại ?next', async () => {
    const router = renderApp('/member/appointments');
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/member/appointments')}`);
  });

  it('đúng vai trò thì vào được trang', async () => {
    renderApp('/member', 'u-member');
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument();
  });

  it('sai vai trò thì về trang 403', async () => {
    const router = renderApp('/admin', 'u-staff');
    expect(await screen.findByText('Bạn không có quyền xem trang này')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/403');
  });

  it('đường dẫn không tồn tại thì hiện 404', async () => {
    renderApp('/khong-co-trang-nay');
    expect(await screen.findByText('Không tìm thấy trang')).toBeInTheDocument();
  });
});
