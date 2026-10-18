import { AppError } from '../errors/app-error';
import type { AuthUser } from '../http/request-context';
import { assertFound, assertOwnership, canAccess } from './ownership';

describe('Kiểm tra quyền sở hữu', () => {
  const admin: AuthUser = { id: 'u-admin', role: 'ADMIN', tokenVersion: 0 };
  const staff: AuthUser = { id: 'u-staff', role: 'STAFF', tokenVersion: 0 };
  const member: AuthUser = { id: 'u-member', role: 'MEMBER', tokenVersion: 0 };
  const trainer: AuthUser = { id: 'u-trainer', role: 'TRAINER', tokenVersion: 0 };
  const owners = { memberUserId: 'u-member', trainerUserId: 'u-trainer' };

  it('ADMIN, STAFF xem được mọi tài nguyên theo mặc định', () => {
    expect(canAccess(admin, {})).toBe(true);
    expect(canAccess(staff, {})).toBe(true);
  });

  it('allowRoles chỉ ADMIN thì STAFF bị chặn', () => {
    expect(canAccess(staff, owners, { allowRoles: ['ADMIN'] })).toBe(false);
    expect(canAccess(admin, owners, { allowRoles: ['ADMIN'] })).toBe(true);
  });

  it('hội viên chỉ thấy tài nguyên của mình', () => {
    expect(canAccess(member, owners)).toBe(true);
    expect(canAccess(member, { memberUserId: 'u-khac' })).toBe(false);
    expect(canAccess(member, { memberUserId: null })).toBe(false);
  });

  it('PT chỉ thấy tài nguyên mình phụ trách', () => {
    expect(canAccess(trainer, owners)).toBe(true);
    expect(canAccess(trainer, { memberUserId: 'u-trainer' })).toBe(false);
  });

  it('không có quyền thì NOT_FOUND, không lộ là có tồn tại', () => {
    const run = () => assertOwnership(member, { memberUserId: 'u-khac' });
    expect(run).toThrow(AppError);
    expect(run).toThrow('NOT_FOUND');
    expect(() => assertOwnership(member, owners)).not.toThrow();
  });

  it('assertFound ném NOT_FOUND khi null hoặc undefined', () => {
    expect(() => assertFound(null)).toThrow('NOT_FOUND');
    expect(() => assertFound(undefined)).toThrow('NOT_FOUND');
    expect(() => assertFound({ id: 'x' })).not.toThrow();
  });
});
