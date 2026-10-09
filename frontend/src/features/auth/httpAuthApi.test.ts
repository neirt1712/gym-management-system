import { describe, expect, it } from 'vitest';
import { createApiClient } from '../../api/client';
import { createHttpAuthApi } from './httpAuthApi';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const SESSION = {
  accessToken: 'jwt',
  expiresIn: 900,
  user: {
    id: 'u1',
    fullName: 'Hoàng Thu Quầy',
    role: 'STAFF',
    phone: '0900000002',
    email: null,
    avatarUrl: null,
  },
};

const withBackend = (handler: (req: Request) => Response | Promise<Response>) =>
  createHttpAuthApi(
    createApiClient({ baseUrl: 'http://localhost/api/v1', fetchFn: async (r) => handler(r) }).client,
  );

describe('httpAuthApi', () => {
  it('đăng nhập gửi { phone, password } và đổi response sang phiên nội bộ', async () => {
    let sent = '';
    const api = withBackend(async (req) => {
      sent = await req.text();
      return json(200, SESSION);
    });
    const session = await api.login({ phone: '0900000002', password: 'matkhau123' });
    expect(session).toEqual({ accessToken: 'jwt', user: SESSION.user });
    expect(JSON.parse(sent)).toEqual({ phone: '0900000002', password: 'matkhau123' });
  });

  it('sai mật khẩu ném lỗi theo error.code', async () => {
    const api = withBackend(() =>
      json(401, { error: { code: 'INVALID_CREDENTIALS', message: 'x', details: null, requestId: 'r' } }),
    );
    await expect(api.login({ phone: '0900000002', password: 'sai' })).rejects.toMatchObject({
      error: { code: 'INVALID_CREDENTIALS' },
    });
  });

  it('refresh không có cookie (401) là chưa đăng nhập, không ném lỗi', async () => {
    const api = withBackend(() =>
      json(401, { error: { code: 'UNAUTHENTICATED', message: 'x', details: null, requestId: 'r' } }),
    );
    expect(await api.refresh()).toBeNull();
  });
});
