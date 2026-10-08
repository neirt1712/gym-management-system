import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../errors/app-error';
import type { AuthUser } from '../http/request-context';
import type { Role } from './role';
import { RolesGuard } from './roles.guard';

const contextFor = (user?: AuthUser): ExecutionContext =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

const guardRequiring = (roles?: Role[]) => {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
  return new RolesGuard(reflector);
};

describe('RolesGuard', () => {
  const admin: AuthUser = { id: 'u-1', role: 'ADMIN', tokenVersion: 0 };
  const member: AuthUser = { id: 'u-2', role: 'MEMBER', tokenVersion: 0 };

  it('không gắn @Roles thì cho qua', () => {
    expect(guardRequiring(undefined).canActivate(contextFor(member))).toBe(true);
  });

  it('đúng vai trò thì cho qua', () => {
    expect(guardRequiring(['ADMIN', 'STAFF']).canActivate(contextFor(admin))).toBe(true);
  });

  it('sai vai trò thì FORBIDDEN', () => {
    const run = () => guardRequiring(['ADMIN']).canActivate(contextFor(member));
    expect(run).toThrow(AppError);
    expect(run).toThrow('FORBIDDEN');
  });
});
