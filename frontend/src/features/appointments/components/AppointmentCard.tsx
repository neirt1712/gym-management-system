import { Card, Space, Tag, Typography } from 'antd';
import { StatusTag } from '../../../app/feedback/StatusTag';
import { formatTimeRange } from '../../../lib/format';
import { PROPOSAL_KIND_LABEL } from '../../../theme/status';
import type { Appointment } from '../api';

type Props = {
  appointment: Appointment;
  /** Người xem là PT thì hiện tên hội viên; hội viên xem thì hiện tên PT. */
  viewer: 'MEMBER' | 'TRAINER' | 'STAFF';
  onOpen: () => void;
};

/** Một lịch PT trong danh sách: giờ, người kia, trạng thái, đề xuất đang chờ ai. Dùng chung cho hội viên, PT, quầy. */
export const AppointmentCard = ({ appointment: a, viewer, onOpen }: Props) => {
  const counterpart = viewer === 'TRAINER' ? a.member.fullName : a.trainer.fullName;
  const waitingForMe = a.allowedActions.includes('ACCEPT');
  const shown = a.openProposal?.startsAt && a.openProposal.endsAt ? a.openProposal : a;

  return (
    <Card
      hoverable
      onClick={onOpen}
      role="button"
      aria-label={`Mở lịch ${formatTimeRange(shown.startsAt as string, shown.endsAt as string)} với ${counterpart}`}
      size="small"
    >
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Text strong>
            {formatTimeRange(shown.startsAt as string, shown.endsAt as string)}
          </Typography.Text>
          <StatusTag kind="appointment" value={a.status} />
        </Space>
        <Typography.Text>
          {viewer === 'TRAINER' ? 'Hội viên' : 'PT'}: {counterpart} · {a.subscription.packageName}
        </Typography.Text>
        {a.openProposal && (
          <Space wrap>
            <Tag>{PROPOSAL_KIND_LABEL[a.openProposal.kind]}</Tag>
            {waitingForMe ? (
              <Tag color="warning">Chờ bạn trả lời</Tag>
            ) : (
              <Typography.Text type="secondary">Chờ bên kia trả lời</Typography.Text>
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
};
