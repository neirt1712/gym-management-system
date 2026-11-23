import { Drawer, Select, Space, Typography } from 'antd';
import { useState } from 'react';
import { formatDuration, formatVND } from '../../../lib/format';
import { space } from '../../../theme/tokens';
import { usePackages } from '../../packages/api';
import { PurchaseFlow } from '../../purchase/components/PurchaseFlow';

type Props = {
  open: boolean;
  memberId: string;
  memberName: string;
  onClose: () => void;
  /** Đơn vừa tạo đã chọn tiền mặt (hoặc đơn đang chờ có sẵn). */
  onOrderReady: (orderId: string) => void;
};

/** UC09 Quầy mua gói hộ: chọn gói rồi dùng chung PurchaseFlow, chỉ cho tiền mặt. */
export const BuyForMemberDrawer = ({ open, memberId, memberName, onClose, onOrderReady }: Props) => {
  const [packageId, setPackageId] = useState<string>();
  const { data, isPending } = usePackages({ pageSize: 100 });
  const pkg = data?.data.find((p) => p.id === packageId);

  const close = () => {
    setPackageId(undefined);
    onClose();
  };

  return (
    <Drawer open={open} onClose={close} title={`Mua gói hộ ${memberName}`} width={560} destroyOnClose>
      <Space direction="vertical" size={space.lg} style={{ width: '100%' }}>
        <div>
          <Typography.Text strong>Gói tập</Typography.Text>
          <Select
            aria-label="Gói tập"
            placeholder="Chọn gói"
            loading={isPending}
            value={packageId}
            onChange={setPackageId}
            style={{ width: '100%', marginTop: space.sm }}
            options={data?.data.map((p) => ({
              value: p.id,
              label: `${p.name} · ${formatVND(p.price)} · ${formatDuration(p.durationValue, p.durationUnit)}`,
            }))}
          />
        </div>
        {pkg && (
          <PurchaseFlow
            key={pkg.id}
            pkg={pkg}
            memberId={memberId}
            methods={['CASH']}
            onOpenOrder={(orderId) => {
              close();
              onOrderReady(orderId);
            }}
          />
        )}
      </Space>
    </Drawer>
  );
};
