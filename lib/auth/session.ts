import { User, UserRole } from '../types';

export const SESSION_COOKIE_NAME = 'civicpulse_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  cityId: string;
  expiresAt: number; // Unix timestamp in seconds
}

const DEFAULT_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'civicpulse-hmac-sha256-auth-session-key-2026-smart-city';

/**
 * Base64URL encoding/decoding helpers
 */
function base64UrlEncode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  return atob(base64);
}

/**
 * Computes HMAC-SHA256 signature using Web Crypto API (compatible with Edge and Node.js)
 */
async function computeSignature(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const bytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

/**
 * Creates a cryptographically signed session token
 */
export async function createSessionToken(
  user: User,
  durationSeconds: number = SESSION_DURATION_SECONDS
): Promise<string> {
  const payload: SessionPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    cityId: user.city_id,
    expiresAt: Math.floor(Date.now() / 1000) + durationSeconds,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await computeSignature(encodedPayload, DEFAULT_SECRET);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a session token. Returns null if invalid or expired.
 */
export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSignature] = parts;

  try {
    const expectedSignature = await computeSignature(encodedPayload, DEFAULT_SECRET);
    if (providedSignature !== expectedSignature) {
      return null;
    }

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as SessionPayload;

    // Check expiration
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.expiresAt && payload.expiresAt < nowSeconds) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies session payload from standard Cookie string or NextRequest
 */
export async function getSessionFromCookieHeader(cookieHeader?: string | null): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!sessionCookie) return null;

  const token = sessionCookie.substring(`${SESSION_COOKIE_NAME}=`.length);
  return verifySessionToken(token);
}
