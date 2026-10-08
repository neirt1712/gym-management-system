import { Card, Empty, Typography } from 'antd';
import { space } from '../../theme/tokens';

type Props = { title: string; uc: string; owner: string };

/** Trang tạm cho route chưa có màn. Người làm màn thay bằng trang thật trong router.tsx. */
export const PlaceholderPage = ({ title, uc, owner }: Props) => (
  <div>
    <Typography.Title level={3} style={{ marginTop: 0, marginBottom: space.md }}>
      {title}
    </Typography.Title>
    <Card>
      <Empty
        description={
          <>
            <div>Màn này đang được xây dựng.</div>
            <Typography.Text type="secondary">
              {uc} · Người làm: {owner}
            </Typography.Text>
          </>
        }
      />
    </Card>
  </div>
);
