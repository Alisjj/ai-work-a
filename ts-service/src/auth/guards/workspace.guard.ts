import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { workspaceId: string }>();
    const workspaceId = req.headers['x-workspace-id'] as string | undefined;

    if (!workspaceId) {
      throw new UnauthorizedException(
        'Missing x-workspace-id header. Provide your workspace ID to authenticate.'
      );
    }

    req.workspaceId = workspaceId;
    return true;
  }
}
