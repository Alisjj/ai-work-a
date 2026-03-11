import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthUser } from '../auth.types';

/**
 * WorkspaceGuard - Validates workspace and optionally user.
 * For POST /candidates, only x-workspace-id is required (user derived from workspace).
 * For other endpoints, both x-user-id and x-workspace-id are required.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;
    const method = request.method;

    const userIdHeader = request.header('x-user-id');
    const workspaceIdHeader = request.header('x-workspace-id');

    // For POST /candidates, only require workspace-id
    if (method === 'POST' && path === '/candidates') {
      if (!workspaceIdHeader) {
        throw new UnauthorizedException(
          'Missing required header: x-workspace-id',
        );
      }
      // Derive user from workspace
      const user: AuthUser = {
        userId: `user-${workspaceIdHeader}`,
        workspaceId: workspaceIdHeader,
      };
      request.user = user;
      return true;
    }

    // For other endpoints, require both headers
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
