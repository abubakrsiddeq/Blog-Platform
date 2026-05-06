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

  // If the previous promise failed or the connection dropped, reset so we
  // create a fresh connection rather than awaiting a dead promise.
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      if (mongoose.connection.readyState === 1) {
        return cached.conn;
      }
    } catch {
      // Previous connection attempt failed — fall through to retry.
    }
    cached.conn = null;
    cached.promise = null;
  }

  // Create a new connection promise and cache it so concurrent callers
  // share the same in-flight promise.
  cached.promise = mongoose.connect(MONGO_URI, {
    // bufferCommands: true (default) lets Mongoose queue operations while
    // connecting, which is safer on serverless cold starts.
    bufferCommands: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  cached.conn = await cached.promise;
  return cached.conn;
}
