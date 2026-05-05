import { cookies } from 'next/headers';
import { loginSchema } from '@/lib/validation/authSchemas';
import { loginUser } from '@/lib/services/authService';

/**
 * POST /api/auth/login
 *
 * Authenticates a user and sets an HTTP-only JWT cookie on success.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input — return 400 with field-level errors on failure.
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Validation failed',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { user, token } = await loginUser(parsed.data);

    // Set the JWT in an HTTP-only cookie so client-side JS cannot access it
    // (Requirement 2.4).
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return Response.json(user, { status: 200 });
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'INVALID_CREDENTIALS'
    ) {
      // Generic message — does not distinguish between unknown email and wrong
      // password (Requirement 2.2).
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.error('[POST /api/auth/login]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
