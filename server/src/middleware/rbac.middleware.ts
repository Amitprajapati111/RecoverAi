import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { errors } from '../utils/apiResponse';
import { ROLES } from '../config/constants';

type Role = keyof typeof ROLES;

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(errors.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(errors.forbidden(`Role '${req.user.role}' is not authorized for this action`));
    }

    next();
  };
};

// Shorthand helpers
export const ownerOnly = requireRole('OWNER');
export const adminOrAbove = requireRole('OWNER', 'ADMIN');
export const analystOrAbove = requireRole('OWNER', 'ADMIN', 'ANALYST');
export const supportOrAbove = requireRole('OWNER', 'ADMIN', 'ANALYST', 'SUPPORT');
