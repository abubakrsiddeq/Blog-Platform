// Feature: blog-platform, Property 21: Database connection is cached across multiple calls

import * as fc from 'fast-check';

// We need to control the module-level cache, so we manipulate global.__mongoose directly.
// This avoids the overhead of jest.resetModules() (which would require re-importing inside
// each test) while still exercising the real connectDB() logic.

// Declare the global type used by lib/db.ts
declare global {
  // eslint-disable-next-line no-var
  var __mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null } | undefined;
}

// Mock mongoose.connect before importing connectDB so the module picks up the mock.
jest.mock('mongoose', () => {
  const actual = jest.requireActual<typeof import('mongoose')>('mongoose');
  return {
    ...actual,
    connect: jest.fn(),
  };
});

import mongoose from 'mongoose';
import { connectDB } from '../../lib/db';

const mockedConnect = mongoose.connect as jest.MockedFunction<typeof mongoose.connect>;

/** Reset the module-level cache between tests by clearing global.__mongoose. */
function resetCache(): void {
  // Setting to undefined forces lib/db.ts to re-initialise `cached` on next import.
  // Because the module is already loaded we instead directly mutate the global object
  // that the module holds a reference to.
  if (global.__mongoose) {
    global.__mongoose.conn = null;
    global.__mongoose.promise = null;
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  resetCache();
  process.env.MONGO_URI = 'mongodb://localhost:27017/test';

  // Make mongoose.connect resolve with the mongoose object itself (as the real impl does).
  mockedConnect.mockResolvedValue(mongoose as unknown as typeof mongoose);
});

afterEach(() => {
  resetCache();
});

// ---------------------------------------------------------------------------
// Property 21: Database connection is cached across multiple calls
// ---------------------------------------------------------------------------
describe('connectDB – connection caching (Property 21)', () => {
  /**
   * Unit test: calling connectDB() N times should invoke mongoose.connect exactly once.
   * We test for N = 2, 3, and 5 to cover the most common scenarios.
   */
  test.each([2, 3, 5])(
    'mongoose.connect is called exactly once when connectDB() is invoked %i times sequentially',
    async (callCount) => {
      for (let i = 0; i < callCount; i++) {
        await connectDB();
      }
      expect(mockedConnect).toHaveBeenCalledTimes(1);
    },
  );

  test('all calls return the same connection object (reference equality)', async () => {
    const first = await connectDB();
    const second = await connectDB();
    const third = await connectDB();

    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  test('concurrent calls share the same in-flight promise and call connect exactly once', async () => {
    const results = await Promise.all([connectDB(), connectDB(), connectDB()]);

    expect(mockedConnect).toHaveBeenCalledTimes(1);
    // All concurrent calls must resolve to the same object.
    expect(results[1]).toBe(results[0]);
    expect(results[2]).toBe(results[0]);
  });

  /**
   * Property-based test: for any number of sequential calls between 2 and 20,
   * mongoose.connect must still be called exactly once.
   *
   * **Validates: Requirements 16.2**
   */
  test('property: mongoose.connect is called exactly once for any number of sequential calls', async () => {
    // Feature: blog-platform, Property 21: Database connection is cached across multiple calls
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 20 }),
        async (callCount) => {
          // Reset cache before each generated scenario.
          resetCache();
          jest.clearAllMocks();

          for (let i = 0; i < callCount; i++) {
            await connectDB();
          }

          expect(mockedConnect).toHaveBeenCalledTimes(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('throws when MONGO_URI is not set', async () => {
    delete process.env.MONGO_URI;
    await expect(connectDB()).rejects.toThrow('MONGO_URI environment variable is not defined');
  });
});
