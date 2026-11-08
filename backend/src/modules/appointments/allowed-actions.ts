import type { AppointmentStatus, AwaitingRole, ProposalKind } from '@prisma/client';
import type { AuthUser } from '../../common/http/request-context';

export type AppointmentAction = 'ACCEPT' | 'REJECT' | 'COUNTER' | 'RESCHEDULE' | 'CANCEL' | 'COMPLETE';
export type Party = 'MEMBER' | 'TRAINER';

export type ActionContext = {
  status: AppointmentStatus;
  awaitingRole: AwaitingRole | null;
  startsAt: Date;
  endsAt: Date;
  openProposalKind: ProposalKind | null;
  memberUserId: string;
  trainerUserId: string;
};

/** Người gọi là bên nào của lịch; Staff, Admin không phải một bên. */
export const partyOf = (
  user: AuthUser,
  ctx: Pick<ActionContext, 'memberUserId' | 'trainerUserId'>,
): Party | null => {
  if (user.role === 'MEMBER' && user.id === ctx.memberUserId) return 'MEMBER';
  if (user.role === 'TRAINER' && user.id === ctx.trainerUserId) return 'TRAINER';
  return null;
};

/**
 * Hành động người gọi được làm, theo bảng ở `GET /appointments/{id}` (openapi):
 * - PENDING, bên đang được hỏi: ACCEPT, REJECT, COUNTER;
 * - CONFIRMED, chưa tới giờ bắt đầu (Q20e), không có đề xuất OPEN, hội viên hoặc PT của lịch: RESCHEDULE, CANCEL;
 * - CONFIRMED, có RESCHEDULE/CANCEL đang OPEN, bên đang được hỏi: ACCEPT, REJECT;
 * - CONFIRMED, đã qua giờ kết thúc, PT của lịch hoặc ADMIN: COMPLETE;
 * - còn lại (gồm STAFF): [].
 */
export const allowedActions = (
  user: AuthUser,
  ctx: ActionContext,
  now: Date = new Date(),
): AppointmentAction[] => {
  const party = partyOf(user, ctx);
  const asked = party !== null && ctx.awaitingRole === party;
  const actions: AppointmentAction[] = [];

  if (ctx.status === 'PENDING' && asked) actions.push('ACCEPT', 'REJECT', 'COUNTER');

  if (ctx.status === 'CONFIRMED') {
    if (ctx.openProposalKind) {
      if (asked) actions.push('ACCEPT', 'REJECT');
    } else if (party && now < ctx.startsAt) {
      actions.push('RESCHEDULE', 'CANCEL');
    }
    if (now >= ctx.endsAt && (party === 'TRAINER' || user.role === 'ADMIN')) actions.push('COMPLETE');
  }
  return actions;
};

export const otherParty = (party: Party): Party => (party === 'MEMBER' ? 'TRAINER' : 'MEMBER');
