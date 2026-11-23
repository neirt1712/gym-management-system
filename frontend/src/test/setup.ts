import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Màn đầu tiên của mỗi file test render chậm (Ant Design nạp lần đầu); 1 giây mặc định không đủ trên máy yếu.
configure({ asyncUtilTimeout: 5000 });

// jsdom chưa có matchMedia; Ant Design (Grid, Sider breakpoint) cần hàm này.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  // Các test trong một file dùng chung document. Modal, Drawer của Ant Design gắn style lên body/html và
  // gỡ khi hiệu ứng đóng chạy xong; trên CI tải nặng test sau bắt đầu trước khi gỡ, nút bị chặn bấm
  // (pointer-events: none). Dọn sạch để mỗi test bắt đầu từ trang trắng.
  document.body.removeAttribute('style');
  document.body.removeAttribute('class');
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('class');
});
