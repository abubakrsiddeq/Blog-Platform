// Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400

import * as fc from 'fast-check';
import { registerSchema, loginSchema } from '../../../lib/validation/authSchemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Arbitrary that produces a valid role value */
const validRole = fc.constantFrom('author', 'reader') as fc.Arbitrary<'author' | 'reader'>;

/**
 * Arbitrary that produces a simple valid email address.
 * fc.emailAddress() can generate RFC-valid but Zod-rejected addresses (e.g. "!@a.aa"),
 * so we build emails from safe alphanumeric parts instead.
 */
const safeEmail = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.constantFrom('com', 'net', 'org', 'io'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Arbitrary that produces a valid registration payload */
const validRegisterPayload = fc.record({
  name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/),
  email: safeEmail,
  password: fc.string({ minLength: 8 }),
  role: validRole,
});

// ---------------------------------------------------------------------------
// Property 3: Invalid registration payloads are always rejected with 400
// ---------------------------------------------------------------------------
describe('registerSchema – invalid payloads are always rejected (Property 3)', () => {
  // -------------------------------------------------------------------------
  // Unit tests for specific invalid cases
  // -------------------------------------------------------------------------

  test('rejects payload with missing name', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      role: 'author',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('name');
    }
  });

  test('rejects payload with missing email', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      password: 'password123',
      role: 'author',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('email');
    }
  });

  test('rejects payload with missing password', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'user@example.com',
      role: 'author',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('password');
    }
  });

  test('rejects payload with missing role', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('role');
    }
  });

  test('rejects malformed email', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'not-an-email',
      password: 'password123',
      role: 'author',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('email');
    }
  });

  test('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'user@example.com',
      password: 'short',
      role: 'author',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('password');
    }
  });

  test('rejects invalid role value', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'user@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('role');
    }
  });

  test('accepts a fully valid registration payload', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'securepassword',
      role: 'author',
    });
    expect(result.success).toBe(true);
  });

  test('accepts role "reader"', () => {
    const result = registerSchema.safeParse({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'securepassword',
      role: 'reader',
    });
    expect(result.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Property-based tests
  // -------------------------------------------------------------------------

  /**
   * Property 3: Payloads with a missing required field are always rejected.
   * **Validates: Requirements 1.3, 1.5**
   */
  test('property: payload missing name is always rejected', () => {
    // Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          email: safeEmail,
          password: fc.string({ minLength: 8 }),
          role: validRole,
        }),
        (payload) => {
          const result = registerSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('name');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test('property: payload missing email is always rejected', () => {
    // Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/),
          password: fc.string({ minLength: 8 }),
          role: validRole,
        }),
        (payload) => {
          const result = registerSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('email');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test('property: payload missing password is always rejected', () => {
    // Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/),
          email: safeEmail,
          role: validRole,
        }),
        (payload) => {
          const result = registerSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('password');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test('property: payload missing role is always rejected', () => {
    // Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/),
          email: safeEmail,
          password: fc.string({ minLength: 8 }),
        }),
        (payload) => {
          const result = registerSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('role');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test('property: malformed email is always rejected', () => {
    // Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400
    // Generate strings that are not valid email addresses by filtering out valid ones
    fc.assert(
      fc.property(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/),
          // Use strings that clearly cannot be valid emails (no @ symbol)
          email: fc.string({ minLength: 1 }).filter((s) => !s.includes('@')),
          password: fc.string({ minLength: 8 }),
          role: validRole,
        }),
        (payload) => {
          const result = registerSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('email');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test('property: password shorter than 8 chars is always rejected', () => {
    // Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/),
          email: safeEmail,
          // Passwords of length 0–7 are always too short
          password: fc.string({ maxLength: 7 }),
          role: validRole,
        }),
        (payload) => {
          const result = registerSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('password');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test('property: invalid role values are always rejected', () => {
    // Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          name: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/),
          email: safeEmail,
          password: fc.string({ minLength: 8 }),
          // Generate strings that are not valid roles
          role: fc.string().filter((s) => s !== 'author' && s !== 'reader'),
        }),
        (payload) => {
          const result = registerSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('role');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test('property: valid registration payloads always pass', () => {
    // Feature: blog-platform, Property 3: Invalid registration payloads are always rejected with 400
    fc.assert(
      fc.property(validRegisterPayload, (payload) => {
        const result = registerSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Login schema – unit tests
// ---------------------------------------------------------------------------
describe('loginSchema – validation', () => {
  test('accepts valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'alice@example.com',
      password: 'anypassword',
    });
    expect(result.success).toBe(true);
  });

  test('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'anypassword' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('email');
    }
  });

  test('rejects malformed email', () => {
    const result = loginSchema.safeParse({ email: 'bad-email', password: 'anypassword' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('email');
    }
  });

  test('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'alice@example.com' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('password');
    }
  });
});
