import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { Merchant } from '../models/Merchant';
import { RecoveryPolicy } from '../models/RecoveryPolicy';
import { env } from '../config/env';
import { errors } from '../utils/apiResponse';
import { auditService } from '../audit/auditService';
import { ACTOR_TYPE } from '../config/constants';

export interface RegisterInput {
  businessName: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function generateTokens(payload: { userId: string; merchantId: string; role: string; email: string }): AuthTokens {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput): Promise<{ user: InstanceType<typeof User>; merchant: InstanceType<typeof Merchant>; tokens: AuthTokens }> {
    // Check if email is already registered
    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw errors.conflict('An account with this email already exists');
    }

    // Create merchant
    const merchant = await Merchant.create({
      businessName: input.businessName,
      email: input.email.toLowerCase(),
      phone: input.phone,
    });

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create owner user
    const user = await User.create({
      merchantId: merchant._id,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'OWNER',
    });

    // Create default recovery policy for this merchant
    await RecoveryPolicy.create({ merchantId: merchant._id });

    const tokens = generateTokens({
      userId: (user._id as Types.ObjectId).toString(),
      merchantId: (merchant._id as Types.ObjectId).toString(),
      role: user.role,
      email: user.email,
    });

    await auditService.log({
      merchantId: merchant._id,
      actorType: ACTOR_TYPE.USER,
      actorId: (user._id as Types.ObjectId).toString(),
      action: 'MERCHANT_REGISTERED',
      entityType: 'Merchant',
      entityId: (merchant._id as Types.ObjectId).toString(),
    });

    return { user, merchant, tokens };
  },

  async login(input: LoginInput): Promise<{ user: InstanceType<typeof User>; tokens: AuthTokens }> {
    const user = await User.findOne({ email: input.email.toLowerCase(), isActive: true })
      .select('+passwordHash');

    if (!user) {
      throw errors.unauthorized('Invalid email or password');
    }

    const isValid = await user.comparePassword(input.password);
    if (!isValid) {
      throw errors.unauthorized('Invalid email or password');
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const tokens = generateTokens({
      userId: (user._id as Types.ObjectId).toString(),
      merchantId: user.merchantId.toString(),
      role: user.role,
      email: user.email,
    });

    await auditService.log({
      merchantId: user.merchantId,
      actorType: ACTOR_TYPE.USER,
      actorId: (user._id as Types.ObjectId).toString(),
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: (user._id as Types.ObjectId).toString(),
    });

    return { user, tokens };
  },

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        merchantId: string;
        role: string;
        email: string;
      };

      const user = await User.findById(decoded.userId).select('isActive role');
      if (!user || !user.isActive) {
        throw errors.unauthorized('Invalid refresh token');
      }

      return generateTokens({
        userId: decoded.userId,
        merchantId: decoded.merchantId,
        role: user.role,
        email: decoded.email,
      });
    } catch (error) {
      throw errors.unauthorized('Invalid or expired refresh token');
    }
  },
};
