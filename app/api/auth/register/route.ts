import { registerSchema } from '@/lib/validation/authSchemas';
import { registerUser } from '@/lib/services/authService';

/**
 * POST /api/auth/register
 *
 * Registers a new user account.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    // Validate input before calling the service so we can return structured
    // field-level errors as required by Requirement 1.3 / 1.5.
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Validation failed',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const user = await registerUser(parsed.data);

    return Response.json(user, { status: 201 });
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'DUPLICATE_EMAIL'
    ) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }

    console.error('[POST /api/auth/register]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
