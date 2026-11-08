import { UserOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Space, Typography, Upload } from 'antd';
import { useAuth } from '../../auth';
import { getErrorMessage } from '../../../lib/errors';
import { space } from '../../../theme/tokens';
import { useUpdateMe, useUploadAvatar, type Me } from '../api';

const ACCEPT = ['image/jpeg', 'image/png'];

/** UC05 Ảnh đại diện: tải lên (`POST /uploads/avatar`) rồi lưu `avatarUrl` vào hồ sơ (`PATCH /me`). */
export const AvatarPicker = ({ me }: { me: Me }) => {
  const upload = useUploadAvatar();
  const update = useUpdateMe();
  const { updateUser } = useAuth();
  const { message } = App.useApp();
  const busy = upload.isPending || update.isPending;

  const save = async (file: File) => {
    // Kiểm tra sớm cho nhanh; BE vẫn kiểm lại và trả INVALID_FILE.
    if (!ACCEPT.includes(file.type)) {
      message.error(getErrorMessage({ error: { code: 'INVALID_FILE' } }));
      return;
    }
    try {
      const avatarUrl = await upload.mutateAsync(file);
      const saved = await update.mutateAsync({ avatarUrl });
      updateUser({ avatarUrl: saved.avatarUrl });
      message.success('Đã đổi ảnh');
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Space size={space.md} align="center">
      <Avatar
        size={72}
        src={me.avatarUrl ?? undefined}
        icon={<UserOutlined />}
        alt={`Ảnh của ${me.fullName}`}
      />
      <Space direction="vertical" size={space.xs}>
        <Upload
          accept={ACCEPT.join(',')}
          showUploadList={false}
          beforeUpload={(file) => {
            void save(file);
            return false;
          }}
        >
          <Button loading={busy}>Đổi ảnh</Button>
        </Upload>
        <Typography.Text type="secondary">JPEG hoặc PNG.</Typography.Text>
      </Space>
    </Space>
  );
};
