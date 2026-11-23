import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { mockApi } from '../test/mockApi';
import { renderApp } from '../test/renderApp';

// Các form ở đây gõ nhiều ô, máy chậm cần hơn 20 giây mặc định
vi.setConfig({ testTimeout: 60_000 });

const MEMBER_REF = {
  id: '55555555-5555-4555-8555-555555555555',
  memberCode: 'HV000123',
  fullName: 'Nguyễn Văn An',
  phone: '0901234567',
  avatarUrl: null,
};
const APPOINTMENT_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const APPOINTMENT = {
  id: APPOINTMENT_ID,
  member: MEMBER_REF,
  trainer: { id: '20000000-0000-4000-8000-000000000003', fullName: 'PT Tăng Cơ', avatarUrl: null },
  subscription: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', packageName: 'PT 12 buổi' },
  status: 'PENDING',
  awaitingRole: 'MEMBER',
  version: 2,
  startsAt: '2026-11-10T18:00:00+07:00',
  endsAt: '2026-11-10T19:00:00+07:00',
  note: null,
  openProposal: null,
  completedBy: null,
  completedAt: null,
  allowedActions: ['ACCEPT', 'REJECT', 'COUNTER'],
  proposals: [
    {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      kind: 'COUNTER',
      proposedBy: { id: '00000000-0000-4000-8000-000000000003', fullName: 'PT Tăng Cơ' },
      proposedRole: 'TRAINER',
      startsAt: '2026-11-10T18:00:00+07:00',
      endsAt: '2026-11-10T19:00:00+07:00',
      note: null,
      status: 'OPEN',
      rejectReason: null,
      createdAt: '2026-11-08T09:00:00+07:00',
    },
  ],
};
const ERR = (code: string) => ({ error: { code, message: code, details: null, requestId: 'r1' } });
const list = (items: unknown[], extra: object = {}) => ({
  status: 200,
  body: { data: items, meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1, ...extra } },
});
const bodyOf = async (fetchMock: ReturnType<typeof mockApi>, urlEnd: string) =>
  fetchMock.mock.calls
    .find(([r]) => r.url.endsWith(urlEnd))?.[0]
    .clone()
    .json();

describe('Chi tiết lịch PT (UC24)', () => {
  it('chỉ hiện nút trong allowedActions; Đồng ý gửi expectedVersion', async () => {
    const fetchMock = mockApi({
      [`GET /appointments/${APPOINTMENT_ID}`]: { status: 200, body: APPOINTMENT },
      [`POST /appointments/${APPOINTMENT_ID}/accept`]: {
        status: 200,
        body: { ...APPOINTMENT, status: 'CONFIRMED', version: 3, allowedActions: [] },
      },
    });
    renderApp(`/member/appointments/${APPOINTMENT_ID}`, 'MEMBER');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('button', { name: 'Đồng ý' }));
    expect(screen.queryByRole('button', { name: 'Xin hủy lịch' })).not.toBeInTheDocument();
    expect(await screen.findByText('Đã đồng ý')).toBeInTheDocument();
    expect(await bodyOf(fetchMock, '/accept')).toEqual({ expectedVersion: 2 });
  });

  it('gặp STALE_VERSION thì báo và tải lại lịch', async () => {
    let loads = 0;
    mockApi({
      [`GET /appointments/${APPOINTMENT_ID}`]: () => {
        loads += 1;
        return { status: 200, body: APPOINTMENT };
      },
      [`POST /appointments/${APPOINTMENT_ID}/accept`]: { status: 409, body: ERR('STALE_VERSION') },
    });
    renderApp(`/member/appointments/${APPOINTMENT_ID}`, 'MEMBER');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('button', { name: 'Đồng ý' }));
    expect(await screen.findByText('Lịch vừa được bên kia cập nhật. Đã tải lại.')).toBeInTheDocument();
    expect(loads).toBeGreaterThanOrEqual(2);
  });

  it('từ chối bắt buộc lý do', async () => {
    const fetchMock = mockApi({
      [`GET /appointments/${APPOINTMENT_ID}`]: { status: 200, body: APPOINTMENT },
      [`POST /appointments/${APPOINTMENT_ID}/reject`]: {
        status: 200,
        body: { ...APPOINTMENT, status: 'REJECTED' },
      },
    });
    renderApp(`/member/appointments/${APPOINTMENT_ID}`, 'MEMBER');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('button', { name: 'Từ chối' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Từ chối' }));
    expect(await within(dialog).findByText('Nhập lý do')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Lý do'), 'Bận việc');
    await user.click(within(dialog).getByRole('button', { name: 'Từ chối' }));
    expect(await screen.findByText('Đã từ chối')).toBeInTheDocument();
    expect(await bodyOf(fetchMock, '/reject')).toEqual({ expectedVersion: 2, reason: 'Bận việc' });
  });
});

describe('Check-in (UC16)', () => {
  it('check-in bằng SĐT, gói sắp hết hạn thì cảnh báo', async () => {
    const fetchMock = mockApi({
      'GET /check-ins': list([]),
      'POST /check-ins': {
        status: 201,
        body: {
          id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          member: MEMBER_REF,
          subscription: { id: 'x', packageName: 'Gym 1 tháng', endsOn: '2026-11-12', daysLeft: 5 },
          method: 'PHONE',
          checkedInAt: '2026-11-08T18:00:00+07:00',
          checkedOutAt: null,
          checkoutType: null,
          checkedInBy: null,
          expiringSoon: true,
        },
      },
    });
    renderApp('/staff/check-in', 'STAFF');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByText('Số điện thoại'));
    await user.type(screen.getByRole('textbox', { name: 'Số điện thoại' }), '0901234567');
    await user.click(screen.getByRole('button', { name: 'Check-in' }));
    expect(await screen.findByText(/sắp hết hạn/)).toBeInTheDocument();
    expect(await bodyOf(fetchMock, '/check-ins')).toEqual({ phone: '0901234567' });
  });
});

describe('Tài khoản (UC34)', () => {
  it('khóa tài khoản bắt buộc lý do', async () => {
    const STAFF_USER = {
      id: '00000000-0000-4000-8000-000000000011',
      fullName: 'Lễ Tân Ca Sáng',
      phone: '0900000011',
      email: null,
      dob: null,
      avatarUrl: null,
      role: 'STAFF',
      status: 'ACTIVE',
      shift: 'Ca sáng',
      trainer: null,
      createdAt: '2026-10-08T09:00:00+07:00',
    };
    const fetchMock = mockApi({
      'GET /users': list([STAFF_USER]),
      [`PATCH /users/${STAFF_USER.id}/status`]: { status: 200, body: { ...STAFF_USER, status: 'LOCKED' } },
    });
    renderApp('/admin/users', 'ADMIN');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('button', { name: 'Khóa' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Lý do'), 'Nghỉ việc');
    await user.click(within(dialog).getByRole('button', { name: 'Khóa tài khoản' }));
    expect(await screen.findByText('Đã khóa tài khoản')).toBeInTheDocument();
    expect(await bodyOf(fetchMock, '/status')).toEqual({ status: 'LOCKED', reason: 'Nghỉ việc' });
  });
});

describe('Chuông thông báo (UC42)', () => {
  it('hiện số chưa đọc trên thanh trên cùng', async () => {
    mockApi({
      'GET /notifications': list([], { unreadCount: 3 }),
      'GET /subscriptions': list([]),
    });
    renderApp('/member', 'MEMBER');
    expect(await screen.findByRole('button', { name: 'Thông báo, 3 chưa đọc' })).toBeInTheDocument();
  });
});
