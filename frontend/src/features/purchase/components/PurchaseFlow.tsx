import { Alert, Button, DatePicker, Form, Space, Steps } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { getErrorCode, getErrorDetails, getErrorMessage } from '../../../lib/errors';
import { TZ } from '../../../lib/format';
import { space } from '../../../theme/tokens';
import {
  useCreateOrder,
  useQuote,
  type Order,
  type OrderQuote,
  type Package,
  type Payment,
  type PaymentMethod,
} from '../api';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { QuoteSummary } from './QuoteSummary';

export type PurchaseFlowProps = {
  pkg: Package;
  /** Quầy, Admin mua hộ: bắt buộc gửi `memberId`. Hội viên tự mua thì bỏ trống. */
  memberId?: string;
  /** Gia hạn: id gói hội viên đang có. */
  renewalOf?: string;
  /** Quầy thường chỉ cho tiền mặt: `['CASH']`. */
  methods?: PaymentMethod[];
  /** Mở đơn (đơn vừa tạo đã chọn tiền mặt, hoặc đơn đang chờ có sẵn). */
  onOpenOrder: (orderId: string) => void;
  redirect?: (url: string) => void;
};

const today = () => dayjs().tz(TZ).startOf('day');

/**
 * UC09 Mua gói, dùng chung cho hội viên và quầy (mua hộ):
 * chọn ngày bắt đầu → báo giá (BE tính ngày kết thúc) → tạo đơn → chọn phương thức.
 */
export const PurchaseFlow = ({
  pkg,
  memberId,
  renewalOf,
  methods,
  onOpenOrder,
  redirect,
}: PurchaseFlowProps) => {
  // Gia hạn: để trống thì BE lấy ngày ngay sau khi gói cũ hết hạn. Mua mới: mặc định hôm nay.
  const [startsOn, setStartsOn] = useState<Dayjs | null>(() => (renewalOf ? null : today()));
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const quoteMutation = useQuote();
  const createOrder = useCreateOrder();
  const step = order ? 2 : quote ? 1 : 0;
  const request = { packageId: pkg.id, memberId, renewalOf, startsOn: startsOn?.format('YYYY-MM-DD') };

  const getQuote = () => quoteMutation.mutate(request, { onSuccess: setQuote });
  const placeOrder = () => createOrder.mutate(request, { onSuccess: setOrder });
  const pendingOrderId =
    getErrorCode(createOrder.error) === 'PENDING_ORDER_EXISTS'
      ? getErrorDetails<{ orderId?: string }>(createOrder.error)?.orderId
      : undefined;

  return (
    <Space direction="vertical" size={space.lg} style={{ width: '100%' }}>
      <Steps
        current={step}
        size="small"
        items={[{ title: 'Ngày bắt đầu' }, { title: 'Xác nhận' }, { title: 'Thanh toán' }]}
      />

      {step === 0 && (
        <Form layout="vertical" onFinish={getQuote}>
          {quoteMutation.isError && <ApiErrorAlert error={quoteMutation.error} />}
          <Form.Item label="Ngày bắt đầu" extra="Ngày kết thúc do hệ thống tính ở bước sau.">
            <DatePicker
              value={startsOn}
              onChange={(d) => setStartsOn(d ?? (renewalOf ? null : today()))}
              allowClear={!!renewalOf}
              placeholder={renewalOf ? 'Ngay sau khi gói cũ hết hạn' : 'dd/mm/yyyy'}
              format="DD/MM/YYYY"
              disabledDate={(d) => d.isBefore(today(), 'day')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={quoteMutation.isPending}>
            Xem báo giá
          </Button>
        </Form>
      )}

      {step === 1 && quote && (
        <Space direction="vertical" size={space.md} style={{ width: '100%' }}>
          {pendingOrderId ? (
            <Alert
              type="warning"
              showIcon
              message={getErrorMessage(createOrder.error)}
              action={
                <Button size="small" onClick={() => onOpenOrder(pendingOrderId)}>
                  Mở đơn đang chờ
                </Button>
              }
            />
          ) : (
            createOrder.isError && <ApiErrorAlert error={createOrder.error} />
          )}
          <QuoteSummary quote={quote} />
          <Space>
            <Button onClick={() => setQuote(null)} disabled={createOrder.isPending}>
              Đổi ngày
            </Button>
            <Button type="primary" loading={createOrder.isPending} onClick={placeOrder}>
              Tạo đơn
            </Button>
          </Space>
        </Space>
      )}

      {step === 2 && order && (
        <PaymentMethodPicker
          orderId={order.id}
          methods={methods}
          redirect={redirect}
          onCashCreated={(payment: Payment) => onOpenOrder(payment.orderId)}
        />
      )}
    </Space>
  );
};
