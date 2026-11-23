import createClient from 'openapi-fetch';
import type { paths } from './schema';

/**
 * Nơi duy nhất gọi API (frontend/CLAUDE.md). Kiểu lấy từ schema.d.ts, sinh bằng `npm run gen:api`.
 *
 * - Luôn gọi `/api/v1/...` cùng địa chỉ với trang; Vite proxy chuyển tới mock Prism hoặc backend (vite.config.ts).
 * - Tự gắn `Authorization: Bearer <access token>` lấy từ AuthProvider (token chỉ ở bộ nhớ).
 * - Gặp 401: gọi refresh **một lần** cho mọi request đang lỗi cùng lúc, rồi gửi lại; refresh thất bại thì báo hết phiên.
 */
export type ApiAuthHooks = {
  getAccessToken: () => string | null;
  /** Lấy access token mới từ cookie refresh. Không còn phiên thì trả null. */
  refresh: () => Promise<string | null>;
  /** Refresh thất bại: AuthProvider xóa phiên, route guard tự đưa về /login. */
  onSessionExpired: () => void;
};

export const API_BASE_URL = '/api/v1';

/** Các endpoint xác thực tự xử lý 401 (sai mật khẩu, hết cookie), không refresh rồi gửi lại. */
const NO_RETRY_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const withToken = (request: Request, token: string | null): Request => {
  const next = new Request(request);
  if (token) next.headers.set('Authorization', `Bearer ${token}`);
  return next;
};

/** Địa chỉ đầy đủ (Request trong môi trường test không nhận đường dẫn tương đối). */
const defaultBaseUrl = () =>
  typeof window === 'undefined'
    ? `http://localhost${API_BASE_URL}`
    : `${window.location.origin}${API_BASE_URL}`;

export const createApiClient = ({
  baseUrl = defaultBaseUrl(),
  fetchFn = (req: Request) => globalThis.fetch(req),
}: { baseUrl?: string; fetchFn?: (req: Request) => Promise<Response> } = {}) => {
  let hooks: ApiAuthHooks | null = null;
  let refreshing: Promise<string | null> | null = null;

  const refreshOnce = (auth: ApiAuthHooks) => {
    refreshing ??= auth
      .refresh()
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  };

  const authFetch = async (request: Request): Promise<Response> => {
    const auth = hooks;
    const usedToken = auth?.getAccessToken() ?? null;
    // Sao lưu trước khi gửi: body của request chỉ đọc được một lần.
    const backup = request.clone();
    const response = await fetchFn(withToken(request, usedToken));

    const path = new URL(request.url).pathname.replace(new URL(baseUrl).pathname, '');
    if (response.status !== 401 || !auth || NO_RETRY_PATHS.includes(path)) return response;

    // Request khác đã refresh xong trong lúc chờ: dùng luôn token mới, không refresh lần nữa.
    const current = auth.getAccessToken();
    const token = current && current !== usedToken ? current : await refreshOnce(auth);
    if (!token) {
      auth.onSessionExpired();
      return response;
    }
    return fetchFn(withToken(backup, token));
  };

  const client = createClient<paths>({ baseUrl, credentials: 'include', fetch: authFetch });

  return {
    client,
    configureAuth: (next: ApiAuthHooks | null) => {
      hooks = next;
    },
  };
};

const instance = createApiClient();

/** Client dùng trong toàn app. Hook trong features/<domain>/api.ts gọi qua đây. */
export const api = instance.client;
export const configureApiAuth = instance.configureAuth;

type ApiResult<T> = { data?: T; error?: unknown; response: Response };

/**
 * Trả `data` khi thành công; lỗi thì ném nguyên body `{ error: { code, message, details, requestId } }`
 * để `lib/errors.ts` (getErrorMessage, getRequestId) đọc được.
 */
export const unwrap = <T>({ data, error, response }: ApiResult<T>): T => {
  if (error !== undefined) throw error;
  if (!response.ok) {
    // BE trả lỗi không có body: tự dựng đủ dạng ErrorResponse để lib/errors.ts đọc được.
    throw {
      error: {
        code: response.status === 401 ? 'UNAUTHENTICATED' : 'INTERNAL_ERROR',
        message: response.statusText,
        details: null,
        requestId: response.headers.get('X-Request-Id') ?? '',
      },
    };
  }
  return data as T;
};
