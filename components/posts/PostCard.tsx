import Link from 'next/link'
import Image from 'next/image'

export interface PostCardPost {
  _id: string
  title: string
  excerpt?: string
  image?: string
  author: { name: string } | string
  createdAt: string
  status: string
  likes: string[]
}

interface PostCardProps {
  post: PostCardPost
  variant?: 'hero' | 'tall' | 'default'
}

function getAuthorName(author: { name: string } | string): string {
  if (typeof author === 'string') return author
  return author.name
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

function getAccent(id: string) {
  const list = [
    { a: '#6366f1', b: '#a78bfa' },
    { a: '#3b82f6', b: '#22d3ee' },
    { a: '#10b981', b: '#34d399' },
    { a: '#f59e0b', b: '#fb923c' },
    { a: '#ec4899', b: '#f43f5e' },
    { a: '#8b5cf6', b: '#c084fc' },
  ]
  return list[id.charCodeAt(id.length - 1) % list.length]
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

/* ── Placeholder cover when no image ──────────────────────────────────────── */
function NoCover({ accent, title }: { accent: { a: string; b: string }; title: string }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${accent.a}18 0%, ${accent.b}30 100%)` }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle, ${accent.a} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />
      {/* Centre orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl opacity-30"
        style={{ background: `radial-gradient(circle, ${accent.a}, transparent 70%)` }}
      />
      {/* Big letter */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[7rem] font-black leading-none select-none opacity-[0.07]"
          style={{ color: accent.a }}
        >
          {title.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
  )
}

/* ── Shared meta row ──────────────────────────────────────────────────────── */
function Meta({
  authorName,
  formattedDate,
  likes,
  accent,
  light = false,
}: {
  authorName: string
  formattedDate: string
  likes: number
  accent: { a: string; b: string }
  light?: boolean
}) {
  const initials = getInitials(authorName)
  const textCls = light ? 'text-white/70' : 'text-[var(--foreground-muted)]'
  const dotCls  = light ? 'text-white/30'  : 'text-[var(--border-strong)]'

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${accent.a}, ${accent.b})` }}
        >
          {initials}
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${textCls}`}>
          <span className="font-medium">{authorName}</span>
          <span className={dotCls} aria-hidden="true">·</span>
          <time dateTime={formattedDate}>{formattedDate}</time>
        </div>
      </div>
      <span
        aria-label={`${likes} likes`}
        className={`inline-flex items-center gap-1 text-xs ${textCls}`}
      >
        <svg aria-hidden="true" className="h-3.5 w-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
        {likes}
      </span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   HERO CARD  — full-bleed cinematic, text overlaid on image
══════════════════════════════════════════════════════════════════════════════ */
function HeroCard({ post }: { post: PostCardPost }) {
  const accent      = getAccent(post._id)
  const authorName  = getAuthorName(post.author)
  const formattedDate = formatDate(post.createdAt)
  const excerpt     = post.excerpt ? truncate(post.excerpt, 180) : null

  return (
    <article className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden" style={{ minHeight: 'clamp(280px, 50vw, 480px)' }}>
      {/* ── Background image / placeholder ── */}
      <div className="absolute inset-0">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <NoCover accent={accent} title={post.title} />
        )}
      </div>

      {/* ── Gradient overlays ── */}
      {/* Bottom scrim for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
      {/* Accent colour tint on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${accent.a}, ${accent.b})` }}
      />

      {/* ── Border glow ring ── */}
      <div
        className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1.5px ${accent.a}60, 0 0 40px ${accent.a}25` }}
      />

      {/* ── Content ── */}
      <div className="relative h-full flex flex-col justify-end p-5 sm:p-7 lg:p-10" style={{ minHeight: 'clamp(280px, 50vw, 480px)' }}>
        {/* Top row badges */}
        <div className="absolute top-4 left-5 sm:top-6 sm:left-7 lg:left-10 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-sm"
            style={{ background: `linear-gradient(90deg, ${accent.a}cc, ${accent.b}cc)` }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            Featured
          </span>
          {post.status === 'draft' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/80 text-white backdrop-blur-sm">
              Draft
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/posts/${post._id}`}>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2 sm:mb-3
                         group-hover:text-white transition-colors duration-200 line-clamp-3
                         [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="hidden sm:block text-sm sm:text-base text-white/70 leading-relaxed line-clamp-2 mb-4 sm:mb-5 max-w-2xl">
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Meta
            authorName={authorName}
            formattedDate={formattedDate}
            likes={post.likes.length}
            accent={accent}
            light
          />
          <Link
            href={`/posts/${post._id}`}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold
                       text-white backdrop-blur-sm border border-white/20
                       hover:border-white/40 hover:bg-white/10
                       transition-all duration-200"
          >
            Read article
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   TALL CARD  — image top half, content bottom half, taller aspect
══════════════════════════════════════════════════════════════════════════════ */
function TallCard({ post }: { post: PostCardPost }) {
  const accent      = getAccent(post._id)
  const authorName  = getAuthorName(post.author)
  const formattedDate = formatDate(post.createdAt)
  const excerpt     = post.excerpt ? truncate(post.excerpt, 130) : null

  return (
    <article
      className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl
                 overflow-hidden flex flex-col h-full
                 hover:border-transparent
                 transition-all duration-300"
      style={{
        ['--tw-shadow' as string]: `0 0 0 1px ${accent.a}50, 0 20px 50px ${accent.a}15`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${accent.a}60, 0 20px 50px ${accent.a}18`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = ''
      }}
    >
      {/* Cover */}
      <Link href={`/posts/${post._id}`} className="relative block overflow-hidden shrink-0" tabIndex={-1} aria-hidden="true">
        <div className="relative w-full" style={{ paddingBottom: '62%' }}>
          <div className="absolute inset-0">
            {post.image ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <NoCover accent={accent} title={post.title} />
            )}
            {/* Bottom fade into card */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--surface)] to-transparent" />
          </div>
        </div>
      </Link>

      {/* Accent line */}
      <div
        className="h-[2px] w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})` }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {post.status === 'draft' && (
          <span className="self-start mb-2.5 px-2 py-0.5 rounded-md text-xs font-medium
                           bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20">
            Draft
          </span>
        )}

        <Link href={`/posts/${post._id}`}>
          <h2 className="text-base font-bold text-[var(--foreground)] leading-snug line-clamp-2 mb-2.5
                         group-hover:text-[var(--brand)] transition-colors duration-150">
            {post.title}
          </h2>
        </Link>

        {excerpt && (
          <p className="text-sm text-[var(--foreground-muted)] leading-relaxed line-clamp-3 flex-1 mb-4">
            {excerpt}
          </p>
        )}

        <div className="mt-auto pt-3.5 border-t border-[var(--border)]">
          <Meta
            authorName={authorName}
            formattedDate={formattedDate}
            likes={post.likes.length}
            accent={accent}
          />
        </div>
      </div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   DEFAULT CARD  — compact horizontal-ish card for smaller slots
══════════════════════════════════════════════════════════════════════════════ */
function DefaultCard({ post }: { post: PostCardPost }) {
  const accent      = getAccent(post._id)
  const authorName  = getAuthorName(post.author)
  const formattedDate = formatDate(post.createdAt)
  const excerpt     = post.excerpt ? truncate(post.excerpt, 100) : null

  return (
    <article
      className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl
                 overflow-hidden flex flex-col h-full
                 transition-all duration-300"
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${accent.a}50, 0 12px 32px ${accent.a}12`
        ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = ''
        ;(e.currentTarget as HTMLElement).style.borderColor = ''
      }}
    >
      {/* Cover */}
      <Link href={`/posts/${post._id}`} className="relative block overflow-hidden shrink-0" tabIndex={-1} aria-hidden="true">
        <div className="relative w-full" style={{ paddingBottom: '56%' }}>
          <div className="absolute inset-0">
            {post.image ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            ) : (
              <NoCover accent={accent} title={post.title} />
            )}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--surface)] to-transparent" />
          </div>
        </div>
      </Link>

      {/* Thin accent bar */}
      <div
        className="h-[2px] w-full shrink-0 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})` }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {post.status === 'draft' && (
          <span className="self-start mb-2 px-2 py-0.5 rounded-md text-xs font-medium
                           bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20">
            Draft
          </span>
        )}

        <Link href={`/posts/${post._id}`}>
          <h2 className="text-sm font-bold text-[var(--foreground)] leading-snug line-clamp-2 mb-2
                         group-hover:text-[var(--brand)] transition-colors duration-150">
            {post.title}
          </h2>
        </Link>

        {excerpt && (
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-2 flex-1 mb-3">
            {excerpt}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-[var(--border)]">
          <Meta
            authorName={authorName}
            formattedDate={formattedDate}
            likes={post.likes.length}
            accent={accent}
          />
        </div>
      </div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════════════════════════ */
export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  if (variant === 'hero')    return <HeroCard    post={post} />
  if (variant === 'tall')    return <TallCard    post={post} />
  return                            <DefaultCard post={post} />
}
