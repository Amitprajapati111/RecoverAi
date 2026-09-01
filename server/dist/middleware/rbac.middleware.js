"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportOrAbove = exports.analystOrAbove = exports.adminOrAbove = exports.ownerOnly = exports.requireRole = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const requireRole = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(apiResponse_1.errors.unauthorized());
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(apiResponse_1.errors.forbidden(`Role '${req.user.role}' is not authorized for this action`));
        }
        next();
    };
};
exports.requireRole = requireRole;
// Shorthand helpers
exports.ownerOnly = (0, exports.requireRole)('OWNER');
exports.adminOrAbove = (0, exports.requireRole)('OWNER', 'ADMIN');
exports.analystOrAbove = (0, exports.requireRole)('OWNER', 'ADMIN', 'ANALYST');
exports.supportOrAbove = (0, exports.requireRole)('OWNER', 'ADMIN', 'ANALYST', 'SUPPORT');
//# sourceMappingURL=rbac.middleware.js.map