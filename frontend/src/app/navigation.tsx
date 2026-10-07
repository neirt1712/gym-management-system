import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  LineChartOutlined,
  NotificationOutlined,
  QrcodeOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { Role } from './roles';

/**
 * Mục menu theo vai trò, khớp bản đồ route trong docs/design/fe-architecture.md.
 * uc và owner dùng cho trang tạm; người làm màn thay trang tạm bằng màn thật.
 */
export type NavItem = { path: string; label: string; icon: ReactNode; uc: string; owner: 'Sơn' | 'Bằng' };

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  MEMBER: [
    { path: '/member', label: 'Tổng quan', icon: <HomeOutlined />, uc: 'UC10, UC15', owner: 'Sơn' },
    {
      path: '/member/appointments',
      label: 'Lịch tập',
      icon: <CalendarOutlined />,
      uc: 'UC23–UC26',
      owner: 'Sơn',
    },
    { path: '/member/classes', label: 'Lớp học', icon: <TeamOutlined />, uc: 'UC37', owner: 'Sơn' },
    {
      path: '/member/training',
      label: 'Kế hoạch tập',
      icon: <LineChartOutlined />,
      uc: 'UC29, UC30',
      owner: 'Bằng',
    },
    {
      path: '/member/orders',
      label: 'Đơn và thanh toán',
      icon: <FileTextOutlined />,
      uc: 'UC12, UC14',
      owner: 'Sơn',
    },
  ],
  TRAINER: [
    {
      path: '/trainer/schedule',
      label: 'Lịch tập',
      icon: <CalendarOutlined />,
      uc: 'UC24–UC27',
      owner: 'Sơn',
    },
    {
      path: '/trainer/availability',
      label: 'Khung giờ rảnh',
      icon: <ClockCircleOutlined />,
      uc: 'UC22',
      owner: 'Bằng',
    },
    {
      path: '/trainer/members',
      label: 'Hội viên phụ trách',
      icon: <TeamOutlined />,
      uc: 'UC28–UC30',
      owner: 'Bằng',
    },
  ],
  STAFF: [
    { path: '/staff/check-in', label: 'Check-in', icon: <QrcodeOutlined />, uc: 'UC16–UC18', owner: 'Bằng' },
    {
      path: '/staff/members',
      label: 'Hội viên',
      icon: <TeamOutlined />,
      uc: 'UC09, UC11, UC19, UC20',
      owner: 'Bằng',
    },
    {
      path: '/staff/payments',
      label: 'Thanh toán',
      icon: <WalletOutlined />,
      uc: 'UC13, UC14',
      owner: 'Bằng',
    },
  ],
  ADMIN: [
    { path: '/admin', label: 'Tổng quan', icon: <DashboardOutlined />, uc: 'UC39–UC41', owner: 'Bằng' },
    { path: '/admin/packages', label: 'Gói tập', icon: <AppstoreOutlined />, uc: 'UC08', owner: 'Bằng' },
    { path: '/admin/users', label: 'Tài khoản', icon: <UserOutlined />, uc: 'UC31–UC35', owner: 'Bằng' },
    {
      path: '/admin/trainers',
      label: 'Huấn luyện viên',
      icon: <IdcardOutlined />,
      uc: 'UC22, UC33',
      owner: 'Bằng',
    },
    { path: '/admin/classes', label: 'Lớp học', icon: <TeamOutlined />, uc: 'UC36, UC38', owner: 'Bằng' },
    {
      path: '/admin/payments',
      label: 'Giao dịch',
      icon: <WalletOutlined />,
      uc: 'UC13, UC14',
      owner: 'Bằng',
    },
    {
      path: '/admin/notifications',
      label: 'Thông báo',
      icon: <NotificationOutlined />,
      uc: 'UC43',
      owner: 'Bằng',
    },
  ],
};

/** Mục menu khớp đường dẫn hiện tại (khớp tiền tố dài nhất). */
export const activeNavPath = (items: NavItem[], pathname: string): string | undefined =>
  items
    .filter((i) => pathname === i.path || pathname.startsWith(`${i.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
