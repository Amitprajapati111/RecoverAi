"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLimiter = exports.apiLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const constants_1 = require("../config/constants");
const env_1 = require("../config/env");
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: constants_1.RATE_LIMITS.AUTH.windowMs,
    max: constants_1.RATE_LIMITS.AUTH.max,
    skip: () => env_1.env.NODE_ENV === 'test',
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth requests, please try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: constants_1.RATE_LIMITS.API.windowMs,
    max: constants_1.RATE_LIMITS.API.max,
    skip: () => env_1.env.NODE_ENV === 'test',
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many API requests, please slow down.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.aiLimiter = (0, express_rate_limit_1.default)({
    windowMs: constants_1.RATE_LIMITS.AI.windowMs,
    max: constants_1.RATE_LIMITS.AI.max,
    skip: () => env_1.env.NODE_ENV === 'test',
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'AI rate limit exceeded. Please wait a minute.' } },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimit.middleware.js.map