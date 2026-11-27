import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { AppError } from '../../common/errors/app-error';
import { isEmptyPatch } from '../../common/http/patch';
import type { AuthUser } from '../../common/http/request-context';
import { pageMeta } from '../../common/notify';
import { assertFound } from '../../common/ownership/ownership';
import { PrismaService } from '../../prisma/prisma.service';
import type { PageQueryDto } from '../../common/pagination.dto';
import type {
  CreateTrainingNoteDto,
  CreateTrainingPlanDto,
  ListTrainingNotesQueryDto,
  UpdateTrainingPlanDto,
} from './dto/training.dto';
import { NOTE_INCLUDE, PLAN_INCLUDE, toNoteResponse, toPlanResponse } from './training.response';

const fieldError = (field: string, message: string) =>
  new AppError('VALIDATION_ERROR', [{ field, messages: [message] }], message);

/** Bài tập lưu JSONB: bỏ field không khai báo, giữ đúng thứ tự openapi Exercise. */
const toJsonExercises = (exercises: CreateTrainingPlanDto['exercises']): Prisma.InputJsonValue =>
  exercises.map((e) => ({
    name: e.name,
    sets: e.sets ?? null,
    reps: e.reps ?? null,
    weightKg: e.weightKg ?? null,
    durationMinutes: e.durationMinutes ?? null,
    note: e.note ?? null,
  }));

/**
 * Theo dõi tập: UC29 (ghi chú tình trạng), UC30 (kế hoạch tập).
 * Xem: hội viên (của mình), PT phụ trách (quyết định 16), Admin (Q20h). Ghi: chỉ PT phụ trách.
 * Không có quyền với hội viên thì 404 (không lộ hội viên có tồn tại).
 */
@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotes(memberId: string, query: ListTrainingNotesQueryDto, user: AuthUser) {
    await this.assertCanRead(memberId, user);
    const where: Prisma.TrainingNoteWhereInput = { memberId, planId: query.planId };
    const { page, pageSize } = query;
    const [total, notes] = await this.prisma.$transaction([
      this.prisma.trainingNote.count({ where }),
      this.prisma.trainingNote.findMany({
        where,
        include: NOTE_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data: notes.map(toNoteResponse), meta: pageMeta(page, pageSize, total) };
  }

  /** Có cả planId và progressPercent thì cập nhật luôn tiến độ của kế hoạch (cùng transaction). */
  async createNote(memberId: string, dto: CreateTrainingNoteDto, user: AuthUser) {
    const trainerId = await this.assertInCharge(memberId, user);
    if (dto.planId) {
      const plan = await this.prisma.trainingPlan.findUnique({
        where: { id: dto.planId },
        select: { memberId: true },
      });
      if (!plan || plan.memberId !== memberId)
        throw fieldError('planId', 'Kế hoạch không thuộc hội viên này');
    }
    const note = await this.prisma.$transaction(async (tx) => {
      const created = await tx.trainingNote.create({
        data: {
          memberId,
          trainerId,
          planId: dto.planId ?? null,
          content: dto.content,
          progressPercent: dto.progressPercent ?? null,
        },
        include: NOTE_INCLUDE,
      });
      if (dto.planId && dto.progressPercent !== undefined && dto.progressPercent !== null) {
        await tx.trainingPlan.update({
          where: { id: dto.planId },
          data: { progressPercent: dto.progressPercent },
        });
      }
      return created;
    });
    return toNoteResponse(note);
  }

  async listPlans(memberId: string, query: PageQueryDto, user: AuthUser) {
    await this.assertCanRead(memberId, user);
    const { page, pageSize } = query;
    const [total, plans] = await this.prisma.$transaction([
      this.prisma.trainingPlan.count({ where: { memberId } }),
      this.prisma.trainingPlan.findMany({
        where: { memberId },
        include: PLAN_INCLUDE,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { data: plans.map(toPlanResponse), meta: pageMeta(page, pageSize, total) };
  }

  async createPlan(memberId: string, dto: CreateTrainingPlanDto, user: AuthUser) {
    const trainerId = await this.assertInCharge(memberId, user);
    const plan = await this.prisma.trainingPlan.create({
      data: {
        memberId,
        trainerId,
        title: dto.title,
        exercises: toJsonExercises(dto.exercises),
        progressPercent: dto.progressPercent ?? 0,
      },
      include: PLAN_INCLUDE,
    });
    return toPlanResponse(plan);
  }

  /** Chỉ PT đã lập kế hoạch và vẫn phụ trách hội viên; không phải thì 404. */
  async updatePlan(id: string, dto: UpdateTrainingPlanDto, user: AuthUser) {
    if (isEmptyPatch(dto)) throw fieldError('body', 'Cần gửi ít nhất một field');
    if (!isUUID(id)) throw new AppError('NOT_FOUND');
    const plan = await this.prisma.trainingPlan.findUnique({ where: { id } });
    assertFound(plan);
    const trainerId = await this.assertInCharge(plan.memberId, user);
    if (plan.trainerId !== trainerId) throw new AppError('NOT_FOUND');

    const updated = await this.prisma.trainingPlan.update({
      where: { id },
      data: {
        title: dto.title,
        exercises: dto.exercises ? toJsonExercises(dto.exercises) : undefined,
        progressPercent: dto.progressPercent,
      },
      include: PLAN_INCLUDE,
    });
    return toPlanResponse(updated);
  }

  /** MEMBER: chỉ của mình; TRAINER: hội viên mình phụ trách; ADMIN: mọi hội viên (chỉ xem, Q20h). */
  private async assertCanRead(memberId: string, user: AuthUser): Promise<void> {
    const member = await this.loadMember(memberId);
    if (user.role === 'ADMIN') return;
    if (user.role === 'MEMBER' && member.userId === user.id) return;
    if (user.role === 'TRAINER') {
      await this.assertInCharge(memberId, user);
      return;
    }
    throw new AppError('NOT_FOUND');
  }

  /** Quyết định 16: PT phụ trách = có lịch PENDING/CONFIRMED/COMPLETED với hội viên. Trả `trainers.id` của PT. */
  private async assertInCharge(memberId: string, user: AuthUser): Promise<string> {
    await this.loadMember(memberId);
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!trainer) throw new AppError('NOT_FOUND');
    const shared = await this.prisma.appointment.count({
      where: { memberId, trainerId: trainer.id, status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] } },
    });
    if (shared === 0) throw new AppError('NOT_FOUND');
    return trainer.id;
  }

  private async loadMember(memberId: string) {
    if (!isUUID(memberId)) throw new AppError('NOT_FOUND');
    const member = await this.prisma.member.findUnique({ where: { id: memberId }, select: { userId: true } });
    assertFound(member);
    return member;
  }
}
