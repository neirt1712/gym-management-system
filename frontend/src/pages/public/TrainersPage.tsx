import { Avatar, Button, Card, Col, Input, Row, Skeleton, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, PageHeader } from '../../components';
import { useTrainers } from '../../features/trainers/api';
import { space } from '../../theme/tokens';

/** UC21 Danh sách huấn luyện viên (`/trainers`, công khai): tìm theo tên, xem hồ sơ. */
export const TrainersPage = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data, isPending, isError, error, refetch } = useTrainers({ pageSize: 100, ...(q ? { q } : {}) });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader title="Huấn luyện viên" description="Xem hồ sơ PT rồi đặt lịch tập trong khung giờ rảnh." />
      <Input.Search
        aria-label="Tìm huấn luyện viên"
        placeholder="Tìm theo tên"
        allowClear
        onSearch={(v) => setQ(v.trim())}
        style={{ width: 280, marginBottom: space.lg }}
      />
      {isPending ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState description="Không tìm thấy huấn luyện viên nào" />
      ) : (
        <Row gutter={[space.lg, space.lg]}>
          {data.data
            .filter((t) => t.status === 'ACTIVE')
            .map((t) => (
              <Col key={t.id} xs={24} md={12} xl={8}>
                <Card style={{ height: '100%' }}>
                  <Space direction="vertical" size={space.sm} style={{ width: '100%' }}>
                    <Space>
                      <Avatar src={t.avatarUrl ?? undefined} size={48}>
                        {t.fullName.charAt(0)}
                      </Avatar>
                      <div>
                        <Typography.Text strong>{t.fullName}</Typography.Text>
                        {t.experienceYears !== null && (
                          <Typography.Text type="secondary" style={{ display: 'block' }}>
                            {t.experienceYears} năm kinh nghiệm
                          </Typography.Text>
                        )}
                      </div>
                    </Space>
                    <Space wrap>
                      {t.specialties.map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </Space>
                    {t.bio && <Typography.Paragraph ellipsis={{ rows: 2 }}>{t.bio}</Typography.Paragraph>}
                    <Button onClick={() => navigate(`/trainers/${t.id}`)}>Xem hồ sơ</Button>
                  </Space>
                </Card>
              </Col>
            ))}
        </Row>
      )}
    </div>
  );
};
