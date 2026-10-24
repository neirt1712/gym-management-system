import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderApp } from '../../test/renderApp';
import {
  ERR_PENDING_ORDER_EXISTS,
  ORDER_PENDING,
  PACKAGE_GYM,
  PAYMENT_CASH_PENDING,
  QUOTE,
} from '../../test/fixtures';

const PKG = `/packages/${PACKAGE_GYM.id}`;
const ORDER = `/orders/${ORDER_PENDING.id}`;

describe('PurchasePage (PurchaseFlow)', () => {
  it('chọn ngày → báo giá (ngày kết thúc do BE tính) → tạo đơn → trả tiền mặt → mở đơn', async () => {
    const fetchMock = mockApi({
      [`GET ${PKG}`]: { status: 200, body: PACKAGE_GYM },
      'POST /orders/quote': { status: 200, body: QUOTE },
      'POST /orders': { status: 201, body: ORDER_PENDING },
      [`POST ${ORDER}/payments`]: { status: 201, body: PAYMENT_CASH_PENDING },
      [`GET ${ORDER}`]: { status: 200, body: ORDER_PENDING },
    });
    const router = renderApp(`/member/purchase/${PACKAGE_GYM.id}`, 'MEMBER');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Xem báo giá' }));
    expect(await screen.findByText('09/11/2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tạo đơn' }));
    await user.click(await screen.findByText('Tiền mặt tại quầy'));
    await user.click(screen.getByRole('button', { name: 'Chọn trả tiền mặt' }));

    expect(await screen.findByRole('heading', { name: /Đơn Gym 1 tháng/ })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/member${ORDER}`);
    const paymentCall = fetchMock.mock.calls.find(([r]) => r.url.endsWith('/payments'));
    expect(await paymentCall?.[0].clone().json()).toEqual({ method: 'CASH' });
  });

  it('đã có đơn chờ cùng gói thì mời mở lại đơn đó', async () => {
    mockApi({
      [`GET ${PKG}`]: { status: 200, body: PACKAGE_GYM },
      'POST /orders/quote': { status: 200, body: QUOTE },
      'POST /orders': { status: 409, body: ERR_PENDING_ORDER_EXISTS },
      [`GET ${ORDER}`]: { status: 200, body: ORDER_PENDING },
    });
    const router = renderApp(`/member/purchase/${PACKAGE_GYM.id}`, 'MEMBER');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Xem báo giá' }));
    await user.click(await screen.findByRole('button', { name: 'Tạo đơn' }));
    await user.click(await screen.findByRole('button', { name: 'Mở đơn đang chờ' }));
    expect(router.state.location.pathname).toBe(`/member${ORDER}`);
  });

  it('không tải được gói thì hiện Thử lại', async () => {
    mockApi({});
    renderApp(`/member/purchase/${PACKAGE_GYM.id}`, 'MEMBER');
    expect(await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 5000 })).toBeInTheDocument();
  });
});
