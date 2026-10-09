import { describe, expect, it, vi } from 'vitest';
import { createApiClient, unwrap, type ApiAuthHooks } from './client';

const BASE = 'http://localhost/api/v1';
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const ME = { id: 'u1', fullName: 'An', role: 'MEMBER' };
const UNAUTH = { error: { code: 'UNAUTHENTICATED', message: 'x', details: null, requestId: 'r1' } };

/** Backend giả: chấp nhận đúng một token, còn lại trả 401. */
const setup = (validToken: string, hooks: Partial<ApiAuthHooks> = {}) => {
  let token: string | null = 'cu';
  const fetchFn = vi.fn(async (req: Request) =>
    req.headers.get('Authorization') === `Bearer ${validToken}` ? json(200, ME) : json(401, UNAUTH),
  );
  const auth = {
    getAccessToken: () => token,
    refresh: vi.fn(async () => {
      token = 'moi';
      return token;
    }),
    onSessionExpired: vi.fn(),
    ...hooks,
  };
  const { client, configureAuth } = createApiClient({ baseUrl: BASE, fetchFn });
  configureAuth(auth);
  return { client, fetchFn, auth };
};

describe('api client', () => {
  it('gắn access token vào header Authorization', async () => {
    const { client, fetchFn } = setup('cu');
    const result = await client.GET('/me');
    expect(unwrap(result)).toMatchObject({ id: 'u1' });
    expect(fetchFn.mock.calls[0]?.[0].headers.get('Authorization')).toBe('Bearer cu');
  });

  it('3 request cùng gặp 401 thì chỉ gọi refresh 1 lần rồi gửi lại cả 3', async () => {
    const { client, auth } = setup('moi');
    const results = await Promise.all([client.GET('/me'), client.GET('/me'), client.GET('/me')]);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(results.map((r) => r.response.status)).toEqual([200, 200, 200]);
  });

  it('refresh thất bại thì báo hết phiên và trả lỗi UNAUTHENTICATED', async () => {
    const { client, auth } = setup('moi', { refresh: vi.fn(async () => null) });
    const result = await client.GET('/me');
    expect(auth.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(() => unwrap(result)).toThrow();
    expect(result.error).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  });

  it('sai mật khẩu khi đăng nhập (401) không gọi refresh', async () => {
    const { client, auth } = setup('khong-ai-co');
    const result = await client.POST('/auth/login', { body: { phone: '0901234567', password: 'sai' } });
    expect(result.response.status).toBe(401);
    expect(auth.refresh).not.toHaveBeenCalled();
  });

  it('gửi lại request có body sau khi refresh', async () => {
    const seen: string[] = [];
    const { client, configureAuth } = createApiClient({
      baseUrl: BASE,
      fetchFn: async (req) => {
        seen.push(await req.text());
        return req.headers.get('Authorization') === 'Bearer moi' ? json(200, ME) : json(401, UNAUTH);
      },
    });
    let token: string | null = 'cu';
    configureAuth({
      getAccessToken: () => token,
      refresh: async () => (token = 'moi'),
      onSessionExpired: () => {},
    });
    await client.PATCH('/me', { body: { fullName: 'An Nguyễn' } });
    expect(seen).toHaveLength(2);
    expect(seen[1]).toContain('An Nguyễn');
  });
});
