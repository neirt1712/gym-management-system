import { Injectable } from '@nestjs/common';
import { Prisma, type AppointmentStatus } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import type { AuthUser } from '../../common/http/request-context';
import { isExclusionViolation, notify, pageMeta } from '../../common/notify';
import { assertFound, assertOwnership } from '../../common/ownership/ownership';
import { todayVn, vnDayEnd, vnDayStart } from '../../common/time/vn-date';
import { PrismaService } from '../../prisma/prisma.service';
import { toDateOnly, toSessionCounts } from '../members/member.response';
import { allowedActions, otherParty, partyOf, type AppointmentAction, type Party } from './allowed-actions';
import {
  APPOINTMENT_INCLUDE,
  toAppointmentDetail,
  toAppointmentResponse,
  type AppointmentEntity,
} from './appointment.response';
import type {
  CompleteAppointmentDto,
  CreateAppointmentDto,
  CreateProposalDto,
  ListAppointmentsQueryDto,
  RejectProposalDto,
} from './dto/appointment.dto';

type Tx = Prisma.TransactionClient;

const fieldError = (field: string, message: string) =>
  new AppError('VALIDATION_ERROR', [{ field, messages: [message] }], message);

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const vnDate = (d: Date) => new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
const PARTY_TEXT: Record<Party, string> = { MEMBER: 'Hội viên', TRAINER: 'PT' };

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** UC26. MEMBER, TRAINER chỉ thấy lịch của mình; lọc ngày theo startsAt giờ VN; sớm nhất trước. */
  async list(query: ListAppointmentsQueryDto, user: AuthUser) {
    const where: Prisma.AppointmentWhereInput = {
      status: query.status ? { in: query.status } : undefined,
      memberId: user.role === 'MEMBER' ? undefined : query.memberId,
      trainerId: user.role === 'TRAINER' ? undefined : query.trainerId,
      ...(user.role === 'MEMBER' ? { member: { userId: user.id } } : {}),
      ...(user.role === 'TRAINER' ? { trainer: { userId: user.id } } : {}),
      ...(query.from || query.to
        ? {
            startsAt: {
              ...(query.from ? { gte: vnDayStart(query.from) } : {}),
              ...(query.to ? { lte: vnDayEnd(query.to) } : {}),
            },
          }
        : {}),
    };
    const { page, pageSize } = query;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        include: APPOINTMENT_INCLUDE,
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const now = new Date();
    return {
      data: rows.map((a) => toAppointmentResponse(a, user, now)),
      meta: pageMeta(page, pageSize, total),
    };
  }

  /** UC24–UC26. */
  async get(id: string, user: AuthUser) {
    const a = await this.loadVisible(id, user);
    return toAppointmentDetail(a, user);
  }

  /**
   * UC23. Tạo lịch PENDING kèm đề xuất INITIAL đang OPEN, chờ PT trả lời. Staff đề xuất hộ ghi là bên hội viên.
   * Giờ không bắt buộc nằm trong khung rảnh (Q20c).
   */
  async create(dto: CreateAppointmentDto, user: AuthUser) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
      include: { package: true, member: true },
    });
    if (!sub || (user.role === 'MEMBER' && sub.member.userId !== user.id)) {
      throw fieldError('subscriptionId', 'Không tìm thấy gói của hội viên');
    }
    if (sub.package.type !== 'PT' || sub.status !== 'ACTIVE' || !sub.sessionMinutes || !sub.totalSessions) {
      throw fieldError('subscriptionId', 'Gói phải là gói PT đang hiệu lực');
    }
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: dto.trainerId },
      include: { user: true },
    });
    if (!trainer || trainer.status !== 'ACTIVE') throw fieldError('trainerId', 'PT không nhận lịch');

    const startsAt = new Date(dto.startsAt);
    if (startsAt <= new Date()) throw fieldError('startsAt', 'Giờ bắt đầu phải ở tương lai');
    const endsAt = new Date(startsAt.getTime() + sub.sessionMinutes * 60_000);
    this.assertInPeriod(sub, startsAt, endsAt);

    const counts = await this.countByStatus(sub.id);
    if (toSessionCounts(sub.totalSessions, counts).bookable < 1) throw new AppError('NO_SESSIONS_AVAILABLE');
    await this.assertNoConflict(this.prisma, {
      trainerId: trainer.id,
      memberId: sub.memberId,
      startsAt,
      endsAt,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          subscriptionId: sub.id,
          memberId: sub.memberId,
          trainerId: trainer.id,
          status: 'PENDING',
          awaitingRole: 'TRAINER',
          version: 1,
          startsAt,
          endsAt,
          note: dto.note ?? null,
          proposals: {
            create: {
              kind: 'INITIAL',
              proposedBy: user.id,
              proposedRole: 'MEMBER',
              startsAt,
              endsAt,
              note: dto.note ?? null,
            },
          },
        },
      });
      await notify(tx, {
        userId: trainer.userId,
        type: 'APPOINTMENT_PROPOSED',
        title: 'Có đề xuất lịch tập mới',
        body: `Hội viên đề xuất buổi tập lúc ${this.formatTime(startsAt)}.`,
        targetType: 'APPOINTMENT',
        targetId: appointment.id,
      });
      return appointment;
    });
    return toAppointmentDetail(await this.load(created.id), user);
  }

  /**
   * UC24, UC25. COUNTER (lịch PENDING), RESCHEDULE, CANCEL (lịch CONFIRMED). Lịch đã chốt giữ giờ cũ
   * tới khi bên kia đồng ý. Thứ tự kiểm: STALE_VERSION → FORBIDDEN → giờ, trùng lịch.
   */
  async propose(id: string, dto: CreateProposalDto, user: AuthUser) {
    await this.loadVisible(id, user);
    await this.prisma.$transaction(async (tx) => {
      const a = await this.lockAndCheck(tx, id, dto.expectedVersion, user, dto.kind);
      const party = partyOf(user, {
        memberUserId: a.member.userId,
        trainerUserId: a.trainer.userId,
      }) as Party;

      let startsAt: Date | null = null;
      let endsAt: Date | null = null;
      if (dto.kind !== 'CANCEL') {
        if (!dto.startsAt) throw fieldError('startsAt', 'Cần giờ bắt đầu mới');
        startsAt = new Date(dto.startsAt);
        if (startsAt <= new Date()) throw fieldError('startsAt', 'Giờ bắt đầu phải ở tương lai');
        const sub = await tx.subscription.findUniqueOrThrow({ where: { id: a.subscriptionId } });
        endsAt = new Date(startsAt.getTime() + (sub.sessionMinutes ?? 60) * 60_000);
        this.assertInPeriod(sub, startsAt, endsAt);
        await this.assertNoConflict(tx, {
          trainerId: a.trainerId,
          memberId: a.memberId,
          startsAt,
          endsAt,
          exceptId: a.id,
        });
      }

      await tx.appointmentProposal.updateMany({
        where: { appointmentId: id, status: 'OPEN' },
        data: { status: 'SUPERSEDED' },
      });
      await tx.appointmentProposal.create({
        data: {
          appointmentId: id,
          kind: dto.kind,
          proposedBy: user.id,
          proposedRole: party,
          startsAt,
          endsAt,
          note: dto.note ?? null,
        },
      });
      await tx.appointment.update({
        where: { id },
        data: { awaitingRole: otherParty(party), version: { increment: 1 } },
      });
      await this.notifyOther(tx, a, party, {
        type: 'APPOINTMENT_PROPOSED',
        title: dto.kind === 'CANCEL' ? 'Có yêu cầu hủy lịch' : 'Có đề xuất giờ mới',
        body:
          dto.kind === 'CANCEL'
            ? `${PARTY_TEXT[party]} xin hủy buổi ${this.formatTime(a.startsAt)}.`
            : `${PARTY_TEXT[party]} đề xuất giờ ${this.formatTime(startsAt as Date)}.`,
      });
    });
    return toAppointmentDetail(await this.load(id), user);
  }

  /**
   * UC24, UC25. Đồng ý đề xuất đang mở. INITIAL, COUNTER, RESCHEDULE: khóa dòng PT, kiểm trùng lịch và số buổi.
   * CANCEL: lịch chuyển CANCELLED.
   */
  async accept(id: string, expectedVersion: number, user: AuthUser) {
    await this.loadVisible(id, user);
    try {
      await this.prisma.$transaction(async (tx) => {
        const a = await this.lockAndCheck(tx, id, expectedVersion, user, 'ACCEPT');
        const party = partyOf(user, {
          memberUserId: a.member.userId,
          trainerUserId: a.trainer.userId,
        }) as Party;
        const open = a.proposals.find((p) => p.status === 'OPEN');
        if (!open) throw new AppError('FORBIDDEN', null, 'Không có đề xuất đang mở');

        if (open.kind === 'CANCEL') {
          await tx.appointment.update({
            where: { id },
            data: { status: 'CANCELLED', awaitingRole: null, version: { increment: 1 } },
          });
        } else {
          const startsAt = open.startsAt as Date;
          const endsAt = open.endsAt as Date;
          // Khóa dòng PT để hai lần đồng ý cùng lúc không cùng chốt một khung giờ
          await tx.$queryRaw`SELECT id FROM trainers WHERE id = ${a.trainerId}::uuid FOR UPDATE`;
          await this.assertNoConflict(tx, {
            trainerId: a.trainerId,
            memberId: a.memberId,
            startsAt,
            endsAt,
            exceptId: a.id,
          });
          if (open.kind !== 'RESCHEDULE') {
            const sub = await tx.subscription.findUniqueOrThrow({ where: { id: a.subscriptionId } });
            const counts = await this.countByStatus(sub.id, tx, a.id);
            if (toSessionCounts(sub.totalSessions ?? 0, counts).bookable < 1) {
              throw new AppError('NO_SESSIONS_AVAILABLE');
            }
          }
          await tx.appointment.update({
            where: { id },
            data: { status: 'CONFIRMED', startsAt, endsAt, awaitingRole: null, version: { increment: 1 } },
          });
        }
        await tx.appointmentProposal.update({ where: { id: open.id }, data: { status: 'ACCEPTED' } });
        await this.notifyOther(tx, a, party, {
          type: open.kind === 'CANCEL' ? 'APPOINTMENT_CANCELLED' : 'APPOINTMENT_CONFIRMED',
          title: open.kind === 'CANCEL' ? 'Lịch tập đã hủy' : 'Lịch tập đã được xác nhận',
          body:
            open.kind === 'CANCEL'
              ? `Buổi ${this.formatTime(a.startsAt)} đã hủy.`
              : `Buổi tập lúc ${this.formatTime(open.startsAt as Date)} đã được xác nhận.`,
        });
      });
    } catch (e) {
      if (isExclusionViolation(e)) throw new AppError('SCHEDULE_CONFLICT');
      throw e;
    }
    return toAppointmentDetail(await this.load(id), user);
  }

  /** UC24, UC25. Từ chối INITIAL/COUNTER: lịch REJECTED, nhả buổi đang giữ. Từ chối RESCHEDULE/CANCEL: lịch giữ nguyên. */
  async reject(id: string, dto: RejectProposalDto, user: AuthUser) {
    await this.loadVisible(id, user);
    await this.prisma.$transaction(async (tx) => {
      const a = await this.lockAndCheck(tx, id, dto.expectedVersion, user, 'REJECT');
      const party = partyOf(user, {
        memberUserId: a.member.userId,
        trainerUserId: a.trainer.userId,
      }) as Party;
      const open = a.proposals.find((p) => p.status === 'OPEN');
      if (!open) throw new AppError('FORBIDDEN', null, 'Không có đề xuất đang mở');

      await tx.appointmentProposal.update({
        where: { id: open.id },
        data: { status: 'REJECTED', rejectReason: dto.reason },
      });
      const keepsSchedule = open.kind === 'RESCHEDULE' || open.kind === 'CANCEL';
      await tx.appointment.update({
        where: { id },
        data: {
          ...(keepsSchedule ? {} : { status: 'REJECTED' as AppointmentStatus }),
          awaitingRole: null,
          version: { increment: 1 },
        },
      });
      await this.notifyOther(tx, a, party, {
        type: 'APPOINTMENT_REJECTED',
        title: 'Đề xuất lịch bị từ chối',
        body: `${PARTY_TEXT[party]} từ chối: ${dto.reason}`,
      });
    });
    return toAppointmentDetail(await this.load(id), user);
  }

  /**
   * UC27, quyết định 3. PT của lịch hoặc Admin, chỉ sau giờ kết thúc; COMPLETED và NO_SHOW đều trừ 1 buổi.
   * Đề xuất RESCHEDULE/CANCEL còn OPEN chuyển SUPERSEDED (Q20i). Thứ tự: STALE_VERSION → FORBIDDEN → SESSION_NOT_ENDED.
   */
  async complete(id: string, dto: CompleteAppointmentDto, user: AuthUser) {
    await this.loadVisible(id, user);
    await this.prisma.$transaction(async (tx) => {
      const a = await this.lockAppointment(tx, id);
      if (a.version !== dto.expectedVersion) throw new AppError('STALE_VERSION', { version: a.version });
      const isOwnerTrainer = user.role === 'TRAINER' && a.trainer.userId === user.id;
      if ((!isOwnerTrainer && user.role !== 'ADMIN') || a.status !== 'CONFIRMED')
        throw new AppError('FORBIDDEN');
      if (new Date() < a.endsAt) throw new AppError('SESSION_NOT_ENDED');

      await tx.appointmentProposal.updateMany({
        where: { appointmentId: id, status: 'OPEN' },
        data: { status: 'SUPERSEDED' },
      });
      await tx.appointment.update({
        where: { id },
        data: {
          status: dto.result,
          completedBy: user.id,
          completedAt: new Date(),
          awaitingRole: null,
          ...(dto.note !== undefined ? { note: dto.note } : {}),
          version: { increment: 1 },
        },
      });
    });
    return toAppointmentDetail(await this.load(id), user);
  }

  /** Khóa dòng lịch, so `expectedVersion`, rồi kiểm hành động có trong `allowedActions` của người gọi. */
  private async lockAndCheck(
    tx: Tx,
    id: string,
    expectedVersion: number,
    user: AuthUser,
    action: AppointmentAction,
  ) {
    const a = await this.lockAppointment(tx, id);
    if (a.version !== expectedVersion) throw new AppError('STALE_VERSION', { version: a.version });
    const open = a.proposals.find((p) => p.status === 'OPEN');
    const allowed = allowedActions(user, {
      status: a.status,
      awaitingRole: a.awaitingRole,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      openProposalKind: open?.kind ?? null,
      memberUserId: a.member.userId,
      trainerUserId: a.trainer.userId,
    });
    if (!allowed.includes(action)) throw new AppError('FORBIDDEN', { allowedActions: allowed });
    return a;
  }

  private async lockAppointment(tx: Tx, id: string): Promise<AppointmentEntity> {
    await tx.$queryRaw`SELECT id FROM appointments WHERE id = ${id}::uuid FOR UPDATE`;
    return tx.appointment.findUniqueOrThrow({ where: { id }, include: APPOINTMENT_INCLUDE });
  }

  private async load(id: string): Promise<AppointmentEntity> {
    return this.prisma.appointment.findUniqueOrThrow({ where: { id }, include: APPOINTMENT_INCLUDE });
  }

  /** MEMBER, TRAINER chỉ thấy lịch của mình (khác thì 404); STAFF, ADMIN thấy mọi lịch. */
  private async loadVisible(id: string, user: AuthUser): Promise<AppointmentEntity> {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const a = await this.prisma.appointment.findUnique({ where: { id }, include: APPOINTMENT_INCLUDE });
    assertFound(a);
    assertOwnership(user, { memberUserId: a.member.userId, trainerUserId: a.trainer.userId });
    return a;
  }

  /** Giờ nằm trong startsOn..endsOn của gói (theo ngày giờ VN). */
  private assertInPeriod(sub: { startsOn: Date; endsOn: Date }, startsAt: Date, endsAt: Date): void {
    if (vnDate(startsAt) < toDateOnly(sub.startsOn) || vnDate(endsAt) > toDateOnly(sub.endsOn)) {
      throw new AppError('OUTSIDE_SUBSCRIPTION_PERIOD', {
        startsOn: toDateOnly(sub.startsOn),
        endsOn: toDateOnly(sub.endsOn),
      });
    }
  }

  /** Trùng lịch CONFIRMED của PT hoặc hội viên, hoặc lớp SCHEDULED của PT → SCHEDULE_CONFLICT. */
  private async assertNoConflict(
    db: Tx | PrismaService,
    r: { trainerId: string; memberId: string; startsAt: Date; endsAt: Date; exceptId?: string },
  ): Promise<void> {
    const overlap = { startsAt: { lt: r.endsAt }, endsAt: { gt: r.startsAt } };
    const [appointments, classes] = await Promise.all([
      db.appointment.count({
        where: {
          status: 'CONFIRMED',
          id: r.exceptId ? { not: r.exceptId } : undefined,
          OR: [{ trainerId: r.trainerId }, { memberId: r.memberId }],
          ...overlap,
        },
      }),
      db.class.count({ where: { trainerId: r.trainerId, status: 'SCHEDULED', ...overlap } }),
    ]);
    if (appointments + classes > 0) throw new AppError('SCHEDULE_CONFLICT');
  }

  /** Đếm lịch theo trạng thái của một gói (số buổi không lưu cột, domain.md); có thể bỏ qua một lịch. */
  private async countByStatus(
    subscriptionId: string,
    db: Tx | PrismaService = this.prisma,
    exceptId?: string,
  ) {
    const rows = await db.appointment.groupBy({
      by: ['status'],
      where: { subscriptionId, id: exceptId ? { not: exceptId } : undefined },
      _count: { _all: true },
    });
    const counts: Partial<Record<AppointmentStatus, number>> = {};
    for (const row of rows) counts[row.status] = row._count._all;
    return counts;
  }

  private async notifyOther(
    tx: Tx,
    a: AppointmentEntity,
    from: Party,
    message: { type: string; title: string; body: string },
  ): Promise<void> {
    const userId = from === 'MEMBER' ? a.trainer.userId : a.member.userId;
    await notify(tx, { userId, ...message, targetType: 'APPOINTMENT', targetId: a.id });
  }

  private formatTime(d: Date): string {
    const local = new Date(d.getTime() + VN_OFFSET_MS).toISOString();
    return `${local.slice(11, 16)} ${local.slice(8, 10)}/${local.slice(5, 7)}`;
  }

  /** Hôm nay theo giờ VN, để test và log dùng chung. */
  today(): string {
    return todayVn();
  }
}
