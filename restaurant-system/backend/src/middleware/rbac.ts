import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const authorize = (module: string, action: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Super Admin has full permissions across all modules
    if (req.user.role === 'super_admin') {
      return next();
    }

    const requiredPermission = `${module}:${action}`;
    const hasPermission = req.user.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `You do not have permission to perform '${action}' on '${module}'`
        )
      );
    }

    next();
  };
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (req.user.role === 'super_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return next(
      new ForbiddenError(`Access restricted to roles: ${allowedRoles.join(', ')}`)
    );
  };
};
