import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { JWTPayload } from '@/types/index';

// ─── JWT helpers ─────────────────────────────────────────────────────────────

/**
 * Signs a JWT with a 7-day expiry.
 * Throws if JWT_SECRET is not set in the environment.
 *
 * Requirements: 2.1, 2.4, 4.1
 */
export function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a JWT and returns the decoded payload, or null if the token is
 * invalid or expired.
 *
 * Requirements: 2.1, 2.4, 4.1
 */
export function verifyJWT(token: string): JWTPayload | null {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    if (
      err instanceof jwt.JsonWebTokenError ||
      err instanceof jwt.TokenExpiredError
    ) {
      return null;
    }
    throw err;
  }
}

// ─── bcrypt helpers ───────────────────────────────────────────────────────────

/**
 * Hashes a plain-text password with bcrypt (cost factor 12).
 *
 * Requirement: 1.4
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 *
 * Requirement: 1.4
 */
export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
