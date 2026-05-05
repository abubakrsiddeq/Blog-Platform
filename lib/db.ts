import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const cached = global.__mongoose ?? (global.__mongoose = { conn: null, promise: null });

/**
 * Returns a cached Mongoose connection, creating one on the first call.
 * Subsequent calls within the same Node.js process return the same connection
 * object without calling mongoose.connect() again (Requirement 16.2).
 */
export async function connectDB(): Promise<typeof mongoose> {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  // Return the cached connection if it already exists (Requirement 16.3)
  if (cached.conn) {
    return cached.conn;
  }

  // Create the connection promise once and cache it so concurrent callers
  // share the same in-flight promise (Requirement 16.1)
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
