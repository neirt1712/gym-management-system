import { Card, Col, Descriptions, Row, Skeleton, Typography } from 'antd';
import { PageError } from '../../app/feedback/PageError';
import { ROLE_LABEL } from '../../app/roles';
import { useMe } from '../../features/profile/api';
import { AvatarPicker } from '../../features/profile/components/AvatarPicker';
import { ChangePasswordForm } from '../../features/profile/components/ChangePasswordForm';
import { ProfileForm } from '../../features/profile/components/ProfileForm';
import { formatDate } from '../../lib/format';
import { space } from '../../theme/tokens';

/** UC05 Hồ sơ của tôi, UC06 Đổi mật khẩu. Mọi vai trò dùng chung trang này (`/me/profile`). */
export const ProfilePage = () => {
  const { data: me, isPending, isError, error, refetch } = useMe();

  return (
    <div>
      <Typography.Title level={2} style={{ marginTop: 0 }}>
        Hồ sơ của tôi
      </Typography.Title>

      {isPending ? (
        <Row gutter={[space.lg, space.lg]} aria-busy="true">
          <Col xs={24} lg={16}>
            <Card>
              <Skeleton active avatar paragraph={{ rows: 6 }} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
        </Row>
      ) : isError ? (
        <PageError error={error} onRetry={() => void refetch()} />
      ) : (
        <Row gutter={[space.lg, space.lg]}>
          <Col xs={24} lg={16}>
            <Card title="Thông tin cá nhân">
              <div style={{ marginBottom: space.lg }}>
                <AvatarPicker me={me} />
              </div>
              <ProfileForm me={me} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Tài khoản" style={{ marginBottom: space.lg }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vai trò">{ROLE_LABEL[me.role]}</Descriptions.Item>
                {me.member && (
                  <Descriptions.Item label="Mã hội viên">{me.member.memberCode}</Descriptions.Item>
                )}
                {me.shift && <Descriptions.Item label="Ca làm">{me.shift}</Descriptions.Item>}
                <Descriptions.Item label="Ngày tạo">{formatDate(me.createdAt)}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="Đổi mật khẩu">
              <ChangePasswordForm />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};
