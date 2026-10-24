import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderApp } from '../../test/renderApp';

const ME = {
  id: '44444444-4444-4444-8444-444444444444',
  fullName: 'Nguyễn Văn An',
  phone: '0901234567',
  email: 'an.nguyen@example.com',
  dob: null,
  avatarUrl: null,
  role: 'MEMBER',
  status: 'ACTIVE',
  shift: null,
  member: { id: 'm1', memberCode: 'HV000123', qrToken: 'qr', hasActiveSubscription: true },
  trainer: null,
  createdAt: '2026-10-05T09:00:00+07:00',
};

describe('ProfilePage', () => {
  it('đang tải thì hiện khung xương, xong thì hiện hồ sơ', async () => {
    mockApi({ 'GET /me': { status: 200, body: ME } });
    renderApp('/me/profile', 'MEMBER');
    expect(await screen.findByRole('heading', { name: 'Hồ sơ của tôi' })).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(await screen.findByText('HV000123')).toBeInTheDocument();
    expect(screen.getByLabelText('Họ và tên')).toHaveValue('Nguyễn Văn An');
  });

  it('lỗi thì hiện Thử lại và mã yêu cầu', async () => {
    mockApi({
      'GET /me': {
        status: 500,
        body: { error: { code: 'INTERNAL_ERROR', message: 'x', details: null, requestId: 'req-42' } },
      },
    });
    renderApp('/me/profile', 'MEMBER');
    expect(await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Mã yêu cầu: req-42')).toBeInTheDocument();
  });

  it('đổi mật khẩu sai mật khẩu hiện tại thì báo ngay ở ô đó', async () => {
    mockApi({ 'GET /me': { status: 200, body: ME } });
    renderApp('/me/profile', 'MEMBER');
    const user = userEvent.setup();
    await user.click(await screen.findByLabelText('Mật khẩu hiện tại'));
    await user.paste('sai-mat-khau');
    await user.click(screen.getByLabelText('Mật khẩu mới'));
    await user.paste('matkhaumoi456');
    await user.click(screen.getByLabelText('Nhập lại mật khẩu mới'));
    await user.paste('matkhaumoi456');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    expect(await screen.findByText('Mật khẩu hiện tại không đúng')).toBeInTheDocument();
  });
});
