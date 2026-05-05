import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In — Blog Platform',
  description: 'Sign in to your Blog Platform account.',
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 bg-[var(--background)]">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm px-6 py-8 sm:px-8">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
