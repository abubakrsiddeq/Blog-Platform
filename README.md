# BKR Blog Platform  

A full-stack blog platform built with Next.js 16, MongoDB, and Tailwind CSS v4. Supports two user roles — authors who create and manage posts, and readers who can like and comment.

**Live Demo → [https://blog-platform-uptech.vercel.app](https://blog-platform-uptech.vercel.app)**

--- 

## ✨ BKR AI Assistant

> **BKR AI Assistant** is the built-in AI writing companion for BKR Blog Platform — powered by **Groq** (with Gemini and OpenAI as fallbacks).

Authors can describe any topic in plain language and **BKR AI Assistant** will instantly generate a complete blog post — title and rich-text content — directly inside the post editor. No copy-pasting, no tab-switching. Just write a prompt, hit **Generate**, and your draft is ready to review and publish.

### What BKR AI Assistant can do

| Capability | Detail |
|---|---|
| 📝 Title generation | Produces a relevant, engaging post title from your prompt |
| 📄 Content generation | Writes a full rich-text article body, ready in the Tiptap editor |
| ⚡ One-click workflow | Injects content directly into the form — edit and publish immediately |
| 🔒 Secure by design | API keys stay server-side only, never exposed to the browser |
| 🛡️ Role-gated | Only authenticated `author` accounts can invoke the AI |
| ⏱️ Timeout protection | 30-second server-side timeout with clear user feedback |
| 🔄 Error recovery | Inline error messages with the ability to retry without a page reload |

### AI Provider Priority

The service checks for API keys in this order and uses the first one found:

1. **Groq** — `GROQ_API_KEY` — uses `llama-3.3-70b-versatile` (free tier available, fastest)
2. **Gemini** — `GEMINI_API_KEY` — uses `gemini-2.0-flash`
3. **OpenAI** — `OPENAI_API_KEY` — uses `gpt-3.5-turbo`

At least one of these keys must be set for the AI feature to work.

### How to use BKR AI Assistant

1. Open **New Post** or **Edit Post** from your author dashboard.
2. Find the **BKR AI Assistant** panel at the top of the form.
3. Type a prompt — e.g. *"Write a beginner's guide to TypeScript generics"*.
4. Click **Generate** and wait a moment.
5. Your title and content are auto-filled. Edit freely, then publish.

---

## Features

- **Authentication** — JWT-based register/login/logout with httpOnly cookies, bcrypt password hashing
- **Two roles** — `author` (create, edit, delete posts) and `reader` (like, comment)
- **Rich text editor** — Tiptap editor with bold, italic, underline, headings, lists, blockquotes, and links
- **Image uploads** — Cover image upload via Cloudinary (falls back to local `/public/uploads`)
- **Post management** — Draft / published status, author dashboard with search
- **Likes & comments** — Readers can like posts and leave comments
- **Search** — Full-text search on post title and content (MongoDB text index)
- **Pagination** — Server-side paginated post listing (10 per page)
- **Dark mode** — System-aware with manual toggle, persisted to localStorage
- **Bento grid layout** — Homepage hero card + tall cards + 3-column grid
- **Input validation** — Zod schemas on all API routes
- **HTML sanitisation** — sanitize-html on all rich text content to prevent XSS
- **BKR AI Assistant** — Generate post titles and content from a prompt (see above)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Language | TypeScript 5.9.3 |
| Database | MongoDB + Mongoose 9.6.1 |
| Auth | JWT (jsonwebtoken 9.0.3) + bcryptjs 3.0.3 |
| Styling | Tailwind CSS v4 |
| Rich Text | Tiptap 3.22.5 |
| Image Storage | Cloudinary 2.10.0 |
| Validation | Zod 4.4.3 |
| Sanitisation | sanitize-html 2.13.1 |
| AI | Groq / Gemini / OpenAI (configurable) |
| Testing | Jest 30 + Testing Library + mongodb-memory-server |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- At least one AI API key (Groq, Gemini, or OpenAI) for the AI Assistant feature
- A [Cloudinary](https://cloudinary.com) account (optional — falls back to local storage)

### Installation

```bash
git clone https://github.com/your-username/blog-platform.git
cd blog-platform
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
# Required
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# AI Writing Assistant — at least one required
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Image uploads — optional (falls back to local /public/uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

> **AI Writing Assistant:** Set at least one of `GROQ_API_KEY`, `GEMINI_API_KEY`, or `OPENAI_API_KEY`. Groq is recommended — it's free and fast. Without any key, the `/api/ai/generate` endpoint returns a 500 error.

> **Image uploads:** If `CLOUDINARY_URL` is not set, uploaded images are saved locally to `/public/uploads`. This works for development but is not suitable for production deployments on serverless platforms.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/         # login, register, logout, me (GET + PATCH)
│   │   ├── posts/        # CRUD + likes
│   │   ├── comments/     # create, list by post
│   │   ├── upload/       # image upload
│   │   └── ai/generate/  # AI content generation
│   ├── dashboard/        # author dashboard (list, new, edit)
│   ├── posts/[id]/       # public post detail page
│   ├── login/
│   └── register/
├── components/
│   ├── auth/             # LoginForm, RegisterForm
│   ├── comments/         # CommentForm, CommentList
│   ├── editor/           # RichTextEditor (Tiptap)
│   ├── posts/            # PostCard, PostDetail, PostForm, PostList, AIAssistant
│   ├── providers/        # AuthProvider (React context)
│   └── ui/               # Navbar, DarkModeToggle, Pagination, Toast, ConfirmDialog, LoadingSpinner, ProfileDropdown
├── lib/
│   ├── auth.ts           # JWT signing/verification + bcrypt helpers
│   ├── db.ts             # Mongoose connection with caching
│   ├── sanitise.ts       # HTML sanitisation config
│   ├── services/         # Business logic (auth, posts, comments, likes, search, upload, ai)
│   └── validation/       # Zod schemas (auth, posts, comments, ai)
├── models/               # Mongoose models (User, Post, Comment)
├── types/                # Shared TypeScript interfaces
└── proxy.ts              # Edge middleware — JWT auth + role-based access control
```

---

## API Routes

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login, sets httpOnly JWT cookie |
| GET | `/api/auth/me` | Auth | Get current user profile |
| PATCH | `/api/auth/me` | Auth | Update name or password |
| POST | `/api/auth/logout` | Auth | Clear JWT cookie |
| GET | `/api/posts` | Public | List published posts (paginated, searchable) |
| POST | `/api/posts` | Author | Create a new post |
| GET | `/api/posts/[id]` | Public | Get a single post (drafts: author only) |
| PUT | `/api/posts/[id]` | Author | Update own post |
| DELETE | `/api/posts/[id]` | Author | Delete own post |
| POST | `/api/posts/[id]/like` | Auth | Toggle like on a post |
| POST | `/api/comments` | Auth | Create a comment |
| GET | `/api/comments/[postId]` | Public | Get all comments for a post |
| POST | `/api/upload` | Author | Upload a cover image |
| POST | `/api/ai/generate` | Author | Generate post title + content from a prompt |

---

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run tests once
npm run test:watch # Run tests in watch mode
```

---

## License

MIT
