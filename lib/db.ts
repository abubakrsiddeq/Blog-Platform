import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const cached = global.__mongoose ?? (global.__mongoose = { conn: null, promise: null });

/**
 * Returns a cached Mongoose connection, creating one on the first call.
 * Subsequent calls within the same Node.js process return the same connection
 * object without calling mongoose.connect() again.
 *
 * On Vercel serverless, each cold start gets a fresh process so we always
 * create a new connection on the first invocation of that instance.
 *
 * The promise is set BEFORE awaiting so concurrent cold-start callers all
 * share the same in-flight connect() rather than each spawning their own.
 */
export async function connectDB(): Promise<typeof mongoose> {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  // Return the cached connection if it is already established and open.
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If there is already an in-flight promise, wait for it.
  // This prevents multiple concurrent cold-start requests from each calling
  // mongoose.connect() simultaneously.
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      if (mongoose.connection.readyState === 1) {
        return cached.conn;
      }
    } catch {
      // Previous connection attempt failed — reset and retry below.
    }
    cached.conn = null;
    cached.promise = null;
  }

  // Set the promise FIRST (before awaiting) so any concurrent requests that
  // arrive while we are connecting will reuse this same promise.
  cached.promise = mongoose.connect(MONGO_URI, {
    bufferCommands: true,   // queue ops while connecting — safe on serverless
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,  // 30 s — enough for Vercel cold starts
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
  });

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so the next request tries a fresh connect instead of awaiting
    // a permanently-rejected promise.
    cached.promise = null;
    cached.conn = null;
    throw err;
  }

  return cached.conn;
}
