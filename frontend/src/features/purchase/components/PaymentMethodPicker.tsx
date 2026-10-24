import { Button, Radio, Space, Typography } from 'antd';
import { useState } from 'react';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { space } from '../../../theme/tokens';
import { useCreatePayment, type Payment, type PaymentMethod } from '../api';

const METHOD_TEXT: Record<PaymentMethod, { label: string; hint: string }> = {
  VNPAY: { label: 'VNPay', hint: 'Chuyển sang trang VNPay. Đơn giữ trong 30 phút.' },
  CASH: {
    label: 'Tiền mặt tại quầy',
    hint: 'Trả tại quầy trong hôm nay. Nhân viên xác nhận là gói có hiệu lực.',
  },
};

type Props = {
  orderId: string;
  methods?: PaymentMethod[];
  /** Mặc định chuyển trình duyệt sang VNPay; test truyền hàm giả. */
  redirect?: (url: string) => void;
  /** Gọi sau khi tạo thanh toán tiền mặt (VNPay thì trình duyệt rời trang). */
  onCashCreated: (payment: Payment) => void;
};

/** UC12, UC13 Chọn phương thức cho đơn PENDING. Khóa nút khi đang gửi để không tạo hai thanh toán. */
export const PaymentMethodPicker = ({
  orderId,
  methods = ['VNPAY', 'CASH'],
  redirect = (url) => window.location.assign(url),
  onCashCreated,
}: Props) => {
  const [method, setMethod] = useState<PaymentMethod>(methods[0] ?? 'CASH');
  const create = useCreatePayment();

  const pay = async () => {
    const payment = await create.mutateAsync({ orderId, method }).catch(() => null);
    if (!payment) return;
    if (payment.method === 'VNPAY' && payment.checkoutUrl) redirect(payment.checkoutUrl);
    else onCashCreated(payment);
  };

  return (
    <Space direction="vertical" size={space.md} style={{ width: '100%' }}>
      {create.isError && <ApiErrorAlert error={create.error} />}
      <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)}>
        <Space direction="vertical" size={space.sm}>
          {methods.map((m) => (
            <Radio key={m} value={m}>
              <b>{METHOD_TEXT[m].label}</b>
              <Typography.Text type="secondary" style={{ display: 'block' }}>
                {METHOD_TEXT[m].hint}
              </Typography.Text>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
      <Button type="primary" loading={create.isPending} onClick={() => void pay()}>
        {method === 'VNPAY' ? 'Thanh toán qua VNPay' : 'Chọn trả tiền mặt'}
      </Button>
    </Space>
  );
};
