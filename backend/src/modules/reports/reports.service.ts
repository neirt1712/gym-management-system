import { Injectable } from '@nestjs/common';
import { Prisma, type AppointmentStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import { pageMeta } from '../../common/notify';
import { addDays, todayVn, vnDayEnd, vnDayStart } from '../../common/time/vn-date';
import { PrismaService } from '../../prisma/prisma.service';
import { SUBSCRIPTION_INCLUDE, toSubscriptionResponse } from '../subscriptions/subscription.response';
import type { DateRangeQueryDto, ExpiringQueryDto, GroupBy, RevenueQueryDto } from './dto/report.dto';

const TZ = 'Asia/Ho_Chi_Minh';
/** Số ngày "sắp hết hạn" trong tổng quan (openapi ReportOverview.expiringSoon, quyết định 17). */
const EXPIRING_SOON_DAYS = 7;

/** Ngày cuối tháng của một ngày YYYY-MM-DD. */
const monthEnd = (day: string): string => {
  const [y, m] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

/** Mọi kỳ từ from tới to theo groupBy (để series có đủ kỳ, kỳ trống là 0). */
const periods = (from: string, to: string, groupBy: GroupBy): string[] => {
  const out: string[] = [];
  if (groupBy === 'DAY') {
    for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  } else if (groupBy === 'MONTH') {
    let [y, m] = from.split('-').map(Number);
    const end = to.slice(0, 7);
    for (;;) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      if (key > end) break;
      out.push(key);
      m += 1;
      if (m > 12) [y, m] = [y + 1, 1];
    }
  } else {
    for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) out.push(String(y));
  }
  return out;
};

const PERIOD_FORMAT: Record<GroupBy, string> = { DAY: 'YYYY-MM-DD', MONTH: 'YYYY-MM', YEAR: 'YYYY' };

/** Báo cáo cho Admin: UC39 doanh thu, UC40 tổng quan và gói sắp hết hạn. Staff không xem (quyết định 19). */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Không gửi from, to thì lấy tháng hiện tại; from sau to thì 400. */
  range(query: DateRangeQueryDto): { from: string; to: string } {
    const today = todayVn();
    const from = query.from ?? `${today.slice(0, 7)}-01`;
    const to = query.to ?? monthEnd(from);
    if (from > to) {
      throw new AppError('VALIDATION_ERROR', [{ field: 'from', messages: ['from phải trước hoặc bằng to'] }]);
    }
    return { from, to };
  }

  async overview(query: DateRangeQueryDto) {
    const { from, to } = this.range(query);
    const today = todayVn();
    const start = vnDayStart(from);
    const end = vnDayEnd(to);

    const [active, expiringSoon, firstPaid, checkIns, popular] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE', startsOn: { lte: new Date(today) }, endsOn: { gte: new Date(today) } },
        select: { memberId: true },
        distinct: ['memberId'],
      }),
      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endsOn: { gte: new Date(today), lte: new Date(addDays(today, EXPIRING_SOON_DAYS - 1)) },
        },
      }),
      // Q20f: hội viên mới = đơn PAID đầu tiên nằm trong khoảng
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) AS count FROM (
          SELECT member_id, min(paid_at) AS first_paid FROM orders WHERE status = 'PAID' GROUP BY member_id
        ) f WHERE f.first_paid BETWEEN ${start} AND ${end}`,
      this.prisma.checkIn.count({ where: { checkedInAt: { gte: start, lte: end } } }),
      this.prisma.$queryRaw<
        { id: string; name: string; type: string; paid_orders: bigint; revenue: bigint }[]
      >`
        SELECT p.id, p.name, p.type, count(o.id) AS paid_orders, coalesce(sum(o.total), 0) AS revenue
        FROM orders o JOIN packages p ON p.id = o.package_id
        WHERE o.status = 'PAID' AND o.paid_at BETWEEN ${start} AND ${end}
        GROUP BY p.id, p.name, p.type
        ORDER BY paid_orders DESC, revenue DESC, p.name ASC
        LIMIT 5`,
    ]);

    return {
      from,
      to,
      totalMembers: active.length,
      newMembers: Number(firstPaid[0]?.count ?? 0),
      expiringSoon,
      checkIns,
      popularPackages: popular.map((r) => ({
        package: { id: r.id, name: r.name, type: r.type },
        paidOrders: Number(r.paid_orders),
        revenue: Number(r.revenue),
      })),
    };
  }

  /** Doanh thu = tổng amount của payment SUCCESS theo ngày paidAt giờ VN. */
  async revenue(query: RevenueQueryDto) {
    const { from, to } = this.range(query);
    const groupBy = query.groupBy ?? 'DAY';
    const start = vnDayStart(from);
    const end = vnDayEnd(to);
    const format = PERIOD_FORMAT[groupBy];

    const [rows, byPackage] = await Promise.all([
      this.prisma.$queryRaw<{ period: string; amount: bigint; payment_count: bigint }[]>`
        SELECT to_char(paid_at AT TIME ZONE ${TZ}, ${format}) AS period,
               sum(amount) AS amount, count(*) AS payment_count
        FROM payments
        WHERE status = 'SUCCESS' AND paid_at BETWEEN ${start} AND ${end}
        GROUP BY 1`,
      this.prisma.$queryRaw<
        { id: string; name: string; type: string; amount: bigint; payment_count: bigint }[]
      >`
        SELECT p.id, p.name, p.type, sum(pay.amount) AS amount, count(*) AS payment_count
        FROM payments pay JOIN orders o ON o.id = pay.order_id JOIN packages p ON p.id = o.package_id
        WHERE pay.status = 'SUCCESS' AND pay.paid_at BETWEEN ${start} AND ${end}
        GROUP BY p.id, p.name, p.type
        ORDER BY amount DESC, p.name ASC`,
    ]);

    const byPeriod = new Map(rows.map((r) => [r.period, r]));
    const series = periods(from, to, groupBy).map((period) => ({
      period,
      amount: Number(byPeriod.get(period)?.amount ?? 0),
      paymentCount: Number(byPeriod.get(period)?.payment_count ?? 0),
    }));
    return {
      from,
      to,
      groupBy,
      totalAmount: series.reduce((s, x) => s + x.amount, 0),
      paymentCount: series.reduce((s, x) => s + x.paymentCount, 0),
      series,
      byPackage: byPackage.map((r) => ({
        package: { id: r.id, name: r.name, type: r.type },
        amount: Number(r.amount),
        paymentCount: Number(r.payment_count),
      })),
    };
  }

  /** Gói ACTIVE có endsOn trong `days` ngày tới (tính cả hôm nay), hết hạn sớm nhất trước. */
  async expiring(query: ExpiringQueryDto) {
    const today = todayVn();
    const where: Prisma.SubscriptionWhereInput = {
      status: 'ACTIVE',
      endsOn: { gte: new Date(today), lte: new Date(addDays(today, query.days - 1)) },
    };
    const { page, pageSize } = query;
    const [total, subs] = await this.prisma.$transaction([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        include: SUBSCRIPTION_INCLUDE,
        orderBy: [{ endsOn: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const counts = await this.prisma.appointment.groupBy({
      by: ['subscriptionId', 'status'],
      where: { subscriptionId: { in: subs.map((s) => s.id) } },
      _count: { _all: true },
    });
    const bySub = new Map<string, Partial<Record<AppointmentStatus, number>>>();
    for (const row of counts) {
      const entry = bySub.get(row.subscriptionId) ?? {};
      entry[row.status] = row._count._all;
      bySub.set(row.subscriptionId, entry);
    }
    return {
      data: subs.map((s) => toSubscriptionResponse(s, bySub.get(s.id) ?? {})),
      meta: pageMeta(page, pageSize, total),
    };
  }
}
