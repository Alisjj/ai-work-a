import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WorkspaceGuard } from './workspace.guard';
import { Request } from 'express';

describe('WorkspaceGuard', () => {
  let guard: WorkspaceGuard;

  beforeEach(() => {
    guard = new WorkspaceGuard();
  });

  it('should allow request with valid x-workspace-id header', () => {
    const context = createMockContext({ 'x-user-id': 'u-1', 'x-workspace-id': 'ws-123' });
    const request = context.switchToHttp().getRequest() as any;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ userId: 'u-1', workspaceId: 'ws-123' });
  });

  it('should throw UnauthorizedException when x-workspace-id header is missing for POST /candidates', () => {
    const context = createMockContext({}, 'POST', '/candidates');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      'Missing required header: x-workspace-id'
    );
  });

  it('should allow POST /candidates with only x-workspace-id', () => {
    const context = createMockContext({ 'x-workspace-id': 'ws-123' }, 'POST', '/candidates');
    const request = context.switchToHttp().getRequest() as any;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ userId: 'user-ws-123', workspaceId: 'ws-123' });
  });

  it('should throw UnauthorizedException when x-user-id header is missing for non-POST /candidates', () => {
    const context = createMockContext({ 'x-workspace-id': 'ws-123' }, 'GET', '/candidates/123');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      'Missing required headers: x-user-id and x-workspace-id'
    );
  });

  function createMockContext(headers: Record<string, string>, method = 'GET', path = '/candidates'): ExecutionContext {
    const request = {
      header: (name: string) => headers[name.toLowerCase()],
      method,
      path,
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }
});
