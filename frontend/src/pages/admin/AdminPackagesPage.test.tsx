import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderApp } from '../../test/renderApp';
import { PACKAGE_GYM } from '../../test/fixtures';

const list = (items: unknown[]) => ({
  status: 200,
  body: { data: items, meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } },
});
const bodyOf = async (fetchMock: ReturnType<typeof mockApi>, method: string) =>
  fetchMock.mock.calls
    .find(([r]) => r.method === method)?.[0]
    .clone()
    .json();

describe('AdminPackagesPage (UC08)', () => {
  it('tắt công tắc Đang bán thì gửi status INACTIVE', async () => {
    const fetchMock = mockApi({
      'GET /packages': list([PACKAGE_GYM]),
      [`PATCH /packages/${PACKAGE_GYM.id}`]: { status: 200, body: { ...PACKAGE_GYM, status: 'INACTIVE' } },
    });
    renderApp('/admin/packages', 'ADMIN');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('switch', { name: 'Đang bán Gym 1 tháng' }));
    expect(await screen.findByText('Đã ngừng bán')).toBeInTheDocument();
    expect(await bodyOf(fetchMock, 'PATCH')).toEqual({ status: 'INACTIVE' });
  });

  it('thêm gói PT bắt buộc số buổi, gửi đủ điều khoản', async () => {
    const fetchMock = mockApi({
      'GET /packages': list([]),
      'POST /packages': { status: 201, body: { ...PACKAGE_GYM, id: 'new', type: 'PT' } },
    });
    renderApp('/admin/packages', 'ADMIN');
    const user = userEvent.setup({ delay: null });

    await user.click(await screen.findByRole('button', { name: 'Thêm gói' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText('Tên gói'), 'PT 12 buổi');
    await user.click(within(dialog).getByText('Có PT'));
    await user.clear(within(dialog).getByLabelText('Giá'));
    await user.type(within(dialog).getByLabelText('Giá'), '6000000');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu gói' }));
    expect(await within(dialog).findByText('Gói PT cần số buổi')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Số buổi PT'), '12');
    await user.type(within(dialog).getByLabelText('Phút mỗi buổi'), '60');
    await user.click(within(dialog).getByRole('button', { name: /Thêm quyền lợi/ }));
    await user.type(within(dialog).getByLabelText('Quyền lợi 1'), 'Tập 1 kèm 1');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu gói' }));

    expect(await screen.findByText('Đã lưu gói')).toBeInTheDocument();
    expect(await bodyOf(fetchMock, 'POST')).toEqual({
      name: 'PT 12 buổi',
      description: null,
      type: 'PT',
      price: 6000000,
      durationValue: 1,
      durationUnit: 'MONTH',
      totalSessions: 12,
      sessionMinutes: 60,
      includesClass: false,
      benefits: ['Tập 1 kèm 1'],
    });
    // Form dài, gõ nhiều ô: cho thêm thời gian trên máy chậm
  }, 60_000);

  it('Staff không vào được trang quản trị gói', async () => {
    mockApi({ 'GET /packages': list([]) });
    const router = renderApp('/admin/packages', 'STAFF');
    await screen.findByText(/không có quyền/i);
    expect(router.state.location.pathname).not.toBe('/admin/packages');
  });
});
