import { Button, Card } from 'antd';
import type { TableColumnsType } from 'antd';
import { useState } from 'react';
import { DataTable, EmptyState, ErrorState, PageHeader } from '../../components';
import { CashConfirmModal, type CashToCollect } from '../../features/counter/components/CashConfirmModal';
import { usePayments, type Payment } from '../../features/purchase/api';
import { formatDateTime, formatVND } from '../../lib/format';

const PAGE_SIZE = 20;

/**
 * UC13 Xác nhận tiền mặt (`/staff/payments`): thanh toán tiền mặt đang chờ quầy thu.
 * BE chỉ trả giao dịch trong ngày cho Staff (quyết định 19); đơn tiền mặt hết hạn cuối ngày.
 */
export const StaffPaymentsPage = () => {
  const [page, setPage] = useState(1);
  const [collecting, setCollecting] = useState<CashToCollect | null>(null);
  const { data, isPending, isFetching, isError, error, refetch } = usePayments({
    method: 'CASH',
    status: 'PENDING',
    page,
    pageSize: PAGE_SIZE,
  });

  const columns: TableColumnsType<Payment> = [
    { title: 'Hội viên', render: (_, p) => `${p.member.fullName} · ${p.member.memberCode}` },
    { title: 'Số điện thoại', render: (_, p) => p.member.phone },
    { title: 'Cần thu', render: (_, p) => <b>{formatVND(p.amount)}</b> },
    { title: 'Tạo lúc', render: (_, p) => formatDateTime(p.createdAt) },
    {
      title: 'Thao tác',
      render: (_, p) => (
        <Button
          onClick={() => setCollecting({ paymentId: p.id, amount: p.amount, memberName: p.member.fullName })}
        >
          Thu tiền
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Xác nhận tiền mặt"
        description="Đơn chọn trả tiền mặt, chờ quầy thu tiền. Đơn hết hạn vào cuối ngày."
      />
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <Card>
          <DataTable<Payment>
            columns={columns}
            rows={data?.data}
            rowKey="id"
            loading={isPending || isFetching}
            meta={data?.meta}
            onPageChange={setPage}
            empty={<EmptyState description="Không có thanh toán tiền mặt nào đang chờ" />}
          />
        </Card>
      )}
      <CashConfirmModal target={collecting} onClose={() => setCollecting(null)} />
    </div>
  );
};
