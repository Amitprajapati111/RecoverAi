import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { env } from '../config/env';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { businessName, email, password, name, phone } = req.body;
  const { user, merchant, tokens } = await authService.register({
    businessName, email, password, name, phone,
  });

  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

  sendSuccess(res, {
    accessToken: tokens.accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    merchant: { id: merchant._id, businessName: merchant.businessName, email: merchant.email },
  }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login({ email, password });

  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

  sendSuccess(res, {
    accessToken: tokens.accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, merchantId: user.merchantId },
  });
});

export const refreshTokens = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  const tokens = await authService.refreshTokens(refreshToken);

  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
  sendSuccess(res, { accessToken: tokens.accessToken });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  sendSuccess(res, { user: req.user });
});




