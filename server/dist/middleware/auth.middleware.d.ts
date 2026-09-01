import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        merchantId: string;
        role: string;
        email: string;
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * RBAC middleware to enforce role permissions
 */
export declare const requireRole: (...allowedRoles: string[]) => (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const ownerOnly: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const adminOrAbove: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const analystOrAbove: (req: AuthRequest, _res: Response, next: NextFunction) => void;
export declare const supportOrAbove: (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map