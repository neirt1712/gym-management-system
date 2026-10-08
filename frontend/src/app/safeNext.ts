/** Chỉ nhận đường dẫn nội bộ cho ?next=, tránh chuyển hướng ra trang ngoài. */
export const safeNext = (value: string | null): string | null =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : null;
