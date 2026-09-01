"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("../../app");
const User_1 = require("../../models/User");
const RecoveryPolicy_1 = require("../../models/RecoveryPolicy");
const constants_1 = require("../../config/constants");
const env_1 = require("../../config/env");
describe('RBAC (Role-Based Access Control) Test Suite', () => {
    let server;
    let baseUrl;
    let merchantId;
    let ownerToken;
    let adminToken;
    let analystToken;
    let viewerToken;
    beforeAll(async () => {
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        }
        merchantId = new mongoose_1.default.Types.ObjectId();
        // Create policy for merchant
        await RecoveryPolicy_1.RecoveryPolicy.create({
            merchantId,
            ...constants_1.DEFAULT_POLICY,
        });
        // Create test users for each role
        const ownerUser = await User_1.User.create({
            merchantId,
            name: 'Owner User',
            email: `owner_${Date.now()}@test.com`,
            passwordHash: 'hashed_pw',
            role: constants_1.ROLES.OWNER,
        });
        const adminUser = await User_1.User.create({
            merchantId,
            name: 'Admin User',
            email: `admin_${Date.now()}@test.com`,
            passwordHash: 'hashed_pw',
            role: constants_1.ROLES.ADMIN,
        });
        const analystUser = await User_1.User.create({
            merchantId,
            name: 'Analyst User',
            email: `analyst_${Date.now()}@test.com`,
            passwordHash: 'hashed_pw',
            role: constants_1.ROLES.ANALYST,
        });
        const viewerUser = await User_1.User.create({
            merchantId,
            name: 'Viewer User',
            email: `viewer_${Date.now()}@test.com`,
            passwordHash: 'hashed_pw',
            role: constants_1.ROLES.VIEWER,
        });
        // Generate JWT tokens
        ownerToken = jsonwebtoken_1.default.sign({ userId: ownerUser._id.toString(), merchantId: merchantId.toString(), role: constants_1.ROLES.OWNER, email: ownerUser.email }, env_1.env.JWT_SECRET, { expiresIn: '1h' });
        adminToken = jsonwebtoken_1.default.sign({ userId: adminUser._id.toString(), merchantId: merchantId.toString(), role: constants_1.ROLES.ADMIN, email: adminUser.email }, env_1.env.JWT_SECRET, { expiresIn: '1h' });
        analystToken = jsonwebtoken_1.default.sign({ userId: analystUser._id.toString(), merchantId: merchantId.toString(), role: constants_1.ROLES.ANALYST, email: analystUser.email }, env_1.env.JWT_SECRET, { expiresIn: '1h' });
        viewerToken = jsonwebtoken_1.default.sign({ userId: viewerUser._id.toString(), merchantId: merchantId.toString(), role: constants_1.ROLES.VIEWER, email: viewerUser.email }, env_1.env.JWT_SECRET, { expiresIn: '1h' });
        const app = (0, app_1.createApp)();
        await new Promise((resolve) => {
            server = app.listen(0, () => {
                const addr = server.address();
                baseUrl = `http://127.0.0.1:${addr.port}`;
                resolve();
            });
        });
    });
    afterAll(async () => {
        await new Promise((resolve) => server.close(() => resolve()));
        await mongoose_1.default.disconnect();
    });
    // Test 1: OWNER accessing protected endpoint -> 200 OK
    it('OWNER accessing protected policy update endpoint -> 200 OK', async () => {
        const res = await fetch(`${baseUrl}/api/policies`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ownerToken}`,
            },
            body: JSON.stringify({
                minimumRecoveryProbability: 0.6,
            }),
        });
        const data = (await res.json());
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });
    // Test 2: ADMIN accessing adminOrAbove endpoint -> 200 OK
    it('ADMIN accessing protected policy update endpoint -> 200 OK', async () => {
        const res = await fetch(`${baseUrl}/api/policies`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                minimumRecoveryProbability: 0.65,
            }),
        });
        const data = (await res.json());
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });
    // Test 3: VIEWER accessing protected policy update endpoint -> 403 FORBIDDEN
    it('VIEWER accessing protected policy update endpoint -> 403 FORBIDDEN', async () => {
        const res = await fetch(`${baseUrl}/api/policies`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${viewerToken}`,
            },
            body: JSON.stringify({
                minimumRecoveryProbability: 0.7,
            }),
        });
        const data = (await res.json());
        expect(res.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('FORBIDDEN');
    });
    // Test 4: ANALYST accessing ownerOnly endpoint -> 403 FORBIDDEN
    it('ANALYST accessing ownerOnly razorpay credentials endpoint -> 403 FORBIDDEN', async () => {
        const res = await fetch(`${baseUrl}/api/merchants/razorpay-credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${analystToken}`,
            },
            body: JSON.stringify({
                keyId: 'rzp_test_new',
                keySecret: 'new_secret',
            }),
        });
        const data = (await res.json());
        expect(res.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('FORBIDDEN');
    });
    // Test 5: VIEWER accessing read-only endpoint -> 200 OK
    it('VIEWER accessing read-only policy endpoint -> 200 OK', async () => {
        const res = await fetch(`${baseUrl}/api/policies`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${viewerToken}`,
            },
        });
        const data = (await res.json());
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });
});
//# sourceMappingURL=rbac.test.js.map