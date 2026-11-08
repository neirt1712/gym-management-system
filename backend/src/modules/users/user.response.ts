import type { Trainer, User } from '@prisma/client';
import { toDateOnly, toVnDateTime } from '../members/member.response';

/** openapi TrainerProfile. */
export const toTrainerProfile = (trainer: Trainer) => ({
  id: trainer.id,
  specialties: trainer.specialties,
  bio: trainer.bio,
  experienceYears: trainer.experienceYears,
  status: trainer.status,
});

/** openapi User. Không bao giờ trả password_hash. */
export const toUserResponse = (user: User & { trainer: Trainer | null }) => ({
  id: user.id,
  fullName: user.fullName,
  phone: user.phone,
  email: user.email,
  dob: user.dob ? toDateOnly(user.dob) : null,
  avatarUrl: user.avatarUrl,
  role: user.role,
  status: user.status,
  shift: user.shift,
  trainer: user.trainer ? toTrainerProfile(user.trainer) : null,
  createdAt: toVnDateTime(user.createdAt),
});
