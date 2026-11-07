import type { Role, Trainer, TrainerStatus, User, UserStatus } from '@prisma/client';
import { toDateOnly, toVnDateTime } from '../members/member.response';

/** Schema `TrainerProfile` trong openapi. */
export type TrainerProfileResponse = {
  id: string;
  specialties: string[];
  bio: string | null;
  experienceYears: number | null;
  status: TrainerStatus;
};

/** Schema `User` trong openapi. Không bao giờ trả password_hash, token_version. */
export type UserResponse = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  dob: string | null;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  shift: string | null;
  trainer: TrainerProfileResponse | null;
  createdAt: string;
};

export const toTrainerProfile = (t: Trainer): TrainerProfileResponse => ({
  id: t.id,
  specialties: t.specialties,
  bio: t.bio,
  experienceYears: t.experienceYears,
  status: t.status,
});

export const toUserResponse = (user: User & { trainer: Trainer | null }): UserResponse => ({
  id: user.id,
  fullName: user.fullName,
  phone: user.phone,
  email: user.email,
  dob: user.dob ? toDateOnly(user.dob) : null,
  avatarUrl: user.avatarUrl,
  role: user.role,
  status: user.status,
  shift: user.shift,
  // Hồ sơ PT chỉ có ý nghĩa khi đang là TRAINER (người từng là PT vẫn giữ dòng trainers cũ)
  trainer: user.role === 'TRAINER' && user.trainer ? toTrainerProfile(user.trainer) : null,
  createdAt: toVnDateTime(user.createdAt),
});
