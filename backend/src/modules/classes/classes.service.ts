import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import { isEmptyPatch } from '../../common/http/patch';
import type { AuthUser } from '../../common/http/request-context';
import { notify, pageMeta } from '../../common/notify';
import { assertFound } from '../../common/ownership/ownership';
import { todayVn, vnDayEnd, vnDayStart } from '../../common/time/vn-date';
import { BUSINESS } from '../../config/business.config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  cancelDeadline,
  classInclude,
  ENROLLMENT_INCLUDE,
  toClassResponse,
  toEnrollmentResponse,
} from './class.response';
import type {
  CreateClassDto,
  ListClassesQueryDto,
  ListEnrollmentsQueryDto,
  UpdateClassDto,
} from './dto/class.dto';

type Tx = Prisma.TransactionClient;

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

const fieldError = (field: string, message: string) =>
  new AppError('VALIDATION_ERROR', [{ field, messages: [message] }], message);

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
/** Ngày giờ VN (YYYY-MM-DD) của một thời điểm. */
const vnDate = (d: Date) => new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);

/** Lớp học: UC36 (Admin quản lý), UC37 (hội viên đăng ký, hủy), UC38 (xem danh sách đăng ký). */
@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  /** UC26, UC37. Khách, hội viên chỉ thấy SCHEDULED; Admin thấy cả CANCELLED và lọc được theo status. */
  async list(query: ListClassesQueryDto, user: AuthUser | undefined) {
    if (query.mine) {
      if (!user) throw new AppError('UNAUTHENTICATED');
      if (user.role !== 'MEMBER') throw new AppError('FORBIDDEN', null, 'Chỉ hội viên dùng được mine=true');
    }
    const memberId = await this.memberIdOf(user);
    const from = query.from ?? todayVn();

    const where: Prisma.ClassWhereInput = {
      startsAt: { gte: vnDayStart(from), ...(query.to ? { lte: vnDayEnd(query.to) } : {}) },
      trainerId: query.trainerId,
      status: user?.role === 'ADMIN' ? query.status : 'SCHEDULED',
      ...(query.mine
        ? { enrollments: { some: { memberId: memberId ?? NIL_UUID, status: 'REGISTERED' } } }
        : {}),
    };
    const { page, pageSize } = query;
    const [total, classes] = await this.prisma.$transaction([
      this.prisma.class.count({ where }),
      this.prisma.class.findMany({
        where,
        include: classInclude(memberId),
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data: classes.map(toClassResponse), meta: pageMeta(page, pageSize, total) };
  }

  /** UC37. */
  async get(id: string, user: AuthUser | undefined) {
    return toClassResponse(await this.load(this.prisma, id, await this.memberIdOf(user)));
  }

  /** UC36. Khóa dòng PT rồi kiểm trùng lịch CONFIRMED và lớp khác của PT đó. */
  async create(dto: CreateClassDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.assertTimes(startsAt, endsAt);

    const created = await this.prisma.$transaction(async (tx) => {
      await this.lockActiveTrainer(tx, dto.trainerId);
      await this.assertTrainerFree(tx, dto.trainerId, startsAt, endsAt);
      return tx.class.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
          trainerId: dto.trainerId,
          capacity: dto.capacity,
          startsAt,
          endsAt,
          cancelBeforeMinutes: dto.cancelBeforeMinutes ?? BUSINESS.classes.defaultCancelBeforeMinutes,
        },
      });
    });
    return this.get(created.id, undefined);
  }

  /**
   * UC36. Đổi PT hoặc giờ thì kiểm trùng như khi tạo. Sức chứa không nhỏ hơn số đang đăng ký (Q20i).
   * Hủy lớp: đăng ký REGISTERED chuyển CANCELLED và người đăng ký nhận thông báo (Q20a). Không sửa lớp đã hủy.
   */
  async update(id: string, dto: UpdateClassDto) {
    if (isEmptyPatch(dto)) throw fieldError('body', 'Cần gửi ít nhất một field');
    if (!isUUID(id)) throw new AppError('NOT_FOUND');

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM classes WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await tx.class.findUnique({ where: { id } });
      assertFound(current);
      if (current.status === 'CANCELLED') {
        throw fieldError('status', 'Lớp đã hủy, không sửa được; tạo lớp mới (Q20i)');
      }

      if (dto.status === 'CANCELLED') {
        await this.cancelClass(tx, current.id, current.name, current.startsAt);
        return;
      }

      const trainerId = dto.trainerId ?? current.trainerId;
      const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
      const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
      const scheduleChanged = Boolean(dto.trainerId || dto.startsAt || dto.endsAt);
      if (scheduleChanged) {
        this.assertTimes(startsAt, endsAt);
        await this.lockActiveTrainer(tx, trainerId);
        await this.assertTrainerFree(tx, trainerId, startsAt, endsAt, id);
      }
      if (dto.capacity !== undefined) {
        const registered = await tx.classEnrollment.count({ where: { classId: id, status: 'REGISTERED' } });
        if (dto.capacity < registered) {
          throw fieldError('capacity', `Sức chứa không nhỏ hơn số đang đăng ký (${registered})`);
        }
      }

      await tx.class.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          trainerId: dto.trainerId,
          capacity: dto.capacity,
          startsAt: dto.startsAt ? startsAt : undefined,
          endsAt: dto.endsAt ? endsAt : undefined,
          cancelBeforeMinutes: dto.cancelBeforeMinutes,
        },
      });
    });
    return this.get(id, undefined);
  }

  /**
   * UC37. Khóa dòng lớp khi kiểm chỗ. Gửi lặp trả đăng ký hiện tại (`created: false` → 200).
   * Cần gói ACTIVE có quyền vào lớp và còn hiệu lực vào ngày học (quyết định 11).
   */
  async enroll(id: string, user: AuthUser) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const memberId = await this.memberIdOf(user);
    if (!memberId) throw new AppError('FORBIDDEN');

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM classes WHERE id = ${id}::uuid FOR UPDATE`;
        const gymClass = await tx.class.findUnique({ where: { id } });
        assertFound(gymClass);

        const existing = await tx.classEnrollment.findFirst({
          where: { classId: id, memberId, status: 'REGISTERED' },
          include: ENROLLMENT_INCLUDE,
        });
        if (existing) return { created: false, enrollment: toEnrollmentResponse(existing) };

        if (gymClass.status !== 'SCHEDULED' || gymClass.startsAt <= new Date()) {
          throw new AppError('CLASS_NOT_OPEN', { status: gymClass.status });
        }
        const classDay = vnDayStart(vnDate(gymClass.startsAt));
        const benefit = await tx.subscription.findFirst({
          where: {
            memberId,
            status: 'ACTIVE',
            includesClass: true,
            startsOn: { lte: classDay },
            endsOn: { gte: classDay },
          },
          select: { id: true },
        });
        if (!benefit) throw new AppError('NO_CLASS_BENEFIT');

        const registered = await tx.classEnrollment.count({ where: { classId: id, status: 'REGISTERED' } });
        if (registered >= gymClass.capacity) {
          throw new AppError('CLASS_FULL', { capacity: gymClass.capacity });
        }

        const enrollment = await tx.classEnrollment.create({
          data: { classId: id, memberId },
          include: ENROLLMENT_INCLUDE,
        });
        return { created: true, enrollment: toEnrollmentResponse(enrollment) };
      });
    } catch (e) {
      // Hai request cùng lúc của một hội viên: ràng buộc "một REGISTERED mỗi lớp" chặn bản thứ hai
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const existing = await this.prisma.classEnrollment.findFirstOrThrow({
          where: { classId: id, memberId, status: 'REGISTERED' },
          include: ENROLLMENT_INCLUDE,
        });
        return { created: false, enrollment: toEnrollmentResponse(existing) };
      }
      throw e;
    }
  }

  /** UC38. ADMIN, STAFF xem mọi lớp; PT chỉ lớp mình dạy (không phải thì 404). */
  async listEnrollments(id: string, query: ListEnrollmentsQueryDto, user: AuthUser) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const gymClass = await this.prisma.class.findUnique({
      where: { id },
      include: { trainer: { select: { userId: true } } },
    });
    assertFound(gymClass);
    if (user.role === 'TRAINER' && gymClass.trainer.userId !== user.id) throw new AppError('NOT_FOUND');

    const where: Prisma.ClassEnrollmentWhereInput = { classId: id, status: query.status };
    const { page, pageSize } = query;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.classEnrollment.count({ where }),
      this.prisma.classEnrollment.findMany({
        where,
        include: ENROLLMENT_INCLUDE,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data: rows.map(toEnrollmentResponse), meta: pageMeta(page, pageSize, total) };
  }

  /** UC37. Chỉ hủy trước hạn hủy; không có đăng ký REGISTERED thì 404. */
  async cancelMine(id: string, user: AuthUser): Promise<void> {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const memberId = await this.memberIdOf(user);
    const enrollment = memberId
      ? await this.prisma.classEnrollment.findFirst({
          where: { classId: id, memberId, status: 'REGISTERED' },
          include: { class: true },
        })
      : null;
    assertFound(enrollment);
    if (new Date() > cancelDeadline(enrollment.class)) {
      throw new AppError('CANCELLATION_WINDOW_PASSED', {
        cancelDeadline: cancelDeadline(enrollment.class).toISOString(),
      });
    }
    await this.prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  private async cancelClass(tx: Tx, id: string, name: string, startsAt: Date): Promise<void> {
    await tx.class.update({ where: { id }, data: { status: 'CANCELLED' } });
    const registered = await tx.classEnrollment.findMany({
      where: { classId: id, status: 'REGISTERED' },
      include: { member: { select: { userId: true } } },
    });
    if (registered.length === 0) return;
    await tx.classEnrollment.updateMany({
      where: { classId: id, status: 'REGISTERED' },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    for (const e of registered) {
      await notify(tx, {
        userId: e.member.userId,
        type: 'CLASS_CANCELLED',
        title: 'Lớp học đã bị hủy',
        body: `Lớp "${name}" ngày ${vnDate(startsAt).split('-').reverse().join('/')} đã bị hủy. Đăng ký của bạn đã được hủy theo.`,
        targetType: 'CLASS',
        targetId: id,
      });
    }
  }

  /** startsAt ở tương lai, endsAt sau startsAt (openapi createClass). */
  private assertTimes(startsAt: Date, endsAt: Date): void {
    if (startsAt <= new Date()) throw fieldError('startsAt', 'Giờ bắt đầu phải ở tương lai');
    if (endsAt <= startsAt) throw fieldError('endsAt', 'Giờ kết thúc phải sau giờ bắt đầu');
  }

  /** Khóa dòng PT (cùng cách với lịch PT) để hai thao tác cùng lúc không xếp trùng giờ. */
  private async lockActiveTrainer(tx: Tx, trainerId: string): Promise<void> {
    await tx.$queryRaw`SELECT id FROM trainers WHERE id = ${trainerId}::uuid FOR UPDATE`;
    const trainer = await tx.trainer.findUnique({ where: { id: trainerId }, select: { status: true } });
    if (!trainer || trainer.status !== 'ACTIVE')
      throw fieldError('trainerId', 'PT không tồn tại hoặc ngừng hoạt động');
  }

  /** PT trùng lịch CONFIRMED hoặc lớp SCHEDULED khác → SCHEDULE_CONFLICT. */
  private async assertTrainerFree(
    tx: Tx,
    trainerId: string,
    startsAt: Date,
    endsAt: Date,
    exceptClassId?: string,
  ) {
    const overlap = { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } };
    const [appointments, classes] = await Promise.all([
      tx.appointment.count({ where: { trainerId, status: 'CONFIRMED', ...overlap } }),
      tx.class.count({
        where: {
          trainerId,
          status: 'SCHEDULED',
          id: exceptClassId ? { not: exceptClassId } : undefined,
          ...overlap,
        },
      }),
    ]);
    if (appointments + classes > 0) throw new AppError('SCHEDULE_CONFLICT', { appointments, classes });
  }

  private async load(db: Tx | PrismaService, id: string, memberId: string | null) {
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const gymClass = await db.class.findUnique({ where: { id }, include: classInclude(memberId) });
    assertFound(gymClass);
    return gymClass;
  }

  /** `members.id` của người gọi nếu là MEMBER, ngược lại null. */
  private async memberIdOf(user: AuthUser | undefined): Promise<string | null> {
    if (!user || user.role !== 'MEMBER') return null;
    const member = await this.prisma.member.findUnique({ where: { userId: user.id }, select: { id: true } });
    return member?.id ?? null;
  }
}
