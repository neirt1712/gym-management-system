import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderApp } from '../../test/renderApp';
import { SUBSCRIPTION_PT_LIST } from '../../test/fixtures';

const ME = {
  id: '44444444-4444-4444-8444-444444444444',
  fullName: 'Nguyễn Văn An',
  phone: '0901234567',
  email: null,
  dob: null,
  avatarUrl: null,
  role: 'MEMBER',
  status: 'ACTIVE',
  shift: null,
  member: { id: 'm1', memberCode: 'HV000123', qrToken: 'qr-token', hasActiveSubscription: true },
  trainer: null,
  createdAt: '2026-10-05T09:00:00+07:00',
};

describe('MemberHomePage', () => {
  it('hiện gói đang có với số buổi BE tính sẵn, và mã QR', async () => {
    mockApi({
      'GET /subscriptions': { status: 200, body: SUBSCRIPTION_PT_LIST },
      'GET /me': { status: 200, body: ME },
    });
    renderApp('/member', 'MEMBER');
    expect(await screen.findByText('PT 12 buổi')).toBeInTheDocument();
    expect(screen.getByText('Còn 9/12 buổi')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Phóng to mã QR' })).toBeInTheDocument();
  });

  it('chưa có gói thì mời xem gói tập', async () => {
    mockApi({
      'GET /subscriptions': {
        status: 200,
        body: { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } },
      },
      'GET /me': { status: 200, body: ME },
    });
    renderApp('/member', 'MEMBER');
    expect(await screen.findByText('Bạn chưa có gói nào đang hiệu lực')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xem gói tập' })).toBeInTheDocument();
  });
});
