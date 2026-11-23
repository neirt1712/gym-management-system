import { App, Descriptions, Form, InputNumber, Modal } from 'antd';
import { useEffect } from 'react';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { formatVND } from '../../../lib/format';
import { useConfirmCash } from '../../purchase/api';

/** Thanh toán tiền mặt đang chờ quầy thu. */
export type CashToCollect = { paymentId: string; amount: number; memberName: string; description?: string };

type Props = { target: CashToCollect | null; onClose: () => void };

/** UC13 Quầy nhập số tiền đã nhận rồi xác nhận. Khóa nút khi đang gửi; gửi lặp không tạo gói hai lần (BE). */
export const CashConfirmModal = ({ target, onClose }: Props) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ receivedAmount: number }>();
  const confirm = useConfirmCash();

  useEffect(() => {
    if (target) {
      form.resetFields();
      confirm.reset();
    }
    // Chỉ làm mới khi mở cho một thanh toán khác
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.paymentId]);

  const submit = ({ receivedAmount }: { receivedAmount: number }) => {
    if (!target) return;
    confirm.mutate(
      { id: target.paymentId, receivedAmount },
      {
        onSuccess: () => {
          void message.success('Đã thu tiền');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={!!target}
      title="Xác nhận thu tiền mặt"
      okText="Xác nhận thanh toán"
      cancelText="Đóng"
      okButtonProps={{ loading: confirm.isPending, htmlType: 'submit', form: 'cash-confirm' }}
      onCancel={onClose}
      destroyOnClose
    >
      {target && (
        <>
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Hội viên">{target.memberName}</Descriptions.Item>
            {target.description && <Descriptions.Item label="Đơn">{target.description}</Descriptions.Item>}
            <Descriptions.Item label="Cần thu">
              <b>{formatVND(target.amount)}</b>
            </Descriptions.Item>
          </Descriptions>
          {confirm.isError && <ApiErrorAlert error={confirm.error} />}
          <Form id="cash-confirm" form={form} layout="vertical" onFinish={submit} requiredMark={false}>
            <Form.Item
              name="receivedAmount"
              label="Số tiền đã nhận"
              extra="Phải bằng số tiền cần thu."
              rules={[
                { required: true, message: 'Nhập số tiền đã nhận' },
                {
                  validator: (_, value?: number) =>
                    value === undefined || value === target.amount
                      ? Promise.resolve()
                      : Promise.reject(new Error(`Số tiền phải bằng ${formatVND(target.amount)}`)),
                },
              ]}
            >
              <InputNumber<number>
                min={0}
                step={1000}
                style={{ width: '100%' }}
                formatter={(v) => (v === undefined ? '' : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                parser={(v) => Number((v ?? '').replace(/\D/g, ''))}
                addonAfter="₫"
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};
