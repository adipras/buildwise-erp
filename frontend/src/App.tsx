import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<div className="flex items-center justify-center min-h-screen"><p className="text-text-mid">Halaman Login — segera hadir</p></div>} />
          <Route path="/dashboard" element={<div className="flex items-center justify-center min-h-screen"><p className="text-text-mid">Dashboard — segera hadir</p></div>} />
          <Route path="*" element={<div className="flex items-center justify-center min-h-screen"><p className="text-danger">404 — Halaman tidak ditemukan</p></div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
