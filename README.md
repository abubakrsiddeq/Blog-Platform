# BKR Blog Platform

A full-stack blog platform built with Next.js 16, MongoDB, and Tailwind CSS v4. Supports two user roles — authors who create and manage posts, and readers who can like and comment.

**Live Demo → [https://blog-platform-uptech.vercel.app](https://blog-platform-uptech.vercel.app)**

---

## ✨ BKR AI Assistant

> **BKR AI Assistant** is the built-in AI writing companion for BKR Blog Platform — powered by OpenAI.

Authors can describe any topic in plain language and **BKR AI Assistant** will instantly generate a complete blog post — title and rich-text content — directly inside the post editor. No copy-pasting, no tab-switching. Just write a prompt, hit **Generate**, and your draft is ready to review and publish.

### What BKR AI Assistant can do

| Capability | Detail |
|---|---|
| 📝 Title generation | Produces a relevant, engaging post title from your prompt |
| 📄 Content generation | Writes a full rich-text article body, ready in the Tiptap editor |
| ⚡ One-click workflow | Injects content directly into the form — edit and publish immediately |
| 🔒 Secure by design | OpenAI API key stays server-side only, never exposed to the browser |
| 🛡️ Role-gated | Only authenticated `author` accounts can invoke the AI |
| ⏱️ Timeout protection | 30-second server-side timeout with clear user feedback |
| 🔄 Error recovery | Inline error messages with the ability to retry without a page reload |

### How to use BKR AI Assistant

1. Open **New Post** or **Edit Post** from your author dashboard.
2. Find the **BKR AI Assistant** panel at the top of the form.
3. Type a prompt — e.g. *"Write a beginner's guide to TypeScript generics"*.
4. Click **Generate** and wait a moment.
5. Your title and content are auto-filled. Edit freely, then publish.

> **Requires** `OPENAI_API_KEY` to be set in your environment variables (see [Environment Variables](#environment-variables)).

---

## Features

- **Authentication** — JWT-based register/login/logout with httpOnly cookies, bcrypt password hashing
- **Two roles** — `author` (create, edit, delete posts) and `reader` (like, comment)
- **Rich text editor** — Tiptap editor with bold, italic, underline, links, and more
- **Image uploads** — Cover image upload via Cloudinary
- **Post management** — Draft / published status, author dashboard
- **Likes & comments** — Readers can like posts and leave comments
- **Search** — Full-text search on post title and content (MongoDB text index)
- **Pagination** — Server-side paginated post listing
- **Dark mode** — System-aware with manual toggle
- **Input validation** — Zod schemas on all API routes
- **HTML sanitisation** — sanitize-html on all rich text content
- **BKR AI Assistant** — Generate post titles and content from a prompt using OpenAI (see [BKR AI Assistant](#-bkr-ai-assistant))

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Styling | Tailwind CSS v4 |
| Rich Text | Tiptap |
| Image Storage | Cloudinary |
| Validation | Zod |
| Sanitisation | sanitize-html |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com) account (for image uploads)

### Installation

```bash
git clone https://github.com/your-username/blog-platform.git
cd blog-platform
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_api_key
```

> **AI Writing Assistant:** `OPENAI_API_KEY` must be set to a valid OpenAI API key for the AI Writing Assistant feature to function. Without it, the `/api/ai/generate` endpoint will return a 500 error.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
├── app/
│   ├── api/              # API route handlers
│   │   ├── auth/         # login, register, logout, me
│   │   ├── posts/        # CRUD + likes
│   │   ├── comments/     # create, list by post
│   │   └── upload/       # image upload
│   ├── dashboard/        # author dashboard (new, edit)
│   ├── posts/[id]/       # public post detail page
│   ├── login/
│   └── register/
├── components/
│   ├── auth/             # LoginForm, RegisterForm
│   ├── comments/         # CommentForm, CommentList
│   ├── editor/           # RichTextEditor (Tiptap)
│   ├── posts/            # PostCard, PostDetail, PostForm, PostList
│   ├── providers/        # AuthProvider (React context)
│   └── ui/               # Navbar, DarkModeToggle, Pagination, Toast, etc.
├── lib/
│   ├── auth.ts           # JWT + bcrypt helpers
│   ├── db.ts             # Mongoose connection
│   ├── sanitise.ts       # HTML sanitisation
│   ├── services/         # Business logic (auth, posts, comments, likes, search, upload)
│   └── validation/       # Zod schemas
├── models/               # Mongoose models (User, Post, Comment)
└── types/                # Shared TypeScript interfaces
```

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## License

MIT
