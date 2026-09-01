import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../../app';
import { User } from '../../models/User';
import { RecoveryPolicy } from '../../models/RecoveryPolicy';
import { ROLES, DEFAULT_POLICY } from '../../config/constants';
import { env } from '../../config/env';

describe('RBAC (Role-Based Access Control) Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let merchantId: mongoose.Types.ObjectId;

  let ownerToken: string;
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    merchantId = new mongoose.Types.ObjectId();

    // Create policy for merchant
    await RecoveryPolicy.create({
      merchantId,
      ...DEFAULT_POLICY,
    });

    // Create test users for each role
    const ownerUser = await User.create({
      merchantId,
      name: 'Owner User',
      email: `owner_${Date.now()}@test.com`,
      passwordHash: 'hashed_pw',
      role: ROLES.OWNER,
    });

    const adminUser = await User.create({
      merchantId,
      name: 'Admin User',
      email: `admin_${Date.now()}@test.com`,
      passwordHash: 'hashed_pw',
      role: ROLES.ADMIN,
    });

    const analystUser = await User.create({
      merchantId,
      name: 'Analyst User',
      email: `analyst_${Date.now()}@test.com`,
      passwordHash: 'hashed_pw',
      role: ROLES.ANALYST,
    });

    const viewerUser = await User.create({
      merchantId,
      name: 'Viewer User',
      email: `viewer_${Date.now()}@test.com`,
      passwordHash: 'hashed_pw',
      role: ROLES.VIEWER,
    });

    // Generate JWT tokens
    ownerToken = jwt.sign(
      { userId: ownerUser._id.toString(), merchantId: merchantId.toString(), role: ROLES.OWNER, email: ownerUser.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), merchantId: merchantId.toString(), role: ROLES.ADMIN, email: adminUser.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    analystToken = jwt.sign(
      { userId: analystUser._id.toString(), merchantId: merchantId.toString(), role: ROLES.ANALYST, email: analystUser.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      { userId: viewerUser._id.toString(), merchantId: merchantId.toString(), role: ROLES.VIEWER, email: viewerUser.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
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

    const data = (await res.json()) as any;
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

    const data = (await res.json()) as any;
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

    const data = (await res.json()) as any;
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

    const data = (await res.json()) as any;
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

    const data = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
