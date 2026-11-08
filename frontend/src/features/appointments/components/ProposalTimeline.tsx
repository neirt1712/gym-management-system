import { Space, Timeline, Typography } from 'antd';
import { StatusTag } from '../../../app/feedback/StatusTag';
import { formatDateTime, formatTimeRange } from '../../../lib/format';
import { PROPOSAL_KIND_LABEL } from '../../../theme/status';
import type { Proposal } from '../api';

const ROLE_TEXT = { MEMBER: 'Hội viên', TRAINER: 'PT' } as const;

/** UC24–UC26 Dòng thời gian đề xuất của một lịch, cũ nhất trước (đúng thứ tự BE trả). */
export const ProposalTimeline = ({ proposals }: { proposals: Proposal[] }) => (
  <Timeline
    items={proposals.map((p) => ({
      color:
        p.status === 'OPEN'
          ? 'orange'
          : p.status === 'ACCEPTED'
            ? 'green'
            : p.status === 'REJECTED'
              ? 'red'
              : 'gray',
      children: (
        <Space direction="vertical" size={2}>
          <Space wrap>
            <Typography.Text strong>{PROPOSAL_KIND_LABEL[p.kind]}</Typography.Text>
            <StatusTag kind="proposal" value={p.status} />
          </Space>
          {p.startsAt && p.endsAt && (
            <Typography.Text>{formatTimeRange(p.startsAt, p.endsAt)}</Typography.Text>
          )}
          <Typography.Text type="secondary">
            {ROLE_TEXT[p.proposedRole]} {p.proposedBy.fullName} · {formatDateTime(p.createdAt)}
          </Typography.Text>
          {p.note && <Typography.Text>Ghi chú: {p.note}</Typography.Text>}
          {p.rejectReason && <Typography.Text type="danger">Lý do từ chối: {p.rejectReason}</Typography.Text>}
        </Space>
      ),
    }))}
  />
);
