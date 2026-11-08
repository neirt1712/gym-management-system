import type { AuthUser } from '../../common/http/request-context';
import { allowedActions, type ActionContext } from './allowed-actions';

const member: AuthUser = { id: 'u-member', role: 'MEMBER', tokenVersion: 0 };
const trainer: AuthUser = { id: 'u-trainer', role: 'TRAINER', tokenVersion: 0 };
const otherMember: AuthUser = { id: 'u-other', role: 'MEMBER', tokenVersion: 0 };
const staff: AuthUser = { id: 'u-staff', role: 'STAFF', tokenVersion: 0 };
const admin: AuthUser = { id: 'u-admin', role: 'ADMIN', tokenVersion: 0 };

const now = new Date('2026-11-10T10:00:00+07:00');
const base: ActionContext = {
  status: 'PENDING',
  awaitingRole: 'TRAINER',
  startsAt: new Date('2026-11-12T18:00:00+07:00'),
  endsAt: new Date('2026-11-12T19:00:00+07:00'),
  openProposalKind: 'INITIAL',
  memberUserId: member.id,
  trainerUserId: trainer.id,
};

describe('allowedActions (bảng GET /appointments/{id})', () => {
  it('PENDING: bên đang được hỏi được ACCEPT, REJECT, COUNTER; bên kia không', () => {
    expect(allowedActions(trainer, base, now)).toEqual(['ACCEPT', 'REJECT', 'COUNTER']);
    expect(allowedActions(member, base, now)).toEqual([]);
  });

  it('CONFIRMED chưa tới giờ, không có đề xuất mở: hai bên được RESCHEDULE, CANCEL', () => {
    const ctx: ActionContext = { ...base, status: 'CONFIRMED', awaitingRole: null, openProposalKind: null };
    expect(allowedActions(member, ctx, now)).toEqual(['RESCHEDULE', 'CANCEL']);
    expect(allowedActions(trainer, ctx, now)).toEqual(['RESCHEDULE', 'CANCEL']);
  });

  it('CONFIRMED có RESCHEDULE đang mở: chỉ bên đang được hỏi được ACCEPT, REJECT', () => {
    const ctx: ActionContext = {
      ...base,
      status: 'CONFIRMED',
      awaitingRole: 'MEMBER',
      openProposalKind: 'RESCHEDULE',
    };
    expect(allowedActions(member, ctx, now)).toEqual(['ACCEPT', 'REJECT']);
    expect(allowedActions(trainer, ctx, now)).toEqual([]);
  });

  it('CONFIRMED đã qua giờ kết thúc: PT của lịch và Admin được COMPLETE; hội viên không', () => {
    const ctx: ActionContext = { ...base, status: 'CONFIRMED', awaitingRole: null, openProposalKind: null };
    const later = new Date('2026-11-12T19:30:00+07:00');
    expect(allowedActions(trainer, ctx, later)).toEqual(['COMPLETE']);
    expect(allowedActions(admin, ctx, later)).toEqual(['COMPLETE']);
    expect(allowedActions(member, ctx, later)).toEqual([]);
  });

  it('Staff và người ngoài lịch không có hành động nào', () => {
    expect(allowedActions(staff, base, now)).toEqual([]);
    expect(allowedActions(otherMember, { ...base, awaitingRole: 'MEMBER' }, now)).toEqual([]);
  });
});
