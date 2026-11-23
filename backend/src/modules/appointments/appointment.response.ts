import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../../common/http/request-context';
import { toVnDateTime } from '../members/member.response';
import { toMemberRef, toUserRef } from '../orders/order.response';
import { allowedActions } from './allowed-actions';

export const APPOINTMENT_INCLUDE = {
  member: { include: { user: true } },
  trainer: { include: { user: true } },
  subscription: { select: { id: true, packageName: true, sessionMinutes: true } },
  completer: true,
  proposals: { include: { proposer: true }, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.AppointmentInclude;

export type AppointmentEntity = Prisma.AppointmentGetPayload<{ include: typeof APPOINTMENT_INCLUDE }>;
type ProposalEntity = AppointmentEntity['proposals'][number];

/** openapi Proposal. Staff đề xuất hộ ghi là bên hội viên. */
const toProposal = (p: ProposalEntity) => ({
  id: p.id,
  kind: p.kind,
  proposedBy: toUserRef(p.proposer),
  proposedRole: p.proposedRole === 'TRAINER' ? ('TRAINER' as const) : ('MEMBER' as const),
  startsAt: p.startsAt ? toVnDateTime(p.startsAt) : null,
  endsAt: p.endsAt ? toVnDateTime(p.endsAt) : null,
  note: p.note,
  status: p.status,
  rejectReason: p.rejectReason,
  createdAt: toVnDateTime(p.createdAt),
});

/** openapi Appointment; `allowedActions` tính cho người gọi. */
export const toAppointmentResponse = (a: AppointmentEntity, user: AuthUser, now: Date = new Date()) => {
  const open = a.proposals.find((p) => p.status === 'OPEN') ?? null;
  return {
    id: a.id,
    member: toMemberRef(a.member),
    trainer: { id: a.trainer.id, fullName: a.trainer.user.fullName, avatarUrl: a.trainer.user.avatarUrl },
    subscription: { id: a.subscription.id, packageName: a.subscription.packageName },
    status: a.status,
    awaitingRole: a.awaitingRole,
    version: a.version,
    startsAt: toVnDateTime(a.startsAt),
    endsAt: toVnDateTime(a.endsAt),
    note: a.note,
    openProposal: open ? toProposal(open) : null,
    completedBy: a.completer ? toUserRef(a.completer) : null,
    completedAt: a.completedAt ? toVnDateTime(a.completedAt) : null,
    allowedActions: allowedActions(
      user,
      {
        status: a.status,
        awaitingRole: a.awaitingRole,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        openProposalKind: open?.kind ?? null,
        memberUserId: a.member.userId,
        trainerUserId: a.trainer.userId,
      },
      now,
    ),
  };
};

/** openapi AppointmentDetail: thêm mọi đề xuất, cũ nhất trước. */
export const toAppointmentDetail = (a: AppointmentEntity, user: AuthUser) => ({
  ...toAppointmentResponse(a, user),
  proposals: a.proposals.map(toProposal),
});
