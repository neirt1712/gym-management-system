import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderApp } from '../../test/renderApp';

// Gõ nhiều ô và mở hộp thoại: máy chậm, CI tải nặng cần hơn 20 giây mặc định
vi.setConfig({ testTimeout: 60_000 });

const MEMBER = {
  id: '55555555-5555-4555-8555-555555555555',
  userId: '66666666-6666-4666-8666-666666666666',
  memberCode: 'HV000123',
  fullName: 'Nguyễn Văn An',
  phone: '0901234567',
  email: null,
  dob: null,
  avatarUrl: null,
  accountStatus: 'ACTIVE',
  accountActivated: true,
  hasActiveSubscription: false,
  createdAt: '2026-10-08T09:30:00+07:00',
};
const MEMBER_DETAIL = { ...MEMBER, subscriptions: [], currentCheckIn: null };

const PAYMENT = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  orderId: '99999999-9999-4999-8999-999999999999',
  member: {
    id: MEMBER.id,
    memberCode: MEMBER.memberCode,
    fullName: MEMBER.fullName,
    phone: MEMBER.phone,
    avatarUrl: null,
  },
  method: 'CASH',
  amount: 500000,
  status: 'PENDING',
  merchantRef: 'GYM20261108090000ABCD',
  gatewayTxnId: null,
  checkoutUrl: null,
  confirmedBy: null,
  paidAt: null,
  createdAt: '2026-11-08T09:00:00+07:00',
};

const list = (items: unknown[]) => ({
  status: 200,
  body: { data: items, meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } },
});

describe('Quầy: hội viên (UC19, UC20)', () => {
  it('danh sách hiện hội viên, bấm Xem thì mở chi tiết', async () => {
    mockApi({
      'GET /members': list([MEMBER]),
      [`GET /members/${MEMBER.id}`]: { status: 200, body: MEMBER_DETAIL },
      'GET /orders': list([]),
    });
    const router = renderApp('/staff/members', 'STAFF');
    const user = userEvent.setup({ delay: null });

    const row = (await screen.findByText('HV000123')).closest('tr') as HTMLElement;
    expect(within(row).getByText('Khách hàng (chưa có gói)')).toBeInTheDocument();
    await user.click(within(row).getByRole('button', { name: 'Xem' }));
    expect(router.state.location.pathname).toBe(`/staff/members/${MEMBER.id}`);
    expect(await screen.findByText('Chưa có gói đang hiệu lực')).toBeInTheDocument();
  });

  it('thêm hội viên xong thì mở hồ sơ vừa tạo', async () => {
    const fetchMock = mockApi({
      'GET /members': list([]),
      'POST /members': { status: 201, body: MEMBER_DETAIL },
      [`GET /members/${MEMBER.id}`]: { status: 200, body: MEMBER_DETAIL },
      'GET /orders': list([]),
    });
    const router = renderApp('/staff/members', 'STAFF');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('button', { name: 'Thêm hội viên' }));
    await user.type(screen.getByLabelText('Họ tên'), 'Nguyễn Văn An');
    await user.type(screen.getByLabelText('Số điện thoại'), '0901234567');
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Thêm hội viên' }));

    expect(await screen.findByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/staff/members/${MEMBER.id}`);
    const call = fetchMock.mock.calls.find(([r]) => r.method === 'POST');
    expect(await call?.[0].clone().json()).toEqual({
      fullName: 'Nguyễn Văn An',
      phone: '0901234567',
      email: null,
      dob: null,
    });
  });
});

describe('Quầy: xác nhận tiền mặt (UC13)', () => {
  it('nhập đúng số tiền thì gửi confirm-cash', async () => {
    const fetchMock = mockApi({
      'GET /payments': list([PAYMENT]),
      [`POST /payments/${PAYMENT.id}/confirm-cash`]: {
        status: 200,
        body: { ...PAYMENT, status: 'SUCCESS' },
      },
    });
    renderApp('/staff/payments', 'STAFF');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('button', { name: 'Thu tiền' }));
    await user.type(screen.getByLabelText('Số tiền đã nhận'), '500000');
    await user.click(screen.getByRole('button', { name: 'Xác nhận thanh toán' }));

    expect(await screen.findByText('Đã thu tiền')).toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([r]) => r.url.endsWith('/confirm-cash'));
    expect(await call?.[0].clone().json()).toEqual({ receivedAmount: 500000 });
  });

  it('nhập sai số tiền thì báo ngay, không gửi', async () => {
    const fetchMock = mockApi({ 'GET /payments': list([PAYMENT]) });
    renderApp('/staff/payments', 'STAFF');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('button', { name: 'Thu tiền' }));
    await user.type(screen.getByLabelText('Số tiền đã nhận'), '400000');
    await user.click(screen.getByRole('button', { name: 'Xác nhận thanh toán' }));

    expect(await screen.findByText('Số tiền phải bằng 500.000 ₫')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([r]) => r.url.endsWith('/confirm-cash'))).toBe(false);
  });
});
