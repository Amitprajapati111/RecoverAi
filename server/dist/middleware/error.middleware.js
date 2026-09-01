"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    logger_1.logger.error({
        message: err.message,
        stack: env_1.env.NODE_ENV !== 'production' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });
    if (err instanceof apiResponse_1.AppError) {
        (0, apiResponse_1.sendError)(res, err.message, err.statusCode, err.code);
        return;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        (0, apiResponse_1.sendError)(res, 'Validation failed', 400, 'VALIDATION_ERROR', err.message);
        return;
    }
    // Mongoose duplicate key error
    if (err.code === '11000') {
        (0, apiResponse_1.sendError)(res, 'Duplicate entry', 409, 'DUPLICATE_ENTRY');
        return;
    }
    // Generic 500 in production — never leak stack trace
    (0, apiResponse_1.sendError)(res, env_1.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message, 500, 'INTERNAL_ERROR');
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    (0, apiResponse_1.sendError)(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map