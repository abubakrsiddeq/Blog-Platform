# Requirements Document

## Introduction

A full-stack Blog Platform built with Next.js (App Router) and TypeScript. The platform supports two user roles — Authors and Readers — with JWT-based authentication, rich text post creation, image uploads, comments, likes, and search. The backend is implemented entirely within Next.js API routes, using MongoDB (via Mongoose) as the data store. The frontend provides public-facing pages and an author dashboard, styled with Tailwind CSS.

## Glossary

- **System**: The Blog Platform application as a whole
- **Auth_Service**: The component responsible for registration, login, token issuance, and identity verification
- **Post_Service**: The component responsible for creating, reading, updating, deleting, and publishing blog posts
- **Comment_Service**: The component responsible for creating and retrieving comments on posts
- **Like_Service**: The component responsible for toggling likes on posts
- **Search_Service**: The component responsible for full-text search over posts
- **Upload_Service**: The component responsible for handling image file uploads
- **Middleware**: The Next.js middleware layer that enforces authentication and authorization on protected routes
- **Author**: A registered user with the role `author`, permitted to create, edit, and delete posts
- **Reader**: A registered user with the role `reader`, permitted to view posts, add comments, and like posts
- **JWT**: JSON Web Token used to represent authenticated user sessions
- **Rich_Text_Editor**: The in-browser editor component (TipTap or React Quill) used to compose post content
- **Post**: A blog entry with a title, rich-text content, optional image, publication status, and associated metadata
- **Comment**: A text response submitted by a user in relation to a specific Post
- **Draft**: A Post with status `draft`, visible only to its Author
- **Published_Post**: A Post with status `published`, visible to all users
- **DB_Connection**: The reusable MongoDB connection utility with connection caching
- **Toast**: A transient UI notification displayed to the user after an action

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to register an account with a chosen role, so that I can access role-appropriate features of the platform.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/register` with a valid `name`, `email`, `password`, and `role` (`author` or `reader`), THE Auth_Service SHALL create a new user record with the password hashed using bcrypt and return a `201` status with the created user's public profile.
2. WHEN a registration request is received with an `email` that already exists in the database, THE Auth_Service SHALL return a `409` status with a descriptive error message.
3. WHEN a registration request is received with a missing or malformed `email`, `name`, `password`, or `role`, THE Auth_Service SHALL return a `400` status with a field-level validation error message.
4. THE Auth_Service SHALL store passwords exclusively as bcrypt hashes and SHALL NOT persist plaintext passwords.
5. WHEN a registration request is received with a `role` value other than `author` or `reader`, THE Auth_Service SHALL return a `400` status with a descriptive error message.

---

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my credentials, so that I can access authenticated features.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/login` with a valid `email` and `password`, THE Auth_Service SHALL verify the credentials, generate a signed JWT, set it in an HTTP-only cookie, and return a `200` status with the user's public profile.
2. WHEN a login request is received with an unrecognised `email` or an incorrect `password`, THE Auth_Service SHALL return a `401` status with a generic error message that does not distinguish between the two failure modes.
3. WHEN a login request is received with a missing `email` or `password`, THE Auth_Service SHALL return a `400` status with a descriptive validation error message.
4. THE Auth_Service SHALL set the JWT in an HTTP-only cookie with a defined expiry duration to prevent client-side JavaScript access.

---

### Requirement 3: Authenticated Identity Retrieval

**User Story:** As a logged-in user, I want to retrieve my current identity, so that the frontend can display role-appropriate UI.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/auth/me` with a valid JWT cookie, THE Auth_Service SHALL return a `200` status with the authenticated user's `id`, `name`, `email`, and `role`.
2. WHEN a GET request is made to `/api/auth/me` without a JWT cookie or with an expired or invalid JWT, THE Auth_Service SHALL return a `401` status with a descriptive error message.

---

### Requirement 4: Route Protection via Middleware

**User Story:** As a platform operator, I want all protected API routes to require a valid JWT, so that unauthenticated users cannot perform privileged actions.

#### Acceptance Criteria

1. WHILE a request targets a protected API route, THE Middleware SHALL verify the JWT from the HTTP-only cookie before passing the request to the route handler.
2. IF the JWT is absent, expired, or invalid on a protected route, THEN THE Middleware SHALL return a `401` status and SHALL NOT forward the request to the route handler.
3. WHILE a request targets a route restricted to the `author` role, THE Middleware SHALL verify that the authenticated user's role is `author`.
4. IF the authenticated user's role does not satisfy the route's role requirement, THEN THE Middleware SHALL return a `403` status and SHALL NOT forward the request to the route handler.

---

### Requirement 5: Post Creation

**User Story:** As an Author, I want to create blog posts with rich text content and an optional image, so that I can publish content for readers.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/posts` by an authenticated Author with a valid `title`, `content`, and optional `image` URL and `status`, THE Post_Service SHALL persist the post with the authenticated user as the `author` reference and return a `201` status with the created post.
2. WHEN a post creation request is received with a missing `title` or `content`, THE Post_Service SHALL return a `400` status with a descriptive validation error message.
3. WHEN a post creation request is received from a user with the `reader` role, THE Post_Service SHALL return a `403` status.
4. WHERE a `status` field is omitted from the creation request, THE Post_Service SHALL default the post status to `draft`.
5. WHEN a post creation request is received with a `status` value other than `draft` or `published`, THE Post_Service SHALL return a `400` status with a descriptive error message.

---

### Requirement 6: Post Retrieval and Search

**User Story:** As any user, I want to browse and search published posts with pagination, so that I can discover content efficiently.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/posts`, THE Post_Service SHALL return a paginated list of `published` posts ordered by creation date descending, including `page`, `limit`, `total`, and `totalPages` metadata.
2. WHEN a GET request is made to `/api/posts` with a `search` query parameter, THE Search_Service SHALL return only `published` posts whose `title` or `content` matches the search term using a MongoDB text index.
3. WHEN a GET request is made to `/api/posts` with `page` and `limit` query parameters, THE Post_Service SHALL return the corresponding page of results, defaulting to `page=1` and `limit=10` when the parameters are absent.
4. WHEN a GET request is made to `/api/posts/:id` for a `published` post, THE Post_Service SHALL return a `200` status with the full post document including the populated `author` name.
5. WHEN a GET request is made to `/api/posts/:id` for a post that does not exist, THE Post_Service SHALL return a `404` status with a descriptive error message.
6. WHEN a GET request is made to `/api/posts/:id` for a `draft` post by a user who is not the post's Author, THE Post_Service SHALL return a `403` status.

---

### Requirement 7: Post Update

**User Story:** As an Author, I want to edit my own posts, so that I can correct or update published content.

#### Acceptance Criteria

1. WHEN a PUT request is made to `/api/posts/:id` by the authenticated Author who owns the post, THE Post_Service SHALL update the specified fields and return a `200` status with the updated post.
2. WHEN a PUT request is made to `/api/posts/:id` by an authenticated Author who does not own the post, THE Post_Service SHALL return a `403` status.
3. WHEN a PUT request is made to `/api/posts/:id` by a user with the `reader` role, THE Post_Service SHALL return a `403` status.
4. WHEN a PUT request is made to `/api/posts/:id` for a post that does not exist, THE Post_Service SHALL return a `404` status with a descriptive error message.

---

### Requirement 8: Post Deletion

**User Story:** As an Author, I want to delete my own posts, so that I can remove content I no longer want published.

#### Acceptance Criteria

1. WHEN a DELETE request is made to `/api/posts/:id` by the authenticated Author who owns the post, THE Post_Service SHALL remove the post and return a `200` status with a confirmation message.
2. WHEN a DELETE request is made to `/api/posts/:id` by an authenticated Author who does not own the post, THE Post_Service SHALL return a `403` status.
3. WHEN a DELETE request is made to `/api/posts/:id` by a user with the `reader` role, THE Post_Service SHALL return a `403` status.
4. WHEN a DELETE request is made to `/api/posts/:id` for a post that does not exist, THE Post_Service SHALL return a `404` status with a descriptive error message.

---

### Requirement 9: Comment Creation and Retrieval

**User Story:** As a Reader or Author, I want to add and view comments on posts, so that I can engage with content.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/comments` by an authenticated user with a valid `postId` and `content`, THE Comment_Service SHALL persist the comment referencing the post and the authenticated user, and return a `201` status with the created comment.
2. WHEN a comment creation request is received with a missing `postId` or empty `content`, THE Comment_Service SHALL return a `400` status with a descriptive validation error message.
3. WHEN a comment creation request references a `postId` that does not exist, THE Comment_Service SHALL return a `404` status with a descriptive error message.
4. WHEN a GET request is made to `/api/comments/:postId`, THE Comment_Service SHALL return a `200` status with all comments for the specified post ordered by creation date ascending, with each comment including the populated `user` name.
5. WHEN a GET request is made to `/api/comments/:postId` for a post that does not exist, THE Comment_Service SHALL return a `404` status with a descriptive error message.

---

### Requirement 10: Like and Unlike Posts

**User Story:** As a Reader or Author, I want to like or unlike a post, so that I can express appreciation for content.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/posts/:id/like` by an authenticated user who has not previously liked the post, THE Like_Service SHALL add the user's ID to the post's `likes` array and return a `200` status with the updated like count.
2. WHEN a POST request is made to `/api/posts/:id/like` by an authenticated user who has already liked the post, THE Like_Service SHALL remove the user's ID from the post's `likes` array and return a `200` status with the updated like count (unlike/toggle behaviour).
3. WHEN a like request is made for a post that does not exist, THE Like_Service SHALL return a `404` status with a descriptive error message.
4. WHEN a like request is received without a valid JWT, THE Like_Service SHALL return a `401` status.

---

### Requirement 11: Image Upload

**User Story:** As an Author, I want to upload an image when creating or editing a post, so that my posts can include visual content.

#### Acceptance Criteria

1. WHEN an image file is submitted for upload, THE Upload_Service SHALL accept JPEG, PNG, and WebP formats and return a URL referencing the stored image.
2. WHERE the `CLOUDINARY_URL` environment variable is configured, THE Upload_Service SHALL upload images to Cloudinary and return the Cloudinary-hosted URL.
3. WHERE the `CLOUDINARY_URL` environment variable is not configured, THE Upload_Service SHALL store images in the local filesystem under `/public/uploads` and return a relative URL path.
4. IF an uploaded file exceeds 5 MB, THEN THE Upload_Service SHALL return a `400` status with a descriptive error message.
5. IF an uploaded file is not a JPEG, PNG, or WebP, THEN THE Upload_Service SHALL return a `400` status with a descriptive error message.

---

### Requirement 12: Author Dashboard — My Posts

**User Story:** As an Author, I want to view and manage all my own posts in a dashboard, so that I can track and control my content.

#### Acceptance Criteria

1. WHILE an Author is authenticated and viewing the My Posts dashboard page, THE System SHALL display all posts authored by that user, including both `draft` and `published` posts, ordered by creation date descending.
2. WHILE an Author is viewing the My Posts dashboard, THE System SHALL provide controls to create a new post, edit an existing post, and delete an existing post.
3. WHEN an Author deletes a post from the dashboard, THE System SHALL display a confirmation prompt before sending the delete request.
4. WHEN a delete or status-change action completes, THE System SHALL display a Toast notification indicating success or failure.

---

### Requirement 13: Rich Text Editor Integration

**User Story:** As an Author, I want to compose post content using a rich text editor, so that I can format my writing with headings, lists, links, and emphasis.

#### Acceptance Criteria

1. WHILE an Author is composing or editing a post, THE Rich_Text_Editor SHALL support bold, italic, underline, headings (H1–H3), ordered lists, unordered lists, blockquotes, and hyperlinks.
2. WHEN an Author saves a post, THE System SHALL persist the rich text content as HTML or a structured JSON document in the `content` field of the Post model.
3. WHEN a post is displayed on the Post Detail Page, THE System SHALL render the stored rich text content as formatted HTML.

---

### Requirement 14: Frontend Public Pages

**User Story:** As a visitor or Reader, I want to browse the home page and read individual posts, so that I can consume blog content without requiring an account.

#### Acceptance Criteria

1. WHEN a user navigates to the Home Page, THE System SHALL display a paginated list of `published` posts showing each post's title, author name, publication date, and a content excerpt.
2. WHEN a user submits a search query on the Home Page, THE System SHALL update the post list to show only posts matching the query, without a full page reload.
3. WHEN a user clicks on a post from the Home Page, THE System SHALL navigate to the Post Detail Page and display the full post content, author name, publication date, like count, and all comments.
4. WHEN a user navigates to the Login or Register page, THE System SHALL display the corresponding authentication form with client-side validation feedback.
5. WHILE a data-fetching operation is in progress, THE System SHALL display a loading indicator to the user.
6. IF a data-fetching operation fails, THEN THE System SHALL display a descriptive error message to the user.

---

### Requirement 15: Responsive and Accessible UI

**User Story:** As any user, I want the platform to be usable on any device, so that I can access content from desktop, tablet, or mobile.

#### Acceptance Criteria

1. THE System SHALL implement all pages using Tailwind CSS utility classes such that layouts adapt correctly to viewport widths of 320 px, 768 px, and 1280 px.
2. THE System SHALL provide a dark mode toggle that persists the user's preference across page navigations within the session.
3. WHEN the dark mode toggle is activated, THE System SHALL apply a dark colour scheme to all pages and components.

---

### Requirement 16: Database Connection Management

**User Story:** As a platform operator, I want the application to manage MongoDB connections efficiently, so that the platform performs reliably under load.

#### Acceptance Criteria

1. THE DB_Connection SHALL establish a connection to MongoDB using the `MONGO_URI` environment variable on first use.
2. WHILE a MongoDB connection is already established, THE DB_Connection SHALL reuse the existing connection and SHALL NOT open a new connection for subsequent requests.
3. IF the MongoDB connection attempt fails, THEN THE DB_Connection SHALL throw a descriptive error that propagates to the API route handler, which SHALL return a `500` status.

---

### Requirement 17: Input Validation

**User Story:** As a platform operator, I want all API inputs to be validated before processing, so that malformed data does not corrupt the database or cause unhandled errors.

#### Acceptance Criteria

1. THE System SHALL validate all incoming API request bodies against defined schemas before passing data to service logic.
2. WHEN validation fails, THE System SHALL return a `400` status with a structured error response identifying each invalid field and the reason for rejection.
3. THE System SHALL sanitise rich text HTML content on the server before persisting it to prevent stored cross-site scripting (XSS) attacks.
