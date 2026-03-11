/**
 * WorkspaceGuard tests.
 */
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { WorkspaceGuard } from './workspace.guard';

describe('WorkspaceGuard', () => {
  let guard: WorkspaceGuard;

  beforeEach(() => {
    guard = new WorkspaceGuard();
  });

  it('should allow request with valid x-workspace-id header', () => {
    const context = createMockContext({ 'x-workspace-id': 'ws-123' });
    const request = context.switchToHttp().getRequest();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.workspaceId).toBe('ws-123');
  });

  it('should throw UnauthorizedException when x-workspace-id header is missing', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow(
      'Missing x-workspace-id header. Provide your workspace ID to authenticate.'
    );
  });

  it('should throw UnauthorizedException when x-workspace-id header is empty', () => {
    const context = createMockContext({ 'x-workspace-id': '' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  function createMockContext(headers: Record<string, string>): ExecutionContext {
    const request = {
      headers,
      workspaceId: undefined as string | undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }
});
