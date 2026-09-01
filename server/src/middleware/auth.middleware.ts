import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { errors } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    merchantId: string;
    role: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw errors.unauthorized('No authentication token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      merchantId: string;
      role: string;
      email: string;
    };

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('isActive merchantId role');
    if (!user || !user.isActive) {
      throw errors.unauthorized('User account is inactive or not found');
    }

    req.user = {
      userId: decoded.userId,
      merchantId: decoded.merchantId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(errors.unauthorized('Invalid authentication token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(errors.unauthorized('Authentication token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Auth middleware for simulator/demo endpoints:
 * - In production: always requires valid JWT
 * - In development or DEMO_MODE: allows anonymous demo identity when token is missing
 */
export const authenticateOrDemo = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      const allowAnonymousDemo = env.DEMO_MODE || env.NODE_ENV !== 'production';

      if (!allowAnonymousDemo) {
        throw errors.unauthorized('No authentication token provided');
      }

      req.user = {
        userId: '000000000000000000000001',
        merchantId: '000000000000000000000001',
        role: 'OWNER',
        email: 'demo@recoverai.local',
      };

      return next();
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      merchantId: string;
      role: string;
      email: string;
    };

    const user = await User.findById(decoded.userId).select('isActive merchantId role');
    if (!user || !user.isActive) {
      throw errors.unauthorized('User account is inactive or not found');
    }

    req.user = {
      userId: decoded.userId,
      merchantId: decoded.merchantId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(errors.unauthorized('Invalid authentication token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(errors.unauthorized('Authentication token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * RBAC middleware to enforce role permissions
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(errors.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        errors.forbidden(
          `Forbidden: Action requires one of roles: [${allowedRoles.join(', ')}]. Your role: '${req.user.role}'`
        )
      );
    }

    next();
  };
};

export const ownerOnly = requireRole('OWNER');
export const adminOrAbove = requireRole('OWNER', 'ADMIN');
export const analystOrAbove = requireRole('OWNER', 'ADMIN', 'ANALYST');
export const supportOrAbove = requireRole('OWNER', 'ADMIN', 'ANALYST', 'SUPPORT');
