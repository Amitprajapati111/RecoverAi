import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ROLES } from '../config/constants';
type Role = keyof typeof ROLES;
export declare const requireRole: (...allowedRoles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const ownerOnly: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const adminOrAbove: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const analystOrAbove: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const supportOrAbove: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=rbac.middleware.d.ts.map