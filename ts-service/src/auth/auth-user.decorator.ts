import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { AuthUser as AuthUserType } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserType => {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.user) {
      throw new Error('Auth user was not attached to request');
    }

    return request.user;
  },
);

/**
 * Alias for CurrentUser — use as @AuthUser() in controllers.
 * Reads the workspace-scoped user attached by WorkspaceGuard.
 */
export const AuthUser = CurrentUser;

