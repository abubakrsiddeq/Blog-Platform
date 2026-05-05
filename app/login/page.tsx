import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In — Blog Platform',
  description: 'Sign in to your Blog Platform account.',
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-8 sm:px-8">
        <LoginForm />
      </div>
    </main>
  )
}
