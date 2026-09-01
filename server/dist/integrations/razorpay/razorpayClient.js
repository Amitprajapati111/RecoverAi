"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRazorpayClient = getRazorpayClient;
exports.isRazorpayConfigured = isRazorpayConfigured;
exports.getRazorpayEnvironment = getRazorpayEnvironment;
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
let razorpayInstance = null;
function getRazorpayClient() {
    if (!razorpayInstance) {
        if (!env_1.env.RAZORPAY_KEY_ID || !env_1.env.RAZORPAY_KEY_SECRET) {
            logger_1.logger.warn('Razorpay credentials not configured. Running in DEMO MODE without live API calls.');
            // Return a mock-compatible instance — actual calls will be intercepted
        }
        razorpayInstance = new razorpay_1.default({
            key_id: env_1.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
            key_secret: env_1.env.RAZORPAY_KEY_SECRET || 'demo_secret',
        });
    }
    return razorpayInstance;
}
function isRazorpayConfigured() {
    return Boolean(env_1.env.RAZORPAY_KEY_ID && env_1.env.RAZORPAY_KEY_SECRET);
}
function getRazorpayEnvironment() {
    return env_1.env.RAZORPAY_ENV;
}
//# sourceMappingURL=razorpayClient.js.map