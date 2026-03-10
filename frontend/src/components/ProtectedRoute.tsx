import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types'

interface Props {
  children: ReactNode
  roles?: Role[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-accent rounded-full animate-spin" />
          <p className="text-text-mid text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-bg">
        <div className="text-center">
          <p className="text-4xl font-bold text-danger mb-2">403</p>
          <p className="text-text-mid">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
