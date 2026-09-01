"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = exports.sendError = exports.sendSuccess = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const sendSuccess = (res, data, statusCode = 200, meta) => {
    const response = { success: true, data };
    if (meta)
        response.meta = meta;
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', details) => {
    const response = {
        success: false,
        error: { code, message, ...(details !== undefined ? { details } : {}) },
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
// Common error factories
exports.errors = {
    notFound: (resource) => new AppError(`${resource} not found`, 404, `${resource.toUpperCase().replace(/ /g, '_')}_NOT_FOUND`),
    unauthorized: (message = 'Unauthorized') => new AppError(message, 401, 'UNAUTHORIZED'),
    forbidden: (message = 'Forbidden') => new AppError(message, 403, 'FORBIDDEN'),
    badRequest: (message, code = 'BAD_REQUEST') => new AppError(message, 400, code),
    conflict: (message) => new AppError(message, 409, 'CONFLICT'),
    tooManyRequests: () => new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'),
    serviceUnavailable: (message = 'Service temporarily unavailable') => new AppError(message, 503, 'SERVICE_UNAVAILABLE'),
};
//# sourceMappingURL=apiResponse.js.map