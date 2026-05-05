import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Create Account — Blog Platform',
  description: 'Create a new Blog Platform account.',
}

export default function RegisterPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-8 sm:px-8">
        <RegisterForm />
      </div>
    </main>
  )
}
