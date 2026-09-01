import { Response } from 'express';
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare const sendSuccess: <T>(res: Response, data: T, statusCode?: number, meta?: ApiResponse["meta"]) => void;
export declare const sendError: (res: Response, message: string, statusCode?: number, code?: string, details?: unknown) => void;
export declare const errors: {
    notFound: (resource: string) => AppError;
    unauthorized: (message?: string) => AppError;
    forbidden: (message?: string) => AppError;
    badRequest: (message: string, code?: string) => AppError;
    conflict: (message: string) => AppError;
    tooManyRequests: () => AppError;
    serviceUnavailable: (message?: string) => AppError;
};
//# sourceMappingURL=apiResponse.d.ts.map