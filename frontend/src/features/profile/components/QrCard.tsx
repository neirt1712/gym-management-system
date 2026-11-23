import { App, Button, Card, Modal, Skeleton, Space, Typography } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { space } from '../../../theme/tokens';
import { useMe, useRegenerateQr } from '../api';

/** UC15 Mã QR check-in của hội viên; mở to để quầy quét; tạo lại khi bị lộ (Q6). */
export const QrCard = () => {
  const { data: me, isPending, isError, error, refetch } = useMe();
  const regenerate = useRegenerateQr();
  const { modal, message } = App.useApp();
  const [zoom, setZoom] = useState(false);
  const token = me?.member?.qrToken;

  const confirmRegenerate = () =>
    modal.confirm({
      title: 'Tạo mã QR mới?',
      content: 'Mã cũ sẽ không dùng được nữa. Chỉ làm khi bạn nghĩ mã đã bị người khác chụp.',
      okText: 'Tạo mã mới',
      cancelText: 'Giữ mã cũ',
      onOk: () => regenerate.mutateAsync().then(() => void message.success('Đã tạo mã mới')),
    });

  return (
    <Card title="Mã check-in">
      {isPending ? (
        <Skeleton.Image active style={{ width: 160, height: 160 }} />
      ) : isError ? (
        <ApiErrorAlert error={error} action={<Button onClick={() => void refetch()}>Thử lại</Button>} />
      ) : token ? (
        <Space direction="vertical" align="center" size={space.sm} style={{ width: '100%' }}>
          <button
            type="button"
            onClick={() => setZoom(true)}
            aria-label="Phóng to mã QR"
            style={{ border: 0, background: 'none', padding: 0, cursor: 'zoom-in' }}
          >
            <QRCodeSVG value={token} size={160} />
          </button>
          <Typography.Text type="secondary">Đưa mã này cho quầy khi tới tập.</Typography.Text>
          <Typography.Text>Mã hội viên: {me.member?.memberCode}</Typography.Text>
          {regenerate.isError && <ApiErrorAlert error={regenerate.error} />}
          <Button size="small" onClick={confirmRegenerate}>
            Tạo mã mới
          </Button>
        </Space>
      ) : (
        <Typography.Text type="secondary">Chỉ hội viên có mã check-in.</Typography.Text>
      )}
      <Modal open={zoom} onCancel={() => setZoom(false)} footer={null} centered title="Mã check-in">
        {token && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: space.md }}>
            <QRCodeSVG value={token} size={280} />
          </div>
        )}
      </Modal>
    </Card>
  );
};
