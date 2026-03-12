import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/Login'
import DashboardPage from './pages/Dashboard'
import ProyekListPage from './pages/Proyek'
import ProyekDetailPage from './pages/Proyek/ProyekDetail'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Publik */}
            <Route path="/login" element={<Login />} />

            {/* Privat — bungkus AppLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyek"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProyekListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyek/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProyekDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-light-bg">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-danger mb-2">404</p>
                    <p className="text-text-mid">Halaman tidak ditemukan</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
