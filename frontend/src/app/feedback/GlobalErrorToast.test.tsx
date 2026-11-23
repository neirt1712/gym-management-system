import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/mockApi';
import { renderApp } from '../../test/renderApp';

describe('GlobalErrorToast', () => {
  it('API trả 403 thì báo không có quyền', async () => {
    mockApi({
      'GET /orders': {
        status: 403,
        body: { error: { code: 'FORBIDDEN', message: 'x', details: null, requestId: 'r1' } },
      },
    });
    renderApp('/member/orders', 'MEMBER');
    expect(await screen.findByText('Bạn không có quyền làm việc này.')).toBeInTheDocument();
  });

  it('không tới được máy chủ thì nhắc kiểm tra mạng', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    renderApp('/member/orders', 'MEMBER');
    expect(
      await screen.findByText('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', undefined, {
        timeout: 8000,
      }),
    ).toBeInTheDocument();
  });
});
