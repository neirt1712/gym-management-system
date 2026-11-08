import { vi } from 'vitest';

type Reply = { status: number; body?: unknown };

/**
 * Giả lập backend trong test: thay `fetch` toàn cục, trả lời theo khóa `"<METHOD> <đường dẫn sau /api/v1>"`.
 * Khóa không có trong bảng thì trả 404 NOT_FOUND. `setup.ts` tự gỡ sau mỗi test.
 */
export const mockApi = (handlers: Record<string, Reply | (() => Reply)>) => {
  const fetchMock = vi.fn(async (request: Request) => {
    const path = new URL(request.url).pathname.replace(/^\/api\/v1/, '');
    const handler = handlers[`${request.method} ${path}`];
    const { status, body } = handler
      ? typeof handler === 'function'
        ? handler()
        : handler
      : {
          status: 404,
          body: { error: { code: 'NOT_FOUND', message: 'Not found', details: null, requestId: 'test' } },
        };
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};
