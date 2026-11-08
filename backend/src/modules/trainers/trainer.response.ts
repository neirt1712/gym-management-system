import type { Trainer, User } from '@prisma/client';
import { toVnDateTime } from '../members/member.response';

/** openapi Trainer: hồ sơ công khai, không có SĐT, email. */
export const toTrainerResponse = (trainer: Trainer & { user: User }) => ({
  id: trainer.id,
  userId: trainer.userId,
  fullName: trainer.user.fullName,
  avatarUrl: trainer.user.avatarUrl,
  specialties: trainer.specialties,
  bio: trainer.bio,
  experienceYears: trainer.experienceYears,
  status: trainer.status,
});

/** openapi TimeRange / AvailabilitySlot. */
export const toTimeRange = (r: { startsAt: Date; endsAt: Date }) => ({
  startsAt: toVnDateTime(r.startsAt),
  endsAt: toVnDateTime(r.endsAt),
});
