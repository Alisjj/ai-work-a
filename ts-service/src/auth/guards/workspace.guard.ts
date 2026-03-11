import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthUser } from '../auth.types';

/**
 * WorkspaceGuard - Validates that the user belongs to the expected workspace.
 * For this assessment, we use fake auth via headers (x-user-id, x-workspace-id).
 * In production, this would validate JWT tokens or session data.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const userIdHeader = request.header('x-user-id');
    const workspaceIdHeader = request.header('x-workspace-id');

    if (!userIdHeader || !workspaceIdHeader) {
      throw new UnauthorizedException(
        'Missing required headers: x-user-id and x-workspace-id',
      );
    }

    const user: AuthUser = {
      userId: userIdHeader,
      workspaceId: workspaceIdHeader,
    };

    request.user = user;
    return true;
  }
}
