import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

/** Cổng mock Prism, khớp lệnh `npm run mock`. */
const MOCK_ORIGIN = 'http://127.0.0.1:4010';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // FE luôn gọi `/api/v1/...` cùng địa chỉ với trang (không lo CORS, cookie refresh đi kèm).
  // Chế độ mock: chuyển tới Prism và bỏ tiền tố, vì mock phục vụ đường dẫn không có `/api/v1`.
  // Chế độ thường: chuyển tới backend lấy theo phần gốc của VITE_API_URL (mặc định cổng 3000).
  const apiProxy =
    mode === 'mock'
      ? { target: MOCK_ORIGIN, changeOrigin: true, rewrite: (path: string) => path.replace(/^\/api\/v1/, '') }
      : { target: new URL(env.VITE_API_URL || 'http://localhost:3000/api/v1').origin, changeOrigin: true };

  return {
    plugins: [react()],
    server: { port: 5173, proxy: { '/api/v1': apiProxy } },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // Test gõ form Ant Design trong jsdom mất 4–7 giây trên máy yếu; 5 giây mặc định không đủ.
      testTimeout: 20000,
    },
  };
});
