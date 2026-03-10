import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch {
      setError('root', { message: 'Email atau password salah' })
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-sm bg-card-bg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-8 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">BuildWise</span>
          </div>
          <p className="text-blue-200 text-sm mt-1">ERP Konstruksi Indonesia</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-5">
          <div>
            <h1 className="text-text-dark text-xl font-semibold">Masuk ke Akun</h1>
            <p className="text-text-mid text-sm mt-1">Kelola proyek konstruksi Anda</p>
          </div>

          {/* Root error */}
          {errors.root && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3">
              <p className="text-danger text-sm">{errors.root.message}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-dark">Email</label>
            <input
              type="email"
              placeholder="nama@perusahaan.com"
              {...register('email')}
              className="w-full px-4 py-3 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            {errors.email && (
              <p className="text-danger text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-dark">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full px-4 py-3 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            {errors.password && (
              <p className="text-danger text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-accent hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
          >
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-text-light text-xs">
            © 2025 BuildWise ERP • Semua hak dilindungi
          </p>
        </div>
      </div>
    </div>
  )
}
