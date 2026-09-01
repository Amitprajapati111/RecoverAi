"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Merchant_1 = require("../models/Merchant");
const RecoveryPolicy_1 = require("../models/RecoveryPolicy");
const env_1 = require("../config/env");
const apiResponse_1 = require("../utils/apiResponse");
const auditService_1 = require("../audit/auditService");
const constants_1 = require("../config/constants");
function generateTokens(payload) {
    const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
    });
    return { accessToken, refreshToken };
}
exports.authService = {
    async register(input) {
        // Check if email is already registered
        const existingUser = await User_1.User.findOne({ email: input.email.toLowerCase() });
        if (existingUser) {
            throw apiResponse_1.errors.conflict('An account with this email already exists');
        }
        // Create merchant
        const merchant = await Merchant_1.Merchant.create({
            businessName: input.businessName,
            email: input.email.toLowerCase(),
            phone: input.phone,
        });
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
        // Create owner user
        const user = await User_1.User.create({
            merchantId: merchant._id,
            name: input.name,
            email: input.email.toLowerCase(),
            passwordHash,
            role: 'OWNER',
        });
        // Create default recovery policy for this merchant
        await RecoveryPolicy_1.RecoveryPolicy.create({ merchantId: merchant._id });
        const tokens = generateTokens({
            userId: user._id.toString(),
            merchantId: merchant._id.toString(),
            role: user.role,
            email: user.email,
        });
        await auditService_1.auditService.log({
            merchantId: merchant._id,
            actorType: constants_1.ACTOR_TYPE.USER,
            actorId: user._id.toString(),
            action: 'MERCHANT_REGISTERED',
            entityType: 'Merchant',
            entityId: merchant._id.toString(),
        });
        return { user, merchant, tokens };
    },
    async login(input) {
        const user = await User_1.User.findOne({ email: input.email.toLowerCase(), isActive: true })
            .select('+passwordHash');
        if (!user) {
            throw apiResponse_1.errors.unauthorized('Invalid email or password');
        }
        const isValid = await user.comparePassword(input.password);
        if (!isValid) {
            throw apiResponse_1.errors.unauthorized('Invalid email or password');
        }
        await User_1.User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
        const tokens = generateTokens({
            userId: user._id.toString(),
            merchantId: user.merchantId.toString(),
            role: user.role,
            email: user.email,
        });
        await auditService_1.auditService.log({
            merchantId: user.merchantId,
            actorType: constants_1.ACTOR_TYPE.USER,
            actorId: user._id.toString(),
            action: 'USER_LOGIN',
            entityType: 'User',
            entityId: user._id.toString(),
        });
        return { user, tokens };
    },
    async refreshTokens(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
            const user = await User_1.User.findById(decoded.userId).select('isActive role');
            if (!user || !user.isActive) {
                throw apiResponse_1.errors.unauthorized('Invalid refresh token');
            }
            return generateTokens({
                userId: decoded.userId,
                merchantId: decoded.merchantId,
                role: user.role,
                email: decoded.email,
            });
        }
        catch (error) {
            throw apiResponse_1.errors.unauthorized('Invalid or expired refresh token');
        }
    },
};
//# sourceMappingURL=auth.service.js.map