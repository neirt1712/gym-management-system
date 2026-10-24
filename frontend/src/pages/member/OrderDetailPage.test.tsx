import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderApp } from '../../test/renderApp';
import { ORDER_PAID, ORDER_PENDING } from '../../test/fixtures';

describe('OrderDetailPage', () => {
  it('đơn đã trả thì hiện biên lai và nút in', async () => {
    mockApi({ [`GET /orders/${ORDER_PAID.id}`]: { status: 200, body: ORDER_PAID } });
    renderApp(`/member/orders/${ORDER_PAID.id}`, 'MEMBER');
    expect(await screen.findByText(/Biên lai BL-20261008-0001/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /In biên lai/ })).toBeInTheDocument();
  });

  it('đơn chờ thanh toán thì cho chọn phương thức và hủy đơn', async () => {
    mockApi({ [`GET /orders/${ORDER_PENDING.id}`]: { status: 200, body: ORDER_PENDING } });
    renderApp(`/member/orders/${ORDER_PENDING.id}`, 'MEMBER');
    expect(await screen.findByRole('button', { name: 'Thanh toán qua VNPay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy đơn' })).toBeInTheDocument();
  });
});
