import { PrinterOutlined } from '@ant-design/icons';
import { Button, Descriptions, Typography } from 'antd';
import { formatDate, formatDateTime, formatVND } from '../../../lib/format';
import { space } from '../../../theme/tokens';
import type { Receipt } from '../api';

const METHOD_LABEL = { VNPAY: 'VNPay', CASH: 'Tiền mặt' } as const;

/** UC14 Biên lai nội bộ (quyết định 7), in bằng trình duyệt. Phần ngoài biên lai ẩn khi in (`.no-print`). */
export const ReceiptView = ({ receipt }: { receipt: Receipt }) => (
  <div className="receipt">
    <Typography.Title level={4} style={{ marginTop: 0 }}>
      Biên lai {receipt.receiptNo}
    </Typography.Title>
    <Descriptions column={1} size="small" bordered>
      <Descriptions.Item label="Hội viên">
        {receipt.memberName} · {receipt.memberCode} · {receipt.memberPhone}
      </Descriptions.Item>
      <Descriptions.Item label="Gói tập">{receipt.packageName}</Descriptions.Item>
      <Descriptions.Item label="Thời hạn">
        {formatDate(receipt.startsOn)} – {formatDate(receipt.endsOn)}
      </Descriptions.Item>
      <Descriptions.Item label="Số tiền">
        <b>{formatVND(receipt.amount)}</b>
      </Descriptions.Item>
      <Descriptions.Item label="Phương thức">{METHOD_LABEL[receipt.method]}</Descriptions.Item>
      {receipt.collectedBy && (
        <Descriptions.Item label="Người thu">{receipt.collectedBy.fullName}</Descriptions.Item>
      )}
      <Descriptions.Item label="Thời gian">{formatDateTime(receipt.paidAt)}</Descriptions.Item>
    </Descriptions>
    <Button
      className="no-print"
      icon={<PrinterOutlined />}
      style={{ marginTop: space.md }}
      onClick={() => window.print()}
    >
      In biên lai
    </Button>
  </div>
);
