// Feature: blog-platform — Integration tests for authService
// Tests run against an in-memory MongoDB instance (mongodb-memory-server).
// Service functions are called directly; no HTTP layer is involved.

import * as fc from 'fast-check';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../../../models/User';

// ─── Globals ─────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let mongod: MongoMemoryServer;

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Set env vars before connectDB is called for the first time.
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret-for-authservice-tests';

  // Establish the connection once for the entire suite.
  await mongoose.connect(uri, { bufferCommands: false });

  // Prime the connectDB cache so service calls reuse this connection.
  if (!global.__mongoose) {
    global.__mongoose = { conn: null, promise: null };
  }
  global.__mongoose.conn = mongoose;
  global.__mongoose.promise = Promise.resolve(mongoose);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  // Clear the User collection between tests to ensure isolation.
  await User.deleteMany({});
});

// ─── Service imports ──────────────────────────────────────────────────────────

import { registerUser, loginUser, getCurrentUser } from '../../../lib/services/authService';
import { verifyJWT } from '../../../lib/auth';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Arbitrary that produces a simple, Zod-safe email address.
 * fc.emailAddress() can generate RFC-valid addresses that Zod rejects (e.g. "!@a.aa"),
 * so we build emails from safe alphanumeric parts instead.
 */
const safeEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{2,8}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{2,8}$/),
    fc.constantFrom('com', 'net', 'org', 'io'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** A fixed valid registration payload used across multiple tests. */
const BASE_PAYLOAD = {
  name: 'Alice',
  email: 'alice@example.com',
  password: 'securepassword123',
  role: 'author' as const,
};

// ─── Property 1: Valid registration always produces a public profile ──────────

// Feature: blog-platform, Property 1: Valid registration always produces a public profile
describe('Property 1: Valid registration always produces a public profile', () => {
  /**
   * **Validates: Requirements 1.1, 1.4**
   *
   * Calling registerUser with a valid payload must return a public profile
   * containing name, email, and role. The passwordHash field must never appear
   * in the returned object.
   */
  test('unit: registerUser returns name/email/role and omits passwordHash', async () => {
    const result = await registerUser(BASE_PAYLOAD);

    expect(result.name).toBe(BASE_PAYLOAD.name);
    expect(result.email).toBe(BASE_PAYLOAD.email);
    expect(result.role).toBe(BASE_PAYLOAD.role);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    // passwordHash must never be exposed
    expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  test('unit: registerUser returns a string id', async () => {
    const result = await registerUser(BASE_PAYLOAD);

    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  /**
   * Property-based: for any valid registration payload, the returned profile
   * always contains name/email/role and never exposes passwordHash.
   *
   * **Validates: Requirements 1.1, 1.4**
   */
  test('property: valid registration always produces a public profile without passwordHash', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{1,18}[a-zA-Z0-9]$/),
          email: safeEmail,
          password: fc.string({ minLength: 8, maxLength: 32 }),
          role: fc.constantFrom('author', 'reader') as fc.Arbitrary<'author' | 'reader'>,
        }),
        async (payload) => {
          // Clean up between runs so emails don't collide.
          await User.deleteMany({});

          const result = await registerUser(payload);

          expect(result.name).toBe(payload.name);
          expect(result.email).toBe(payload.email.toLowerCase());
          expect(result.role).toBe(payload.role);
          expect(typeof result.id).toBe('string');
          expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
        },
      ),
      { numRuns: 20 },
    );
  }, 60_000);
});

// ─── Property 2: Duplicate email registration is always rejected ──────────────

// Feature: blog-platform, Property 2: Duplicate email registration is always rejected
describe('Property 2: Duplicate email registration is always rejected', () => {
  /**
   * **Validates: Requirements 1.2**
   *
   * Registering the same email address twice must throw an error with
   * code 'DUPLICATE_EMAIL', equivalent to a 409 response.
   */
  test('unit: second registration with same email throws DUPLICATE_EMAIL', async () => {
    await registerUser(BASE_PAYLOAD);

    await expect(
      registerUser({ ...BASE_PAYLOAD, name: 'Alice Clone' }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_EMAIL' });
  });

  test('unit: first registration succeeds, second is rejected', async () => {
    const first = await registerUser(BASE_PAYLOAD);
    expect(first.email).toBe(BASE_PAYLOAD.email);

    let threw = false;
    try {
      await registerUser({ ...BASE_PAYLOAD, name: 'Duplicate Alice' });
    } catch (err) {
      threw = true;
      expect((err as { code: string }).code).toBe('DUPLICATE_EMAIL');
    }
    expect(threw).toBe(true);
  });

  /**
   * Property-based: for any valid email, registering it twice always throws
   * DUPLICATE_EMAIL on the second attempt.
   *
   * **Validates: Requirements 1.2**
   */
  test('property: duplicate email registration is always rejected', async () => {
    await fc.assert(
      fc.asyncProperty(safeEmail, async (email) => {
        await User.deleteMany({});

        const payload = {
          name: 'Test User',
          email,
          password: 'password123',
          role: 'reader' as const,
        };

        await registerUser(payload);

        await expect(
          registerUser({ ...payload, name: 'Another User' }),
        ).rejects.toMatchObject({ code: 'DUPLICATE_EMAIL' });
      }),
      { numRuns: 20 },
    );
  }, 60_000);
});

// ─── Property 4: Successful login always sets an HTTP-only cookie ─────────────

// Feature: blog-platform, Property 4: Successful login always sets an HTTP-only cookie
describe('Property 4: Successful login always sets an HTTP-only cookie', () => {
  /**
   * **Validates: Requirements 2.1, 2.4**
   *
   * The route handler sets the HTTP-only cookie; the service itself returns
   * the JWT token. We verify that loginUser returns a valid JWT string so the
   * route handler can set it as an HTTP-only cookie.
   */
  test('unit: loginUser returns a JWT token string for valid credentials', async () => {
    await registerUser(BASE_PAYLOAD);
    const result = await loginUser({
      email: BASE_PAYLOAD.email,
      password: BASE_PAYLOAD.password,
    });

    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });

  test('unit: returned token is a valid JWT (three dot-separated base64url segments)', async () => {
    await registerUser(BASE_PAYLOAD);
    const { token } = await loginUser({
      email: BASE_PAYLOAD.email,
      password: BASE_PAYLOAD.password,
    });

    // A JWT has exactly three segments separated by dots.
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
    // Each segment is non-empty base64url.
    parts.forEach((part) => expect(part.length).toBeGreaterThan(0));
  });

  test('unit: loginUser also returns the public user profile', async () => {
    await registerUser(BASE_PAYLOAD);
    const { user } = await loginUser({
      email: BASE_PAYLOAD.email,
      password: BASE_PAYLOAD.password,
    });

    expect(user.email).toBe(BASE_PAYLOAD.email);
    expect(user.name).toBe(BASE_PAYLOAD.name);
    expect(user.role).toBe(BASE_PAYLOAD.role);
    expect((user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  test('unit: returned JWT can be verified with verifyJWT', async () => {
    await registerUser(BASE_PAYLOAD);
    const { token, user } = await loginUser({
      email: BASE_PAYLOAD.email,
      password: BASE_PAYLOAD.password,
    });

    const payload = verifyJWT(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(user.id);
    expect(payload!.role).toBe(user.role);
  });
});

// ─── Property 5: Invalid login credentials always return 401 ─────────────────

// Feature: blog-platform, Property 5: Invalid login credentials always return 401 with a generic message
describe('Property 5: Invalid login credentials always return 401 with a generic message', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * Attempting to log in with credentials that don't match any registered user
   * must throw { code: 'INVALID_CREDENTIALS' } — the service-layer equivalent
   * of a 401 response with a generic message.
   */
  test('unit: loginUser throws INVALID_CREDENTIALS for unknown email', async () => {
    await expect(
      loginUser({ email: 'nobody@example.com', password: 'anypassword' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  test('unit: loginUser throws INVALID_CREDENTIALS for wrong password', async () => {
    await registerUser(BASE_PAYLOAD);

    await expect(
      loginUser({ email: BASE_PAYLOAD.email, password: 'wrongpassword' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  test('unit: error code is the same for unknown email and wrong password (no enumeration)', async () => {
    await registerUser(BASE_PAYLOAD);

    let unknownEmailError: unknown;
    let wrongPasswordError: unknown;

    try {
      await loginUser({ email: 'ghost@example.com', password: 'anypassword' });
    } catch (err) {
      unknownEmailError = err;
    }

    try {
      await loginUser({ email: BASE_PAYLOAD.email, password: 'wrongpassword' });
    } catch (err) {
      wrongPasswordError = err;
    }

    expect((unknownEmailError as { code: string }).code).toBe('INVALID_CREDENTIALS');
    expect((wrongPasswordError as { code: string }).code).toBe('INVALID_CREDENTIALS');
  });

  /**
   * Property-based: for any generated email/password pair that was never
   * registered, loginUser always throws INVALID_CREDENTIALS.
   *
   * **Validates: Requirements 2.2**
   */
  test('property: unregistered credentials always throw INVALID_CREDENTIALS', async () => {
    // Ensure no users exist so generated emails are guaranteed unregistered.
    await User.deleteMany({});

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: safeEmail,
          password: fc.string({ minLength: 1 }),
        }),
        async ({ email, password }) => {
          await expect(loginUser({ email, password })).rejects.toMatchObject({
            code: 'INVALID_CREDENTIALS',
          });
        },
      ),
      { numRuns: 20 },
    );
  }, 30_000);
});

// ─── Property 6: Identity retrieval round-trip preserves user data ────────────

// Feature: blog-platform, Property 6: Identity retrieval round-trip preserves user data
describe('Property 6: Identity retrieval round-trip preserves user data', () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * After registering and logging in, calling getCurrentUser with the user's ID
   * must return a profile whose id/name/email/role match the registration response.
   */
  test('unit: getCurrentUser returns the same profile as registerUser', async () => {
    const registered = await registerUser(BASE_PAYLOAD);
    const { user: loggedIn } = await loginUser({
      email: BASE_PAYLOAD.email,
      password: BASE_PAYLOAD.password,
    });

    const retrieved = await getCurrentUser(loggedIn.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(registered.id);
    expect(retrieved!.name).toBe(registered.name);
    expect(retrieved!.email).toBe(registered.email);
    expect(retrieved!.role).toBe(registered.role);
  });

  test('unit: getCurrentUser never exposes passwordHash', async () => {
    await registerUser(BASE_PAYLOAD);
    const { user } = await loginUser({
      email: BASE_PAYLOAD.email,
      password: BASE_PAYLOAD.password,
    });

    const retrieved = await getCurrentUser(user.id);

    expect((retrieved as unknown as Record<string, unknown> | null)?.passwordHash).toBeUndefined();
  });

  test('unit: getCurrentUser returns null for a non-existent user ID', async () => {
    // A valid-format but non-existent ObjectId.
    const result = await getCurrentUser('000000000000000000000001');

    expect(result).toBeNull();
  });

  /**
   * Property-based: for any valid registration payload, the round-trip
   * register → login → getCurrentUser always preserves id/name/email/role.
   *
   * **Validates: Requirements 3.1**
   */
  test('property: identity retrieval round-trip always preserves user data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{1,18}[a-zA-Z0-9]$/),
          email: safeEmail,
          password: fc.string({ minLength: 8, maxLength: 32 }),
          role: fc.constantFrom('author', 'reader') as fc.Arbitrary<'author' | 'reader'>,
        }),
        async (payload) => {
          await User.deleteMany({});

          const registered = await registerUser(payload);
          const { user: loggedIn } = await loginUser({
            email: payload.email,
            password: payload.password,
          });
          const retrieved = await getCurrentUser(loggedIn.id);

          expect(retrieved).not.toBeNull();
          expect(retrieved!.id).toBe(registered.id);
          expect(retrieved!.name).toBe(registered.name);
          expect(retrieved!.email).toBe(registered.email);
          expect(retrieved!.role).toBe(registered.role);
          expect((retrieved as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
        },
      ),
      { numRuns: 20 },
    );
  }, 60_000);
});
