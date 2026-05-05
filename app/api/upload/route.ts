import type { NextRequest } from 'next/server';
import { uploadImage } from '@/lib/services/uploadService';

// ─── POST /api/upload ─────────────────────────────────────────────────────────

/**
 * Handles image file uploads. Only users with the `author` role may upload.
 * Accepts multipart/form-data with an `image` field.
 * Delegates to the Upload_Service which routes to Cloudinary or local storage.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const userRole = request.headers.get('x-user-role');

    if (userRole !== 'author') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return Response.json({ error: 'No image file provided' }, { status: 400 });
    }

    const url = await uploadImage(file);

    return Response.json({ url }, { status: 200 });
  } catch (err: unknown) {
    if (err !== null && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string; message?: string }).code;
      const message = (err as { code: string; message?: string }).message;

      if (code === 'INVALID_TYPE') {
        return Response.json({ error: message }, { status: 400 });
      }
      if (code === 'FILE_TOO_LARGE') {
        return Response.json({ error: message }, { status: 400 });
      }
    }

    console.error('[POST /api/upload]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
