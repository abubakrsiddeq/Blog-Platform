// Feature: blog-platform, Property 7: Middleware rejects requests without a valid JWT on protected routes

/**
 * Unit tests for middleware JWT verification logic.
 *
 * Because Next.js middleware runs on the Edge runtime (which is not available
 * in the Node.js Jest environment), we test the underlying JWT verification
 * logic from lib/auth.ts directly, and separately test the role-check decision
 * logic that the middleware applies.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */

import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import { signJWT, verifyJWT } from '../lib/auth';
import type { JWTPayload } from '../types/index';

// ─── Setup ────────────────────────────────────────────────────────────────────

const TEST_SECRET = 'test-jwt-secret-for-middleware-tests';

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mirrors the isAuthorOnlyRoute logic from middleware.ts so we can test the
 * role-check decision without importing the Edge-runtime middleware file.
 *
 * Requirements: 4.3, 4.4
 */
function isAuthorOnlyRoute(method: string, pathname: string): boolean {
  if (method === 'POST' && pathname === '/api/posts') {
    return true;
  }
  if (
    (method === 'PUT' || method === 'DELETE') &&
    /^\/api\/posts\/[^/]+$/.test(pathname)
  ) {
    return true;
  }
  if (method === 'POST' && pathname.startsWith('/api/upload')) {
    return true;
  }
  return false;
}

/**
 * Simulates the middleware decision for a given token value and route.
 * Returns the HTTP status code the middleware would respond with.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
function simulateMiddleware(
  token: string | undefined,
  method: string,
  pathname: string,
): 200 | 401 | 403 {
  // No token → 401
  if (!token) {
    return 401;
  }

  const payload = verifyJWT(token);

  // Invalid / expired token → 401
  if (!payload) {
    return 401;
  }

  // Role-based check for author-only routes
  if (isAuthorOnlyRoute(method, pathname) && payload.role === 'reader') {
    return 403;
  }

  return 200;
}

// ─── Unit tests: verifyJWT with missing / invalid tokens ─────────────────────

describe('verifyJWT — missing and invalid tokens', () => {
  /**
   * Requirement 4.2: absent JWT → middleware returns 401.
   * verifyJWT is not called when the token is absent; the middleware short-circuits.
   * We verify that the simulation correctly maps undefined → 401.
   */
  test('missing token causes middleware to return 401', () => {
    const status = simulateMiddleware(undefined, 'GET', '/api/posts');
    expect(status).toBe(401);
  });

  /**
   * Requirement 4.1, 4.2: invalid token string → verifyJWT returns null → 401.
   */
  test('verifyJWT returns null for the string "invalid"', () => {
    expect(verifyJWT('invalid')).toBeNull();
  });

  test('verifyJWT returns null for an empty string', () => {
    expect(verifyJWT('')).toBeNull();
  });

  test('verifyJWT returns null for a random non-JWT string', () => {
    expect(verifyJWT('not.a.jwt')).toBeNull();
  });

  test('verifyJWT returns null for a JWT signed with a different secret', () => {
    const foreignToken = jwt.sign(
      { sub: 'user-id', role: 'author' },
      'wrong-secret',
      { expiresIn: '1h' },
    );
    expect(verifyJWT(foreignToken)).toBeNull();
  });

  /**
   * Requirement 4.2: expired token → verifyJWT returns null → 401.
   */
  test('verifyJWT returns null for an expired token', () => {
    const expiredToken = jwt.sign(
      { sub: 'user-id', role: 'author' },
      TEST_SECRET,
      { expiresIn: -1 }, // already expired
    );
    expect(verifyJWT(expiredToken)).toBeNull();
  });

  test('invalid token causes middleware to return 401', () => {
    const status = simulateMiddleware('not-a-valid-jwt', 'GET', '/api/posts');
    expect(status).toBe(401);
  });

  test('expired token causes middleware to return 401', () => {
    const expiredToken = jwt.sign(
      { sub: 'user-id', role: 'author' },
      TEST_SECRET,
      { expiresIn: -1 },
    );
    const status = simulateMiddleware(expiredToken, 'GET', '/api/posts');
    expect(status).toBe(401);
  });
});

// ─── Unit tests: verifyJWT with a valid token ─────────────────────────────────

describe('verifyJWT — valid tokens', () => {
  /**
   * Requirement 4.1: valid JWT → verifyJWT returns the decoded payload.
   */
  test('verifyJWT returns the correct payload for a valid author token', () => {
    const token = signJWT({ sub: 'author-id-123', role: 'author' });
    const payload = verifyJWT(token);

    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('author-id-123');
    expect(payload!.role).toBe('author');
  });

  test('verifyJWT returns the correct payload for a valid reader token', () => {
    const token = signJWT({ sub: 'reader-id-456', role: 'reader' });
    const payload = verifyJWT(token);

    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('reader-id-456');
    expect(payload!.role).toBe('reader');
  });

  test('valid author token causes middleware to return 200 on a non-author-only route', () => {
    const token = signJWT({ sub: 'author-id', role: 'author' });
    const status = simulateMiddleware(token, 'GET', '/api/posts');
    expect(status).toBe(200);
  });

  test('valid reader token causes middleware to return 200 on a non-author-only route', () => {
    const token = signJWT({ sub: 'reader-id', role: 'reader' });
    const status = simulateMiddleware(token, 'GET', '/api/posts');
    expect(status).toBe(200);
  });
});

// ─── Unit tests: role-based access control (403) ─────────────────────────────

describe('Role-based access control — reader on author-only routes', () => {
  /**
   * Requirement 4.3, 4.4: reader role on author-only route → 403.
   */
  test('reader token on POST /api/posts causes middleware to return 403', () => {
    const token = signJWT({ sub: 'reader-id', role: 'reader' });
    const status = simulateMiddleware(token, 'POST', '/api/posts');
    expect(status).toBe(403);
  });

  test('reader token on PUT /api/posts/:id causes middleware to return 403', () => {
    const token = signJWT({ sub: 'reader-id', role: 'reader' });
    const status = simulateMiddleware(token, 'PUT', '/api/posts/abc123');
    expect(status).toBe(403);
  });

  test('reader token on DELETE /api/posts/:id causes middleware to return 403', () => {
    const token = signJWT({ sub: 'reader-id', role: 'reader' });
    const status = simulateMiddleware(token, 'DELETE', '/api/posts/abc123');
    expect(status).toBe(403);
  });

  test('reader token on POST /api/upload causes middleware to return 403', () => {
    const token = signJWT({ sub: 'reader-id', role: 'reader' });
    const status = simulateMiddleware(token, 'POST', '/api/upload');
    expect(status).toBe(403);
  });

  test('author token on POST /api/posts causes middleware to return 200', () => {
    const token = signJWT({ sub: 'author-id', role: 'author' });
    const status = simulateMiddleware(token, 'POST', '/api/posts');
    expect(status).toBe(200);
  });

  test('author token on PUT /api/posts/:id causes middleware to return 200', () => {
    const token = signJWT({ sub: 'author-id', role: 'author' });
    const status = simulateMiddleware(token, 'PUT', '/api/posts/abc123');
    expect(status).toBe(200);
  });

  test('author token on DELETE /api/posts/:id causes middleware to return 200', () => {
    const token = signJWT({ sub: 'author-id', role: 'author' });
    const status = simulateMiddleware(token, 'DELETE', '/api/posts/abc123');
    expect(status).toBe(200);
  });

  test('reader token on GET /api/posts (non-author-only) causes middleware to return 200', () => {
    const token = signJWT({ sub: 'reader-id', role: 'reader' });
    const status = simulateMiddleware(token, 'GET', '/api/posts');
    expect(status).toBe(200);
  });
});

// ─── Property 7: Middleware rejects requests without a valid JWT ──────────────

// Feature: blog-platform, Property 7: Middleware rejects requests without a valid JWT on protected routes
describe('Property 7: Middleware rejects requests without a valid JWT on protected routes', () => {
  /**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
   *
   * For any arbitrary string that is not a valid JWT signed with the correct
   * secret, verifyJWT must return null (which the middleware maps to 401).
   */
  test('property: arbitrary strings that are not valid JWTs always return null from verifyJWT', () => {
    fc.assert(
      fc.property(fc.string(), (token) => {
        // Only test strings that are not valid JWTs signed with our secret.
        // A valid JWT has exactly 3 dot-separated segments and verifies correctly.
        const result = verifyJWT(token);

        // If verifyJWT returns non-null, the token must be a legitimately valid JWT.
        if (result !== null) {
          // Verify it is actually a valid JWT (this should not happen for random strings).
          const verified = jwt.verify(token, TEST_SECRET) as JWTPayload;
          expect(verified).toBeDefined();
        } else {
          // null means the token was invalid — this is the expected path for random strings.
          expect(result).toBeNull();
        }
      }),
      { numRuns: 200 },
    );
  });

  /**
   * Property: for any string that is not a structurally valid JWT
   * (i.e. does not have exactly 3 dot-separated non-empty segments),
   * verifyJWT always returns null.
   */
  test('property: non-JWT-shaped strings always return null from verifyJWT', () => {
    // Generate strings that definitely cannot be valid JWTs (no three-part dot structure).
    const nonJwtArb = fc.string().filter(
      (s) => s.split('.').filter((p) => p.length > 0).length !== 3,
    );

    fc.assert(
      fc.property(nonJwtArb, (token) => {
        expect(verifyJWT(token)).toBeNull();
      }),
      { numRuns: 200 },
    );
  });

  /**
   * Property: for any protected route, a missing token always produces 401.
   */
  test('property: missing token always produces 401 on any protected route', () => {
    const protectedRoutes = fc.record({
      method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
      pathname: fc.constantFrom(
        '/api/posts',
        '/api/posts/some-id',
        '/api/comments',
        '/api/upload',
        '/dashboard',
      ),
    });

    fc.assert(
      fc.property(protectedRoutes, ({ method, pathname }) => {
        const status = simulateMiddleware(undefined, method, pathname);
        expect(status).toBe(401);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: for any author-only route, a valid reader token always produces 403.
   */
  test('property: reader token always produces 403 on author-only routes', () => {
    const readerToken = signJWT({ sub: 'reader-id', role: 'reader' });

    const authorOnlyRoutes = fc.oneof(
      fc.constant({ method: 'POST', pathname: '/api/posts' }),
      fc.record({
        method: fc.constantFrom('PUT', 'DELETE'),
        pathname: fc.stringMatching(/^\/api\/posts\/[a-z0-9]{4,12}$/).filter(
          (p) => p !== '/api/posts',
        ),
      }),
      fc.record({
        method: fc.constant('POST'),
        pathname: fc.constantFrom('/api/upload', '/api/upload/image'),
      }),
    );

    fc.assert(
      fc.property(authorOnlyRoutes, ({ method, pathname }) => {
        const status = simulateMiddleware(readerToken, method, pathname);
        expect(status).toBe(403);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: for any author-only route, a valid author token always produces 200.
   */
  test('property: author token always produces 200 on author-only routes', () => {
    const authorToken = signJWT({ sub: 'author-id', role: 'author' });

    const authorOnlyRoutes = fc.oneof(
      fc.constant({ method: 'POST', pathname: '/api/posts' }),
      fc.record({
        method: fc.constantFrom('PUT', 'DELETE'),
        pathname: fc.stringMatching(/^\/api\/posts\/[a-z0-9]{4,12}$/).filter(
          (p) => p !== '/api/posts',
        ),
      }),
      fc.record({
        method: fc.constant('POST'),
        pathname: fc.constantFrom('/api/upload', '/api/upload/image'),
      }),
    );

    fc.assert(
      fc.property(authorOnlyRoutes, ({ method, pathname }) => {
        const status = simulateMiddleware(authorToken, method, pathname);
        expect(status).toBe(200);
      }),
      { numRuns: 100 },
    );
  });
});
