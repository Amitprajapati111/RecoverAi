"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.refreshTokens = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const env_1 = require("../config/env");
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { businessName, email, password, name, phone } = req.body;
    const { user, merchant, tokens } = await auth_service_1.authService.register({
        businessName, email, password, name, phone,
    });
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    (0, apiResponse_1.sendSuccess)(res, {
        accessToken: tokens.accessToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        merchant: { id: merchant._id, businessName: merchant.businessName, email: merchant.email },
    }, 201);
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const { user, tokens } = await auth_service_1.authService.login({ email, password });
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    (0, apiResponse_1.sendSuccess)(res, {
        accessToken: tokens.accessToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, merchantId: user.merchantId },
    });
});
exports.refreshTokens = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    const tokens = await auth_service_1.authService.refreshTokens(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    (0, apiResponse_1.sendSuccess)(res, { accessToken: tokens.accessToken });
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.clearCookie('refreshToken');
    (0, apiResponse_1.sendSuccess)(res, { message: 'Logged out successfully' });
});
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    (0, apiResponse_1.sendSuccess)(res, { user: req.user });
});
//# sourceMappingURL=auth.controller.js.map