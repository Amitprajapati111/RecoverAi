"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const { combine, timestamp, errors, json, colorize, simple } = winston_1.default.format;
exports.logger = winston_1.default.createLogger({
    level: env_1.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
    defaultMeta: { service: 'recoverai-server' },
    transports: [
        new winston_1.default.transports.Console({
            format: env_1.env.NODE_ENV === 'development'
                ? combine(colorize(), simple())
                : combine(timestamp(), json()),
        }),
    ],
});
// Add file transport in production
if (env_1.env.NODE_ENV === 'production') {
    exports.logger.add(new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }));
    exports.logger.add(new winston_1.default.transports.File({ filename: 'logs/combined.log' }));
}
//# sourceMappingURL=logger.js.map