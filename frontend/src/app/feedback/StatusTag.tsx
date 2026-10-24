import { Tag } from 'antd';
import { STATUS, type StatusKind } from '../../theme/status';

type Props<K extends StatusKind> = { kind: K; value: keyof (typeof STATUS)[K] & string };

/**
 * Nhãn trạng thái theo `theme/status.ts` (luôn có chữ, không chỉ màu).
 * Tạm đặt ở `app/feedback` tới khi Bằng làm `components/StatusTag`; khi có thì đổi import, giữ nguyên props.
 */
export const StatusTag = <K extends StatusKind>({ kind, value }: Props<K>) => {
  const def = (STATUS[kind] as Record<string, { label: string; color: string }>)[value];
  return <Tag color={def?.color ?? 'default'}>{def?.label ?? value}</Tag>;
};
