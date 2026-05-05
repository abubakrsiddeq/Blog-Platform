import { v2 as cloudinary } from 'cloudinary';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── uploadImage ──────────────────────────────────────────────────────────────

/**
 * Validates and uploads an image file.
 * Uploads to Cloudinary when CLOUDINARY_URL is set; otherwise writes to the
 * local /public/uploads directory and returns a relative URL.
 *
 * Throws { code: 'INVALID_TYPE', message: string } for unsupported MIME types.
 * Throws { code: 'FILE_TOO_LARGE', message: string } for files exceeding 5 MB.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
export async function uploadImage(file: File): Promise<string> {
  // Validate MIME type before any I/O
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw {
      code: 'INVALID_TYPE',
      message: 'Unsupported file type. Use JPEG, PNG, or WebP.',
    };
  }

  // Validate file size before any I/O
  if (file.size > MAX_FILE_SIZE) {
    throw {
      code: 'FILE_TOO_LARGE',
      message: 'File exceeds 5 MB limit.',
    };
  }

  if (process.env.CLOUDINARY_URL) {
    return uploadToCloudinary(file);
  }

  return uploadToLocal(file);
}

// ─── Cloudinary upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  // cloudinary.config() reads CLOUDINARY_URL automatically
  cloudinary.config();

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'blog-platform', resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload returned no result'));
        } else {
          resolve(result.secure_url);
        }
      },
    );
    stream.end(buffer);
  });
}

// ─── Local filesystem upload ──────────────────────────────────────────────────

async function uploadToLocal(file: File): Promise<string> {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const ext = mimeToExt[file.type];
  const filename = `${randomUUID()}.${ext}`;
  const dest = join(process.cwd(), 'public', 'uploads', filename);

  await writeFile(dest, Buffer.from(await file.arrayBuffer()));

  return `/uploads/${filename}`;
}
