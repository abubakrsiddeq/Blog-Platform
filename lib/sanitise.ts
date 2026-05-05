import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitises HTML content to prevent stored XSS attacks.
 * Only allows a safe subset of formatting tags and attributes.
 *
 * Requirement: 17.3
 */
export function sanitiseHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u',
      'h1', 'h2', 'h3',
      'ul', 'ol', 'li',
      'blockquote', 'a', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
