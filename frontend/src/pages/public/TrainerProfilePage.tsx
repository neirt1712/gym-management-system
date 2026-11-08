import { Avatar, Button, Card, Col, List, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, PageHeader } from '../../components';
import { BookAppointmentDrawer } from '../../features/appointments/components/BookAppointmentDrawer';
import { useAuth } from '../../features/auth';
import { useAvailability, useTrainer } from '../../features/trainers/api';
import { formatTimeRange } from '../../lib/format';
import { space } from '../../theme/tokens';

/** UC21 Hồ sơ PT (`/trainers/:id`): chuyên môn, giới thiệu, khung giờ rảnh 4 tuần; hội viên đặt lịch (UC23). */
export const TrainerProfilePage = () => {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const trainer = useTrainer(id);
  const availability = useAvailability(id);
  const canBook = !user || user.role === 'MEMBER';

  if (trainer.isPending) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (trainer.isError) return <ErrorState error={trainer.error} onRetry={() => void trainer.refetch()} />;
  const t = trainer.data;

  const book = () =>
    user ? setBooking(true) : navigate(`/login?next=${encodeURIComponent(`/trainers/${id}`)}`);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Typography.Text type="secondary">
        <Link to="/trainers">Huấn luyện viên</Link> / {t.fullName}
      </Typography.Text>
      <PageHeader
        title={
          <Space>
            <Avatar src={t.avatarUrl ?? undefined} size={56}>
              {t.fullName.charAt(0)}
            </Avatar>
            {t.fullName}
          </Space>
        }
        description={t.experienceYears !== null ? `${t.experienceYears} năm kinh nghiệm` : undefined}
        extra={
          canBook && (
            <Button type="primary" onClick={book}>
              Đặt lịch
            </Button>
          )
        }
      />
      <Row gutter={[space.lg, space.lg]}>
        <Col xs={24} lg={10}>
          <Card title="Giới thiệu">
            <Space wrap style={{ marginBottom: space.md }}>
              {t.specialties.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </Space>
            <Typography.Paragraph>{t.bio ?? 'PT chưa viết giới thiệu.'}</Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Khung giờ rảnh 4 tuần tới">
            {availability.isPending ? (
              <Skeleton active />
            ) : availability.isError ? (
              <ErrorState error={availability.error} onRetry={() => void availability.refetch()} />
            ) : availability.data.slots.length === 0 ? (
              <EmptyState description="PT chưa mở khung giờ nào" />
            ) : (
              <List
                size="small"
                dataSource={availability.data.slots}
                renderItem={(s) => <List.Item>{formatTimeRange(s.startsAt, s.endsAt)}</List.Item>}
                pagination={{ pageSize: 10, size: 'small' }}
              />
            )}
          </Card>
        </Col>
      </Row>
      {user?.role === 'MEMBER' && (
        <BookAppointmentDrawer
          open={booking}
          trainerId={t.id}
          onClose={() => setBooking(false)}
          onBooked={(appointmentId) => navigate(`/member/appointments/${appointmentId}`)}
        />
      )}
    </div>
  );
};
