import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 *
 * Clears the JWT cookie, effectively logging the user out.
 */
export async function POST(): Promise<Response> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');

    return Response.json({ message: 'Logged out' }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/logout]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
