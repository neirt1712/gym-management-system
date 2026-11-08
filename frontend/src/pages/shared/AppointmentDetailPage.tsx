import { Card, Col, Descriptions, Row, Skeleton, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { StatusTag } from '../../app/feedback/StatusTag';
import { ErrorState, PageHeader } from '../../components';
import { useAppointment } from '../../features/appointments/api';
import { AppointmentActions } from '../../features/appointments/components/AppointmentActions';
import { ProposalTimeline } from '../../features/appointments/components/ProposalTimeline';
import { useAuth } from '../../features/auth';
import { formatDateTime, formatTimeRange } from '../../lib/format';
import { space } from '../../theme/tokens';

const BACK: Record<string, { to: string; label: string }> = {
  MEMBER: { to: '/member/appointments', label: 'Lịch tập' },
  TRAINER: { to: '/trainer/schedule', label: 'Lịch tập' },
};

/**
 * UC24–UC27 Chi tiết lịch PT (hội viên `/member/appointments/:id`, PT `/trainer/appointments/:id`):
 * dòng thời gian đề xuất, nút theo `allowedActions`, xử lý STALE_VERSION.
 */
export const AppointmentDetailPage = () => {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data: a, isPending, isError, error, refetch } = useAppointment(id);
  const back = BACK[user?.role ?? ''] ?? BACK.MEMBER;

  if (isPending) {
    return (
      <Card aria-busy="true">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div>
      <Typography.Text type="secondary">
        <Link to={back?.to ?? '/'}>{back?.label}</Link> / Chi tiết lịch
      </Typography.Text>
      <PageHeader
        title={formatTimeRange(a.startsAt, a.endsAt)}
        description={`${a.member.fullName} với PT ${a.trainer.fullName} · ${a.subscription.packageName}`}
      />
      <Row gutter={[space.lg, space.lg]}>
        <Col xs={24} lg={16}>
          <Card title="Dòng thời gian đề xuất">
            <ProposalTimeline proposals={a.proposals} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Lịch">
            <Descriptions column={1} size="small" style={{ marginBottom: space.md }}>
              <Descriptions.Item label="Trạng thái">
                <StatusTag kind="appointment" value={a.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Đang chờ">
                {a.awaitingRole === 'TRAINER'
                  ? 'PT trả lời'
                  : a.awaitingRole === 'MEMBER'
                    ? 'Hội viên trả lời'
                    : '—'}
              </Descriptions.Item>
              {a.note && <Descriptions.Item label="Ghi chú">{a.note}</Descriptions.Item>}
              {a.completedBy && (
                <Descriptions.Item label="Xác nhận">
                  {a.completedBy.fullName}
                  {a.completedAt && ` · ${formatDateTime(a.completedAt)}`}
                </Descriptions.Item>
              )}
            </Descriptions>
            <AppointmentActions appointment={a} onReload={() => void refetch()} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
