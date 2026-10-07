import type { ThemeConfig } from 'antd';

/**
 * Nguồn duy nhất cho vibe giao diện. Sơn và Bằng cùng dùng.
 * Muốn đổi giá trị nào phải cả hai đồng ý (xem frontend/CLAUDE.md).
 */
export const palette = {
  primary: '#0F766E', // xanh ngọc, màu nhấn duy nhất
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
  bgLayout: '#F6F7F9',
  bgContainer: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const breakpoints = { mobile: 768, desktop: 1200 } as const;

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: palette.primary,
    colorSuccess: palette.success,
    colorWarning: palette.warning,
    colorError: palette.error,
    colorInfo: palette.info,
    colorBgLayout: palette.bgLayout,
    colorBgContainer: palette.bgContainer,
    colorBorder: palette.border,
    colorText: palette.text,
    colorTextSecondary: palette.textSecondary,
    borderRadius: 8,
    fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: 14,
    controlHeight: 36,
  },
  components: {
    Layout: { headerBg: palette.bgContainer, siderBg: palette.bgContainer, bodyBg: palette.bgLayout },
    Menu: { itemSelectedBg: '#E6F4F2', itemSelectedColor: palette.primary },
    Table: { headerBg: palette.bgLayout, rowHoverBg: '#F0FAF8' },
    Card: { paddingLG: 20 },
    Button: { fontWeight: 500 },
  },
};
