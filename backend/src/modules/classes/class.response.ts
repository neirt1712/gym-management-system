import type { Prisma } from '@prisma/client';
import { toVnDateTime } from '../members/member.response';
import { toMemberRef } from '../orders/order.response';

/** Kèm PT, số đăng ký REGISTERED và đăng ký REGISTERED của một hội viên (nếu có) để dựng GymClass. */
export const classInclude = (memberId: string | null) =>
  ({
    trainer: { include: { user: true } },
    _count: { select: { enrollments: { where: { status: 'REGISTERED' } } } },
    enrollments: {
      where: { memberId: memberId ?? '00000000-0000-0000-0000-000000000000', status: 'REGISTERED' },
      take: 1,
    },
  }) satisfies Prisma.ClassInclude;

export type ClassEntity = Prisma.ClassGetPayload<{ include: ReturnType<typeof classInclude> }>;

/** Hạn hủy đăng ký = startsAt − cancelBeforeMinutes (openapi GymClass.cancelDeadline). */
export const cancelDeadline = (c: { startsAt: Date; cancelBeforeMinutes: number }): Date =>
  new Date(c.startsAt.getTime() - c.cancelBeforeMinutes * 60_000);

/** openapi GymClass. */
export const toClassResponse = (c: ClassEntity) => {
  const enrolledCount = c._count.enrollments;
  const mine = c.enrollments[0] ?? null;
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    trainer: { id: c.trainer.id, fullName: c.trainer.user.fullName, avatarUrl: c.trainer.user.avatarUrl },
    capacity: c.capacity,
    enrolledCount,
    availableSlots: Math.max(c.capacity - enrolledCount, 0),
    startsAt: toVnDateTime(c.startsAt),
    endsAt: toVnDateTime(c.endsAt),
    cancelBeforeMinutes: c.cancelBeforeMinutes,
    cancelDeadline: toVnDateTime(cancelDeadline(c)),
    status: c.status,
    myEnrollment: mine ? { id: mine.id, createdAt: toVnDateTime(mine.createdAt) } : null,
  };
};

export const ENROLLMENT_INCLUDE = {
  member: { include: { user: true } },
} satisfies Prisma.ClassEnrollmentInclude;

export type EnrollmentEntity = Prisma.ClassEnrollmentGetPayload<{ include: typeof ENROLLMENT_INCLUDE }>;

/** openapi ClassEnrollment. */
export const toEnrollmentResponse = (e: EnrollmentEntity) => ({
  id: e.id,
  classId: e.classId,
  member: toMemberRef(e.member),
  status: e.status,
  createdAt: toVnDateTime(e.createdAt),
  cancelledAt: e.cancelledAt ? toVnDateTime(e.cancelledAt) : null,
});
