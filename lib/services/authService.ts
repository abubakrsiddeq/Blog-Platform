import type { PublicUser } from '@/types/index';
import { User } from '@/models/User';
import { hashPassword, comparePassword, signJWT } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { registerSchema, loginSchema, updateProfileSchema } from '@/lib/validation/authSchemas';
import type { RegisterInput, LoginInput, UpdateProfileInput } from '@/lib/validation/authSchemas';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPublicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: 'author' | 'reader';
  createdAt: Date;
}): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

// ─── registerUser ─────────────────────────────────────────────────────────────

/**
 * Registers a new user.
 * Throws { code: 'VALIDATION_ERROR', issues } on invalid input.
 * Throws { code: 'DUPLICATE_EMAIL' } when the email is already taken.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export async function registerUser(data: RegisterInput): Promise<PublicUser> {
  await connectDB();

  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    throw { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    throw { code: 'DUPLICATE_EMAIL' };
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });

  return toPublicUser(user);
}

// ─── loginUser ────────────────────────────────────────────────────────────────

/**
 * Authenticates a user and returns a signed JWT alongside the public profile.
 * Throws { code: 'VALIDATION_ERROR', issues } on invalid input.
 * Throws { code: 'INVALID_CREDENTIALS' } when email is not found or password
 * does not match — intentionally generic to avoid user enumeration.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function loginUser(
  data: LoginInput,
): Promise<{ user: PublicUser; token: string }> {
  await connectDB();

  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    throw { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) {
    throw { code: 'INVALID_CREDENTIALS' };
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw { code: 'INVALID_CREDENTIALS' };
  }

  const token = signJWT({ sub: String(user._id), role: user.role });

  return { user: toPublicUser(user), token };
}

// ─── getCurrentUser ───────────────────────────────────────────────────────────

/**
 * Returns the public profile for a given user ID, or null if not found.
 * The passwordHash field is never included in the returned object.
 *
 * Requirements: 3.1, 3.2
 */
export async function getCurrentUser(userId: string): Promise<PublicUser | null> {
  await connectDB();

  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    return null;
  }

  return toPublicUser(user);
}

// ─── updateProfile ────────────────────────────────────────────────────────────

/**
 * Updates the authenticated user's name and/or password.
 * Throws { code: 'VALIDATION_ERROR', issues } on invalid input.
 * Throws { code: 'WRONG_PASSWORD' } when currentPassword does not match.
 * Throws { code: 'USER_NOT_FOUND' } when the user no longer exists.
 */
export async function updateProfile(
  userId: string,
  data: UpdateProfileInput,
): Promise<PublicUser> {
  await connectDB();

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    throw { code: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors };
  }

  const { name, currentPassword, newPassword } = parsed.data;

  const user = await User.findById(userId);
  if (!user) {
    throw { code: 'USER_NOT_FOUND' };
  }

  if (newPassword) {
    const matches = await comparePassword(currentPassword!, user.passwordHash);
    if (!matches) {
      throw { code: 'WRONG_PASSWORD' };
    }
    user.passwordHash = await hashPassword(newPassword);
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  return toPublicUser(user);
}
