"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportOrAbove = exports.analystOrAbove = exports.adminOrAbove = exports.ownerOnly = exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const apiResponse_1 = require("../utils/apiResponse");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            throw apiResponse_1.errors.unauthorized('No authentication token provided');
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        // Verify user still exists and is active
        const user = await User_1.User.findById(decoded.userId).select('isActive merchantId role');
        if (!user || !user.isActive) {
            throw apiResponse_1.errors.unauthorized('User account is inactive or not found');
        }
        req.user = {
            userId: decoded.userId,
            merchantId: decoded.merchantId,
            role: decoded.role,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(apiResponse_1.errors.unauthorized('Invalid authentication token'));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(apiResponse_1.errors.unauthorized('Authentication token expired'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
/**
 * RBAC middleware to enforce role permissions
 */
const requireRole = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(apiResponse_1.errors.unauthorized('Authentication required'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(apiResponse_1.errors.forbidden(`Forbidden: Action requires one of roles: [${allowedRoles.join(', ')}]. Your role: '${req.user.role}'`));
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.ownerOnly = (0, exports.requireRole)('OWNER');
exports.adminOrAbove = (0, exports.requireRole)('OWNER', 'ADMIN');
exports.analystOrAbove = (0, exports.requireRole)('OWNER', 'ADMIN', 'ANALYST');
exports.supportOrAbove = (0, exports.requireRole)('OWNER', 'ADMIN', 'ANALYST', 'SUPPORT');
//# sourceMappingURL=auth.middleware.js.map