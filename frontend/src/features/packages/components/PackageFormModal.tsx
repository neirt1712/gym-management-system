import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Col, Form, Input, InputNumber, Modal, Radio, Row, Space, Switch } from 'antd';
import { useEffect } from 'react';
import { ApiErrorAlert } from '../../../app/feedback/ApiErrorAlert';
import { MoneyInput } from '../../../components';
import { space } from '../../../theme/tokens';
import type { Package } from '../../purchase/api';
import { useCreatePackage, useUpdatePackage } from '../api';

type FormValues = {
  name: string;
  description?: string;
  type: 'GYM' | 'PT';
  price: number;
  durationValue: number;
  durationUnit: 'MONTH' | 'DAY';
  totalSessions?: number;
  sessionMinutes?: number;
  includesClass: boolean;
  benefits: string[];
  active: boolean;
};

type Props = {
  open: boolean;
  /** Có gói thì là sửa; không có thì là thêm mới. */
  pkg?: Package;
  onClose: () => void;
};

const toFormValues = (pkg?: Package): FormValues =>
  pkg
    ? {
        name: pkg.name,
        description: pkg.description ?? undefined,
        type: pkg.type,
        price: pkg.price,
        durationValue: pkg.durationValue,
        durationUnit: pkg.durationUnit,
        totalSessions: pkg.totalSessions ?? undefined,
        sessionMinutes: pkg.sessionMinutes ?? undefined,
        includesClass: pkg.includesClass,
        benefits: pkg.benefits,
        active: pkg.status === 'ACTIVE',
      }
    : {
        name: '',
        type: 'GYM',
        price: 0,
        durationValue: 1,
        durationUnit: 'MONTH',
        includesClass: false,
        benefits: [],
        active: true,
      };

/**
 * UC08 Thêm hoặc sửa gói (Admin). Gói PT bắt buộc số buổi, phút mỗi buổi; gói GYM gửi hai field này là null.
 * Không đổi được loại gói khi sửa (openapi). Ảnh gói trong mock chưa có trong API nên chưa làm.
 */
export const PackageFormModal = ({ open, pkg, onClose }: Props) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const create = useCreatePackage();
  const update = useUpdatePackage();
  const type = Form.useWatch('type', form);
  const editing = !!pkg;
  const saving = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  useEffect(() => {
    if (open) {
      form.setFieldsValue(toFormValues(pkg));
      create.reset();
      update.reset();
    }
    // Chỉ nạp lại khi mở hộp thoại hoặc đổi gói đang sửa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pkg?.id]);

  const submit = async (v: FormValues) => {
    const isPt = v.type === 'PT';
    const terms = {
      name: v.name.trim(),
      description: v.description?.trim() || null,
      price: v.price,
      durationValue: v.durationValue,
      durationUnit: v.durationUnit,
      totalSessions: isPt ? (v.totalSessions ?? null) : null,
      sessionMinutes: isPt ? (v.sessionMinutes ?? null) : null,
      includesClass: v.includesClass,
      benefits: v.benefits.map((b) => b.trim()).filter(Boolean),
    };
    const status = v.active ? 'ACTIVE' : 'INACTIVE';

    try {
      if (pkg) {
        await update.mutateAsync({ id: pkg.id, body: { ...terms, status } });
      } else {
        const created = await create.mutateAsync({ ...terms, type: v.type });
        // Gói mới luôn ACTIVE; chọn "chưa mở bán" thì tắt bán ngay sau khi tạo
        if (!v.active) await update.mutateAsync({ id: created.id, body: { status: 'INACTIVE' } });
      }
      void message.success('Đã lưu gói');
      onClose();
    } catch {
      // Lỗi hiện trong hộp thoại qua ApiErrorAlert
    }
  };

  return (
    <Modal
      open={open}
      title={editing ? `Sửa gói ${pkg.name}` : 'Thêm gói'}
      okText="Lưu gói"
      cancelText="Đóng"
      okButtonProps={{ loading: saving, htmlType: 'submit', form: 'package-form' }}
      onCancel={onClose}
      width={640}
      destroyOnClose
    >
      {error && <ApiErrorAlert error={error} />}
      <Form
        id="package-form"
        form={form}
        layout="vertical"
        onFinish={(v) => void submit(v)}
        requiredMark="optional"
      >
        <Form.Item
          name="name"
          label="Tên gói"
          rules={[{ required: true, whitespace: true, message: 'Nhập tên gói' }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea maxLength={2000} autoSize={{ minRows: 2, maxRows: 5 }} />
        </Form.Item>
        <Form.Item
          name="type"
          label="Loại gói"
          extra={editing ? 'Không đổi được loại gói sau khi tạo.' : undefined}
        >
          <Radio.Group disabled={editing}>
            <Radio value="GYM">Gym tự do</Radio>
            <Radio value="PT">Có PT</Radio>
          </Radio.Group>
        </Form.Item>
        <Row gutter={space.md}>
          <Col xs={24} sm={12}>
            <Form.Item name="price" label="Giá" rules={[{ required: true, message: 'Nhập giá' }]}>
              <MoneyInput />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item
              name="durationValue"
              label="Thời hạn"
              rules={[{ required: true, message: 'Nhập thời hạn' }]}
            >
              <InputNumber<number> min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item name="durationUnit" label="Đơn vị">
              <Radio.Group optionType="button">
                <Radio value="MONTH">Tháng</Radio>
                <Radio value="DAY">Ngày</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
        {type === 'PT' && (
          <Row gutter={space.md}>
            <Col xs={12}>
              <Form.Item
                name="totalSessions"
                label="Số buổi PT"
                rules={[{ required: true, message: 'Gói PT cần số buổi' }]}
              >
                <InputNumber<number> min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="sessionMinutes"
                label="Phút mỗi buổi"
                rules={[{ required: true, message: 'Gói PT cần số phút mỗi buổi' }]}
              >
                <InputNumber<number> min={15} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Form.Item label="Quyền lợi">
          <Form.List name="benefits">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={space.sm} style={{ width: '100%' }}>
                {fields.map((field, index) => (
                  <Space key={field.key} style={{ width: '100%' }} align="start">
                    <Form.Item name={field.name} noStyle>
                      <Input aria-label={`Quyền lợi ${index + 1}`} maxLength={200} style={{ width: 480 }} />
                    </Form.Item>
                    <Button
                      aria-label={`Xóa quyền lợi ${index + 1}`}
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  </Space>
                ))}
                {fields.length < 20 && (
                  <Button icon={<PlusOutlined />} onClick={() => add('')}>
                    Thêm quyền lợi
                  </Button>
                )}
              </Space>
            )}
          </Form.List>
        </Form.Item>
        <Form.Item name="includesClass" label="Được vào lớp học" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item
          name="active"
          label={editing ? 'Đang bán' : 'Mở bán ngay sau khi lưu'}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};
