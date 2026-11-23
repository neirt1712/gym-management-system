import type { Member, Trainer, User } from '@prisma/client';
import { toDateOnly, toVnDateTime } from '../members/member.response';

export type MeEntity = User & {
  member: (Member & { subscriptions: { id: string }[] }) | null;
  trainer: Trainer | null;
};

/** openapi: Me. Phần không thuộc vai trò trả null. qrToken chỉ chủ tài khoản thấy. */
export const toMeResponse = (user: MeEntity) => ({
  id: user.id,
  fullName: user.fullName,
  phone: user.phone,
  email: user.email,
  dob: user.dob ? toDateOnly(user.dob) : null,
  avatarUrl: user.avatarUrl,
  role: user.role,
  status: user.status,
  shift: user.shift,
  member: user.member
    ? {
        id: user.member.id,
        memberCode: user.member.memberCode,
        qrToken: user.member.qrToken,
        hasActiveSubscription: user.member.subscriptions.length > 0,
      }
    : null,
  trainer: user.trainer
    ? {
        id: user.trainer.id,
        specialties: user.trainer.specialties,
        bio: user.trainer.bio,
        experienceYears: user.trainer.experienceYears,
        status: user.trainer.status,
      }
    : null,
  createdAt: toVnDateTime(user.createdAt),
});
