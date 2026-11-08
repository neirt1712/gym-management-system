import { Descriptions } from 'antd';
import { formatDate, formatDuration, formatVND } from '../../../lib/format';
import type { OrderQuote } from '../api';

/** Màn xác nhận trước khi tạo đơn. Ngày kết thúc và tổng tiền lấy nguyên từ BE (Q9), FE không tự tính. */
export const QuoteSummary = ({ quote }: { quote: OrderQuote }) => (
  <Descriptions column={1} bordered size="small">
    <Descriptions.Item label="Gói tập">{quote.packageName}</Descriptions.Item>
    <Descriptions.Item label="Thời hạn">
      {formatDuration(quote.durationValue, quote.durationUnit)}
    </Descriptions.Item>
    {quote.totalSessions !== null && (
      <Descriptions.Item label="Số buổi PT">
        {quote.totalSessions} buổi
        {quote.sessionMinutes !== null && `, mỗi buổi ${quote.sessionMinutes} phút`}
      </Descriptions.Item>
    )}
    <Descriptions.Item label="Vào lớp học">{quote.includesClass ? 'Có' : 'Không'}</Descriptions.Item>
    <Descriptions.Item label="Bắt đầu">{formatDate(quote.startsOn)}</Descriptions.Item>
    <Descriptions.Item label="Kết thúc">{formatDate(quote.endsOn)}</Descriptions.Item>
    <Descriptions.Item label="Tổng tiền">
      <b>{formatVND(quote.total)}</b>
    </Descriptions.Item>
  </Descriptions>
);
