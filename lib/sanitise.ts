import sanitizeHtml from 'sanitize-html';

/**
 * Sanitises HTML content to prevent stored XSS attacks.
 * Only allows a safe subset of formatting tags and attributes.
 *
 * Requirement: 17.3
 */
export function sanitiseHTML(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u',
      'h1', 'h2', 'h3',
      'ul', 'ol', 'li',
      'blockquote', 'a', 'code', 'pre',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
  });
}
