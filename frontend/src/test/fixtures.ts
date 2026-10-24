/**
 * Dữ liệu mẫu cho test, chép từ ví dụ trong docs/api/openapi.yaml (0.2.0) để test và mock Prism trả cùng dữ liệu.
 * Sinh lại bằng tay khi openapi đổi ví dụ.
 */
export const PACKAGE_GYM = {
  id: '77777777-7777-4777-8777-777777777777',
  name: 'Gym 1 tháng',
  description: 'Tập tự do tại phòng gym trong 1 tháng.',
  type: 'GYM',
  price: 500000,
  durationValue: 1,
  durationUnit: 'MONTH',
  totalSessions: null,
  sessionMinutes: null,
  includesClass: false,
  benefits: ['Tập không giới hạn', 'Tủ đồ miễn phí'],
  status: 'ACTIVE',
} as const;

export const QUOTE = {
  packageId: '77777777-7777-4777-8777-777777777777',
  packageName: 'Gym 1 tháng',
  type: 'GYM',
  price: 500000,
  total: 500000,
  durationValue: 1,
  durationUnit: 'MONTH',
  totalSessions: null,
  sessionMinutes: null,
  includesClass: false,
  startsOn: '2026-10-10',
  endsOn: '2026-11-09',
  renewalOf: null,
} as const;

export const ORDER_PENDING = {
  id: '99999999-9999-4999-8999-999999999999',
  member: {
    id: '55555555-5555-4555-8555-555555555555',
    memberCode: 'HV000123',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    avatarUrl: null,
  },
  package: {
    id: '77777777-7777-4777-8777-777777777777',
    name: 'Gym 1 tháng',
    type: 'GYM',
  },
  renewalOf: null,
  terms: {
    price: 500000,
    durationValue: 1,
    durationUnit: 'MONTH',
    totalSessions: null,
    sessionMinutes: null,
    includesClass: false,
  },
  startsOn: '2026-10-10',
  endsOn: '2026-11-09',
  total: 500000,
  status: 'PENDING',
  expiresAt: '2026-10-08T23:59:59+07:00',
  paidAt: null,
  receiptNo: null,
  subscriptionId: null,
  createdBy: {
    id: '44444444-4444-4444-8444-444444444444',
    fullName: 'Nguyễn Văn An',
  },
  createdAt: '2026-10-08T09:30:00+07:00',
  payments: [],
  receipt: null,
} as const;

export const ORDER_PAID = {
  id: '99999999-9999-4999-8999-999999999999',
  member: {
    id: '55555555-5555-4555-8555-555555555555',
    memberCode: 'HV000123',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    avatarUrl: null,
  },
  package: {
    id: '77777777-7777-4777-8777-777777777777',
    name: 'Gym 1 tháng',
    type: 'GYM',
  },
  renewalOf: null,
  terms: {
    price: 500000,
    durationValue: 1,
    durationUnit: 'MONTH',
    totalSessions: null,
    sessionMinutes: null,
    includesClass: false,
  },
  startsOn: '2026-10-10',
  endsOn: '2026-11-09',
  total: 500000,
  status: 'PAID',
  expiresAt: '2026-10-08T23:59:59+07:00',
  paidAt: '2026-10-08T09:45:00+07:00',
  receiptNo: 'BL-20261008-0001',
  subscriptionId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  createdBy: {
    id: '22222222-2222-4222-8222-222222222222',
    fullName: 'Hoàng Thu Quầy',
  },
  createdAt: '2026-10-08T09:30:00+07:00',
  payments: [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      method: 'CASH',
      amount: 500000,
      status: 'SUCCESS',
      paidAt: '2026-10-08T09:45:00+07:00',
      createdAt: '2026-10-08T09:31:00+07:00',
    },
  ],
  receipt: {
    receiptNo: 'BL-20261008-0001',
    paidAt: '2026-10-08T09:45:00+07:00',
    memberName: 'Nguyễn Văn An',
    memberCode: 'HV000123',
    memberPhone: '0901234567',
    packageName: 'Gym 1 tháng',
    startsOn: '2026-10-10',
    endsOn: '2026-11-09',
    amount: 500000,
    method: 'CASH',
    collectedBy: {
      id: '22222222-2222-4222-8222-222222222222',
      fullName: 'Hoàng Thu Quầy',
    },
  },
} as const;

export const PAYMENT_VNPAY_PENDING = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
  orderId: '99999999-9999-4999-8999-999999999999',
  member: {
    id: '55555555-5555-4555-8555-555555555555',
    memberCode: 'HV000123',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    avatarUrl: null,
  },
  method: 'VNPAY',
  amount: 500000,
  status: 'PENDING',
  merchantRef: 'GYM20261008093100A1B2',
  gatewayTxnId: null,
  checkoutUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=GYM20261008093100A1B2',
  confirmedBy: null,
  paidAt: null,
  createdAt: '2026-10-08T09:31:00+07:00',
} as const;

export const PAYMENT_CASH_PENDING = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  orderId: '99999999-9999-4999-8999-999999999999',
  member: {
    id: '55555555-5555-4555-8555-555555555555',
    memberCode: 'HV000123',
    fullName: 'Nguyễn Văn An',
    phone: '0901234567',
    avatarUrl: null,
  },
  method: 'CASH',
  amount: 500000,
  status: 'PENDING',
  merchantRef: 'GYM20261008093100C3D4',
  gatewayTxnId: null,
  checkoutUrl: null,
  confirmedBy: null,
  paidAt: null,
  createdAt: '2026-10-08T09:31:00+07:00',
} as const;

export const SUBSCRIPTION_PT_LIST = {
  data: [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc',
      member: {
        id: '55555555-5555-4555-8555-555555555555',
        memberCode: 'HV000123',
        fullName: 'Nguyễn Văn An',
        phone: '0901234567',
        avatarUrl: null,
      },
      package: {
        id: '88888888-8888-4888-8888-888888888888',
        name: 'PT 12 buổi',
        type: 'PT',
      },
      orderId: '99999999-9999-4999-8999-99999999999a',
      packageName: 'PT 12 buổi',
      type: 'PT',
      startsOn: '2026-10-01',
      endsOn: '2026-11-30',
      daysLeft: 44,
      status: 'ACTIVE',
      includesClass: true,
      sessionMinutes: 60,
      sessions: {
        total: 12,
        used: 3,
        held: 2,
        remaining: 9,
        bookable: 7,
      },
      freeze: null,
    },
  ],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
  },
} as const;

export const ERR_PENDING_ORDER_EXISTS = {
  error: {
    code: 'PENDING_ORDER_EXISTS',
    message: 'Đã có đơn chờ thanh toán cho gói này',
    details: {
      orderId: '99999999-9999-4999-8999-999999999999',
    },
    requestId: '3f2a9c1e-7b4d-4e8a-9f1c-2d3e4f5a6b7c',
  },
} as const;
