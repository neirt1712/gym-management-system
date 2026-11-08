import { Button, Col, Row, Segmented, Skeleton } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, PageHeader } from '../../components';
import { useAppointments, type AppointmentListQuery } from '../../features/appointments/api';
import { AppointmentCard } from '../../features/appointments/components/AppointmentCard';
import { BookAppointmentDrawer } from '../../features/appointments/components/BookAppointmentDrawer';
import { useAuth } from '../../features/auth';
import { space } from '../../theme/tokens';

type Tab = 'UPCOMING' | 'HISTORY';

const STATUS_BY_TAB: Record<Tab, NonNullable<AppointmentListQuery['status']>> = {
  UPCOMING: ['PENDING', 'CONFIRMED'],
  HISTORY: ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'REJECTED'],
};

/**
 * Lịch tập dùng chung: hội viên (`/member/appointments`, có nút đặt lịch UC23) và PT (`/trainer/schedule`, UC24).
 * Lịch đang chờ mình trả lời hiện kèm nhãn "Chờ bạn trả lời".
 */
export const AppointmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('UPCOMING');
  const [booking, setBooking] = useState(false);
  const isTrainer = user?.role === 'TRAINER';
  const base = isTrainer ? '/trainer/appointments' : '/member/appointments';
  const { data, isPending, isError, error, refetch } = useAppointments({
    status: STATUS_BY_TAB[tab],
    pageSize: 50,
  });

  return (
    <div>
      <PageHeader
        title="Lịch tập"
        description={
          isTrainer ? 'Lịch với hội viên phụ trách. Trả lời đề xuất đang chờ.' : 'Lịch tập với PT của bạn.'
        }
        extra={
          !isTrainer && (
            <Button type="primary" onClick={() => setBooking(true)}>
              Đặt lịch với PT
            </Button>
          )
        }
      />
      <Segmented<Tab>
        aria-label="Nhóm lịch"
        value={tab}
        onChange={setTab}
        options={[
          { label: 'Sắp tới', value: 'UPCOMING' },
          { label: 'Đã qua', value: 'HISTORY' },
        ]}
        style={{ marginBottom: space.md }}
      />
      {isPending ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          description={
            tab === 'UPCOMING' ? 'Bạn chưa có lịch tập nào sắp tới' : 'Chưa có buổi tập nào đã qua'
          }
          action={
            !isTrainer &&
            tab === 'UPCOMING' && <Button onClick={() => setBooking(true)}>Đặt lịch với PT</Button>
          }
        />
      ) : (
        <Row gutter={[space.md, space.md]}>
          {data.data.map((a) => (
            <Col key={a.id} xs={24} md={12} xl={8}>
              <AppointmentCard
                appointment={a}
                viewer={isTrainer ? 'TRAINER' : 'MEMBER'}
                onOpen={() => navigate(`${base}/${a.id}`)}
              />
            </Col>
          ))}
        </Row>
      )}
      {!isTrainer && (
        <BookAppointmentDrawer
          open={booking}
          onClose={() => setBooking(false)}
          onBooked={(id) => navigate(`${base}/${id}`)}
        />
      )}
    </div>
  );
};
