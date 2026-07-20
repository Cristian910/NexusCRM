import { JwtAccessGuard } from '../guards/jwt-access.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

const createMockContext = (isPublic: boolean, hasUser: boolean): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        user: hasUser ? { sub: 'user-1', email: 'test@example.com' } : undefined,
        headers: {
          authorization: hasUser ? 'Bearer valid-token' : undefined,
        },
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _isPublic: isPublic,
  }) as unknown as ExecutionContext;

describe('JwtAccessGuard', () => {
  let guard: JwtAccessGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAccessGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access to public routes without token', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createMockContext(true, false);

    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
