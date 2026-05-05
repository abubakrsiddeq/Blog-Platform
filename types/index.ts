/**
 * Shared TypeScript interfaces for the Blog Platform.
 */

/**
 * Public user profile — never includes passwordHash.
 * Returned by auth endpoints and populated author fields.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'author' | 'reader';
  createdAt: string;
}

/**
 * JWT payload stored inside the signed token.
 * `sub` is the User._id as a string.
 */
export interface JWTPayload {
  sub: string;
  role: 'author' | 'reader';
  iat: number;
  exp: number;
}

/**
 * Generic paginated API response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
