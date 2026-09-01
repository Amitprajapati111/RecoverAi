"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const simulatorController = __importStar(require("../controllers/simulator.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/run', auth_middleware_1.authenticate, simulatorController.runSimulation);
router.post('/winning-demo', auth_middleware_1.authenticate, simulatorController.runWinningDemo);
router.post('/clear', auth_middleware_1.authenticate, simulatorController.clearSimulatedData);
router.get('/stats', auth_middleware_1.authenticate, simulatorController.getSimulatorStats);
router.post('/demo/payment', auth_middleware_1.authenticate, simulatorController.createDemoPayment);
router.post('/demo/payment/fail', auth_middleware_1.authenticate, simulatorController.simulatePaymentFailure);
router.post('/demo/payment/success', auth_middleware_1.authenticate, simulatorController.simulatePaymentSuccess);
router.post('/demo/analysis', auth_middleware_1.authenticate, simulatorController.triggerDemoAnalysis);
router.post('/demo/webhook/duplicate', auth_middleware_1.authenticate, simulatorController.triggerDuplicateWebhookDemo);
exports.default = router;
//# sourceMappingURL=simulator.routes.js.map