// Feature: blog-platform, Property 9: Invalid post payloads are always rejected with 400

import * as fc from 'fast-check';
import { createPostSchema } from '../../../lib/validation/postSchemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Arbitrary that produces a non-empty string (valid title or content) */
const nonEmptyString = fc.string({ minLength: 1 });

/** Arbitrary that produces a valid status value */
const validStatus = fc.constantFrom('draft', 'published') as fc.Arbitrary<'draft' | 'published'>;

/** Arbitrary that produces a valid create-post payload */
const validPostPayload = fc.record({
  title: nonEmptyString,
  content: nonEmptyString,
  status: fc.option(validStatus, { nil: undefined }).map((s) => s ?? undefined),
});

// ---------------------------------------------------------------------------
// Property 9: Invalid post payloads are always rejected with 400
// **Validates: Requirements 5.2, 5.5**
// ---------------------------------------------------------------------------
describe('createPostSchema – invalid payloads are always rejected (Property 9)', () => {
  // -------------------------------------------------------------------------
  // Unit tests for specific invalid cases
  // -------------------------------------------------------------------------

  test('rejects payload with missing title', () => {
    const result = createPostSchema.safeParse({
      content: 'Some content',
      status: 'draft',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('title');
    }
  });

  test('rejects payload with empty title', () => {
    const result = createPostSchema.safeParse({
      title: '',
      content: 'Some content',
      status: 'draft',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('title');
    }
  });

  test('rejects payload with missing content', () => {
    const result = createPostSchema.safeParse({
      title: 'My Post',
      status: 'draft',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('content');
    }
  });

  test('rejects payload with empty content', () => {
    const result = createPostSchema.safeParse({
      title: 'My Post',
      content: '',
      status: 'draft',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('content');
    }
  });

  test('rejects payload with invalid status value', () => {
    const result = createPostSchema.safeParse({
      title: 'My Post',
      content: 'Some content',
      status: 'archived',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('status');
    }
  });

  test('accepts a fully valid payload with status "draft"', () => {
    const result = createPostSchema.safeParse({
      title: 'My Post',
      content: 'Some content',
      status: 'draft',
    });
    expect(result.success).toBe(true);
  });

  test('accepts a fully valid payload with status "published"', () => {
    const result = createPostSchema.safeParse({
      title: 'My Post',
      content: 'Some content',
      status: 'published',
    });
    expect(result.success).toBe(true);
  });

  test('accepts a valid payload without status (defaults to "draft")', () => {
    const result = createPostSchema.safeParse({
      title: 'My Post',
      content: 'Some content',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
    }
  });

  // -------------------------------------------------------------------------
  // Property-based tests
  // -------------------------------------------------------------------------

  /**
   * Property 9: Payloads missing title are always rejected.
   * **Validates: Requirements 5.2, 5.5**
   */
  test('property: payload missing title is always rejected', () => {
    // Feature: blog-platform, Property 9: Invalid post payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          content: nonEmptyString,
          status: validStatus,
        }),
        (payload) => {
          const result = createPostSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('title');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9: Payloads missing content are always rejected.
   * **Validates: Requirements 5.2, 5.5**
   */
  test('property: payload missing content is always rejected', () => {
    // Feature: blog-platform, Property 9: Invalid post payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          title: nonEmptyString,
          status: validStatus,
        }),
        (payload) => {
          const result = createPostSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('content');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9: Payloads with invalid status values are always rejected.
   * **Validates: Requirements 5.2, 5.5**
   */
  test('property: payload with invalid status is always rejected', () => {
    // Feature: blog-platform, Property 9: Invalid post payloads are always rejected with 400
    fc.assert(
      fc.property(
        fc.record({
          title: nonEmptyString,
          content: nonEmptyString,
          // Generate strings that are not valid status values
          status: fc.string().filter((s) => s !== 'draft' && s !== 'published'),
        }),
        (payload) => {
          const result = createPostSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const fields = result.error.issues.map((i) => i.path[0]);
            expect(fields).toContain('status');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 9: Valid post payloads always pass.
   * **Validates: Requirements 5.2, 5.5**
   */
  test('property: valid post payloads always pass', () => {
    // Feature: blog-platform, Property 9: Invalid post payloads are always rejected with 400
    fc.assert(
      fc.property(validPostPayload, (payload) => {
        const result = createPostSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
