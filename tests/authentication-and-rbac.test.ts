import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  SESSION_DURATION_SECONDS,
} from '../lib/auth/session';
import {
  isPublicRoute,
  isRouteAuthorized,
  getAuthorizedDashboardPath,
  DASHBOARD_ROUTES,
  ROLE_LABELS,
} from '../lib/auth/rbac';
import { dbRepository } from '../lib/db/repository';
import { mockStore } from '../lib/db/mock-store';
import { User, UserRole } from '../lib/types';

describe('1. RBAC Routing & Permission Matrix', () => {
  it('correctly identifies public and private routes', () => {
    // Public routes
    expect(isPublicRoute('/')).toBe(true);
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/register')).toBe(true);
    expect(isPublicRoute('/forgot-password')).toBe(true);
    expect(isPublicRoute('/reset-password')).toBe(true);
    expect(isPublicRoute('/map')).toBe(true);
    expect(isPublicRoute('/issues')).toBe(true);
    expect(isPublicRoute('/issues/inc-123')).toBe(true);
    expect(isPublicRoute('/infrastructure/infra-456')).toBe(true);

    // Private routes
    expect(isPublicRoute('/citizen/dashboard')).toBe(false);
    expect(isPublicRoute('/worker/dashboard')).toBe(false);
    expect(isPublicRoute('/officer/dashboard')).toBe(false);
    expect(isPublicRoute('/oversight/dashboard')).toBe(false);
    expect(isPublicRoute('/admin')).toBe(false);
    expect(isPublicRoute('/admin/settings')).toBe(false);
  });

  it('denies access to unauthenticated requests for private dashboard routes', () => {
    expect(isRouteAuthorized('/citizen/dashboard', undefined)).toBe(false);
    expect(isRouteAuthorized('/worker/dashboard', undefined)).toBe(false);
    expect(isRouteAuthorized('/officer/dashboard', undefined)).toBe(false);
    expect(isRouteAuthorized('/oversight/dashboard', undefined)).toBe(false);
    expect(isRouteAuthorized('/admin', undefined)).toBe(false);
  });

  it('enforces strict role-based vertical and horizontal isolation', () => {
    // Citizen permissions
    expect(isRouteAuthorized('/citizen/dashboard', 'citizen')).toBe(true);
    expect(isRouteAuthorized('/worker/dashboard', 'citizen')).toBe(false);
    expect(isRouteAuthorized('/officer/dashboard', 'citizen')).toBe(false);
    expect(isRouteAuthorized('/oversight/dashboard', 'citizen')).toBe(false);
    expect(isRouteAuthorized('/admin', 'citizen')).toBe(false);

    // Worker permissions
    expect(isRouteAuthorized('/worker/dashboard', 'worker')).toBe(true);
    expect(isRouteAuthorized('/officer/dashboard', 'worker')).toBe(false);
    expect(isRouteAuthorized('/oversight/dashboard', 'worker')).toBe(false);
    expect(isRouteAuthorized('/admin', 'worker')).toBe(false);

    // Officer permissions
    expect(isRouteAuthorized('/officer/dashboard', 'officer')).toBe(true);
    expect(isRouteAuthorized('/worker/dashboard', 'officer')).toBe(false);
    expect(isRouteAuthorized('/oversight/dashboard', 'officer')).toBe(false);
    expect(isRouteAuthorized('/admin', 'officer')).toBe(false);

    // Supervisor (oversight) permissions
    expect(isRouteAuthorized('/oversight/dashboard', 'oversight')).toBe(true);
    expect(isRouteAuthorized('/officer/dashboard', 'oversight')).toBe(false);
    expect(isRouteAuthorized('/worker/dashboard', 'oversight')).toBe(false);
    expect(isRouteAuthorized('/admin', 'oversight')).toBe(false);

    // Admin has governance access across all departmental dashboards
    expect(isRouteAuthorized('/admin', 'admin')).toBe(true);
    expect(isRouteAuthorized('/oversight/dashboard', 'admin')).toBe(true);
    expect(isRouteAuthorized('/officer/dashboard', 'admin')).toBe(true);
    expect(isRouteAuthorized('/worker/dashboard', 'admin')).toBe(true);
    expect(isRouteAuthorized('/citizen/dashboard', 'admin')).toBe(true);
  });

  it('maps each role to its official dashboard path', () => {
    expect(getAuthorizedDashboardPath('citizen')).toBe('/citizen/dashboard');
    expect(getAuthorizedDashboardPath('worker')).toBe('/worker/dashboard');
    expect(getAuthorizedDashboardPath('officer')).toBe('/officer/dashboard');
    expect(getAuthorizedDashboardPath('oversight')).toBe('/oversight/dashboard');
    expect(getAuthorizedDashboardPath('admin')).toBe('/admin');
  });
});

describe('2. Cryptographic Session Token Security', () => {
  const sampleUser: User = {
    id: 'usr-test-1',
    name: 'Sanjay Test',
    email: 'sanjay.test@civicpulse.org',
    role: 'officer',
    city_id: 'city-delhi',
    agency_id: 'agency-pwd',
    created_at: new Date().toISOString(),
  };

  it('generates a valid signed HMAC-SHA256 session token', async () => {
    const token = await createSessionToken(sampleUser, SESSION_DURATION_SECONDS);
    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);

    const parts = token.split('.');
    expect(parts.length).toBe(2);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(sampleUser.id);
    expect(verified?.email).toBe(sampleUser.email);
    expect(verified?.role).toBe(sampleUser.role);
    expect(verified?.name).toBe(sampleUser.name);
  });

  it('rejects tampered tokens with invalid cryptographic signatures', async () => {
    const token = await createSessionToken(sampleUser, SESSION_DURATION_SECONDS);
    const [payloadB64, sigB64] = token.split('.');

    // Tamper with the signature
    const tamperedSig = sigB64.slice(0, -4) + 'AAAA';
    const tamperedToken = `${payloadB64}.${tamperedSig}`;

    const verified = await verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('rejects forged payload attempting role escalation', async () => {
    const token = await createSessionToken(sampleUser, SESSION_DURATION_SECONDS);
    const [payloadB64, sigB64] = token.split('.');

    // Decode, tamper payload from officer to admin, re-encode without signature key
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    payload.role = 'admin';
    const forgedPayloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const forgedToken = `${forgedPayloadB64}.${sigB64}`;

    const verified = await verifySessionToken(forgedToken);
    expect(verified).toBeNull();
  });

  it('rejects expired session tokens', async () => {
    // Generate a token with negative duration (-10 seconds)
    const expiredToken = await createSessionToken(sampleUser, -10);
    const verified = await verifySessionToken(expiredToken);
    expect(verified).toBeNull();
  });

  it('safely handles malformed, empty or null token inputs', async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
    expect(await verifySessionToken('invalid-token')).toBeNull();
    expect(await verifySessionToken('only.one.dot.too.many')).toBeNull();
  });
});

describe('3. User Repository & Database Operations', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it('finds existing users by email', async () => {
    const adminUser = await dbRepository.getUserByEmail('admin@civicpulse.org');
    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe('admin');

    const nonExistent = await dbRepository.getUserByEmail('unknown.user@doesnotexist.com');
    expect(nonExistent).toBeUndefined();
  });

  it('creates new citizen accounts and persists them', async () => {
    const newCitizen = await dbRepository.createUser({
      name: 'Rohan Mehra',
      email: 'rohan.mehra@example.com',
      role: 'citizen',
      city_id: 'city-delhi',
      phone: '+91 99887 76655',
      active: true,
    });

    expect(newCitizen.id).toBeDefined();
    expect(newCitizen.role).toBe('citizen');
    expect(newCitizen.name).toBe('Rohan Mehra');

    const fetched = await dbRepository.getUserByEmail('rohan.mehra@example.com');
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(newCitizen.id);
  });

  it('allows administrator to update user roles', async () => {
    const worker = await dbRepository.getUserByEmail('rajesh.k@pwd.delhi.gov.in');
    expect(worker).toBeDefined();
    expect(worker?.role).toBe('worker');

    const updated = await dbRepository.updateUserRole(
      worker!.id,
      'officer',
      'usr-adm-1',
      'CivicPulse Admin'
    );

    expect(updated?.role).toBe('officer');

    const refetched = await dbRepository.getUserById(worker!.id);
    expect(refetched?.role).toBe('officer');
  });

  it('allows administrator to toggle user active status', async () => {
    const citizen = await dbRepository.getUserByEmail('aarav.sharma@example.com');
    expect(citizen).toBeDefined();

    // Deactivate user
    const deactivated = await dbRepository.toggleUserStatus(
      citizen!.id,
      false,
      'usr-adm-1',
      'CivicPulse Admin'
    );
    expect(deactivated?.active).toBe(false);

    // Reactivate user
    const reactivated = await dbRepository.toggleUserStatus(
      citizen!.id,
      true,
      'usr-adm-1',
      'CivicPulse Admin'
    );
    expect(reactivated?.active).toBe(true);
  });
});

describe('4. Personas and Role Consistency Verification', () => {
  beforeEach(() => {
    mockStore.reset();
  });
  it('contains all 5 essential demo personas with matching verified roles', async () => {
    const personas: { email: string; expectedRole: UserRole }[] = [
      { email: 'aarav.sharma@example.com', expectedRole: 'citizen' },
      { email: 's.gupta@pwd.delhi.gov.in', expectedRole: 'officer' },
      { email: 'rajesh.k@pwd.delhi.gov.in', expectedRole: 'worker' },
      { email: 'm.iyer@oversight.gov.in', expectedRole: 'oversight' },
      { email: 'admin@civicpulse.org', expectedRole: 'admin' },
    ];

    for (const p of personas) {
      const u = await dbRepository.getUserByEmail(p.email);
      expect(u).toBeDefined();
      expect(u?.role).toBe(p.expectedRole);
      expect(ROLE_LABELS[u!.role]).toBeDefined();
      expect(DASHBOARD_ROUTES[u!.role]).toBeDefined();
    }
  });
});
