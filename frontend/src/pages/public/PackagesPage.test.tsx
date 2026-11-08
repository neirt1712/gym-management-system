import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderApp } from '../../test/renderApp';
import { PACKAGE_GYM } from '../../test/fixtures';

const PACKAGE_PT = {
  ...PACKAGE_GYM,
  id: '88888888-8888-4888-8888-888888888888',
  name: 'PT 12 buổi',
  type: 'PT',
  price: 3600000,
  totalSessions: 12,
  sessionMinutes: 60,
  benefits: [],
} as const;

const listOf = (items: unknown[]) => ({
  status: 200,
  body: { data: items, meta: { page: 1, pageSize: 100, total: items.length, totalPages: 1 } },
});

describe('PackagesPage (UC07)', () => {
  it('hội viên thấy danh sách gói và bấm Mua gói thì sang trang mua', async () => {
    mockApi({
      'GET /packages': listOf([PACKAGE_GYM, PACKAGE_PT]),
      [`GET /packages/${PACKAGE_GYM.id}`]: { status: 200, body: PACKAGE_GYM },
    });
    const router = renderApp('/packages', 'MEMBER');
    const user = userEvent.setup();

    expect(await screen.findByText('PT 12 buổi')).toBeInTheDocument();
    expect(screen.getByText('Tủ đồ miễn phí')).toBeInTheDocument();
    const [buyGym] = screen.getAllByRole('button', { name: 'Mua gói' });
    expect(buyGym).toBeDefined();
    await user.click(buyGym as HTMLElement);
    expect(router.state.location.pathname).toBe(`/member/purchase/${PACKAGE_GYM.id}`);
  });

  it('lọc loại PT thì gửi type=PT', async () => {
    const fetchMock = mockApi({ 'GET /packages': listOf([PACKAGE_GYM]) });
    renderApp('/packages');
    const user = userEvent.setup();

    await screen.findByText('Gym 1 tháng');
    await user.click(screen.getByText('PT'));
    const urls = fetchMock.mock.calls.map(([r]) => new URL(r.url));
    expect(urls.some((u) => u.searchParams.get('type') === 'PT')).toBe(true);
  });

  it('không có gói thì mời xem tất cả', async () => {
    mockApi({ 'GET /packages': listOf([]) });
    renderApp('/packages');
    expect(await screen.findByRole('button', { name: 'Xem tất cả gói' })).toBeInTheDocument();
  });

  it('lỗi thì hiện Thử lại', async () => {
    mockApi({
      'GET /packages': {
        status: 500,
        body: { error: { code: 'INTERNAL_ERROR', message: 'x', details: null, requestId: 'r1' } },
      },
    });
    renderApp('/packages');
    expect(await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 5000 })).toBeInTheDocument();
  });
});
