import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import type { StatusProyek } from '../../types'
import {
  useProyekList,
  useCreateProyek,
  type CreateProyekInput,
} from '../../hooks/useProyek'
import { useAuth } from '../../hooks/useAuth'
import ProyekCard from '../../components/ProyekCard'

// ─── Schema ──────────────────────────────────────────────────────────────────
const schema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  nilai_kontrak: z.coerce.number().positive('Nilai kontrak harus positif'),
  tgl_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tgl_selesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
  manajer_id: z.string().optional(),
})
type FormData = z.infer<typeof schema>

// ─── Skeleton ────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-card-bg rounded-xl border border-border p-5 animate-pulse">
      <div className="h-4 bg-border rounded w-3/4 mb-3" />
      <div className="h-3 bg-border rounded w-1/2 mb-4" />
      <div className="h-6 bg-border rounded w-2/3 mb-4" />
      <div className="h-2 bg-border rounded w-full mb-4" />
      <div className="h-3 bg-border rounded w-full" />
    </div>
  )
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────
type FilterStatus = 'semua' | StatusProyek
const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'semua',     label: 'Semua'     },
  { value: 'aktif',     label: 'Aktif'     },
  { value: 'selesai',   label: 'Selesai'   },
  { value: 'terlambat', label: 'Terlambat' },
  { value: 'arsip',     label: 'Arsip'     },
]

// ─── Modal Tambah Proyek ──────────────────────────────────────────────────────
function TambahProyekModal({ onClose }: { onClose: () => void }) {
  const createProyek = useCreateProyek()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const input: CreateProyekInput = {
      nama: data.nama,
      alamat: data.alamat,
      nilai_kontrak: data.nilai_kontrak,
      tgl_mulai: data.tgl_mulai,
      tgl_selesai: data.tgl_selesai,
      manajer_id: data.manajer_id || undefined,
    }
    await createProyek.mutateAsync(input)
    onClose()
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-text-dark font-semibold text-lg">Tambah Proyek Baru</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {createProyek.isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
              Gagal menyimpan proyek. Coba lagi.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-dark">Nama Proyek</label>
            <input {...register('nama')} placeholder="Gedung Kantor XYZ" className={inputCls} />
            {errors.nama && <p className="text-danger text-xs">{errors.nama.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-dark">Alamat</label>
            <input {...register('alamat')} placeholder="Jl. Sudirman No. 1, Jakarta" className={inputCls} />
            {errors.alamat && <p className="text-danger text-xs">{errors.alamat.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-dark">Nilai Kontrak (Rp)</label>
            <input
              {...register('nilai_kontrak')}
              type="number"
              placeholder="500000000"
              className={inputCls}
            />
            {errors.nilai_kontrak && <p className="text-danger text-xs">{errors.nilai_kontrak.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-dark">Tgl Mulai</label>
              <input {...register('tgl_mulai')} type="date" className={inputCls} />
              {errors.tgl_mulai && <p className="text-danger text-xs">{errors.tgl_mulai.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-dark">Tgl Selesai</label>
              <input {...register('tgl_selesai')} type="date" className={inputCls} />
              {errors.tgl_selesai && <p className="text-danger text-xs">{errors.tgl_selesai.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createProyek.isPending}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {createProyek.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProyekListPage() {
  const { user } = useAuth()
  const { data: proyekList, isLoading, isError } = useProyekList()
  const [filter, setFilter] = useState<FilterStatus>('semua')
  const [showModal, setShowModal] = useState(false)

  const canCreate = user?.role === 'owner' || user?.role === 'manajer'

  const filtered =
    filter === 'semua'
      ? (proyekList ?? [])
      : (proyekList ?? []).filter((p) => p.status === filter)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Proyek</h1>
          <p className="text-text-mid text-sm mt-0.5">Kelola semua proyek konstruksi</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Proyek
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === tab.value
                ? 'bg-primary text-white'
                : 'bg-card-bg border border-border text-text-mid hover:bg-light-bg',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-badge-danger border border-danger/30 rounded-xl px-5 py-4 text-danger text-sm mb-6">
          Gagal memuat daftar proyek. Periksa koneksi dan coba lagi.
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-border flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <p className="text-text-dark font-semibold mb-1">Belum ada proyek</p>
          <p className="text-text-light text-sm">
            {filter === 'semua'
              ? 'Klik "+ Tambah Proyek" untuk memulai'
              : `Tidak ada proyek dengan status "${filter}"`}
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProyekCard key={p.id} proyek={p} />
          ))}
        </div>
      )}

      {showModal && <TambahProyekModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
