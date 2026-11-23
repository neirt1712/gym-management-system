import type { Prisma } from '@prisma/client';
import { toVnDateTime } from '../members/member.response';
import type { ExerciseDto } from './dto/training.dto';

const TRAINER_INCLUDE = { trainer: { include: { user: true } } } as const;

export const PLAN_INCLUDE = TRAINER_INCLUDE satisfies Prisma.TrainingPlanInclude;
export const NOTE_INCLUDE = {
  ...TRAINER_INCLUDE,
  plan: { select: { id: true, title: true } },
} satisfies Prisma.TrainingNoteInclude;

type PlanEntity = Prisma.TrainingPlanGetPayload<{ include: typeof PLAN_INCLUDE }>;
type NoteEntity = Prisma.TrainingNoteGetPayload<{ include: typeof NOTE_INCLUDE }>;

const toTrainerRef = (t: PlanEntity['trainer']) => ({
  id: t.id,
  fullName: t.user.fullName,
  avatarUrl: t.user.avatarUrl,
});

/** Bài tập lưu JSONB; luôn trả đủ field của openapi Exercise (thiếu thì null). */
export const toExercises = (raw: Prisma.JsonValue) =>
  (Array.isArray(raw) ? (raw as Partial<ExerciseDto>[]) : []).map((e) => ({
    name: e.name ?? '',
    sets: e.sets ?? null,
    reps: e.reps ?? null,
    weightKg: e.weightKg ?? null,
    durationMinutes: e.durationMinutes ?? null,
    note: e.note ?? null,
  }));

/** openapi TrainingPlan. */
export const toPlanResponse = (p: PlanEntity) => ({
  id: p.id,
  memberId: p.memberId,
  trainer: toTrainerRef(p.trainer),
  title: p.title,
  exercises: toExercises(p.exercises),
  progressPercent: p.progressPercent,
  updatedAt: toVnDateTime(p.updatedAt),
});

/** openapi TrainingNote. */
export const toNoteResponse = (n: NoteEntity) => ({
  id: n.id,
  memberId: n.memberId,
  trainer: toTrainerRef(n.trainer),
  plan: n.plan ? { id: n.plan.id, title: n.plan.title } : null,
  content: n.content,
  progressPercent: n.progressPercent,
  createdAt: toVnDateTime(n.createdAt),
});
