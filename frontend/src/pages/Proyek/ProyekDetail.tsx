import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import type { StatusProyek } from '../../types'
import { useProyek, useUpdateProyek, type CreateProyekInput } from '../../hooks/useProyek'
import { useAuth } from '../../hooks/useAuth'
import { formatRupiah, formatTanggal } from '../../utils/format'
import RabTab from '../../components/Proyek/RabTab'
import PengeluaranTab from '../../components/Proyek/PengeluaranTab'
import JadwalTab from '../../components/Proyek/JadwalTab'

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<StatusProyek, { label: string; bg: string; text: string }> = {
  aktif:     { label: 'Aktif',     bg: 'bg-badge-success', text: 'text-success'  },
  selesai:   { label: 'Selesai',   bg: 'bg-badge-success', text: 'text-success'  },
  terlambat: { label: 'Terlambat', bg: 'bg-badge-danger',  text: 'text-danger'   },
  arsip:     { label: 'Arsip',     bg: 'bg-border',         text: 'text-text-mid' },
}

// ─── Edit schema ──────────────────────────────────────────────────────────────
const editSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  nilai_kontrak: z.coerce.number().positive('Nilai kontrak harus positif'),
  tgl_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tgl_selesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
  manajer_id: z.string().optional(),
})
type EditFormData = z.infer<typeof editSchema>

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm'

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditProyekModal({
  proyekId,
  defaultValues,
  onClose,
}: {
  proyekId: string
  defaultValues: EditFormData
  onClose: () => void
}) {
  const updateProyek = useUpdateProyek()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues,
  })

  const onSubmit = async (data: EditFormData) => {
    const input: CreateProyekInput & { id: string } = {
      id: proyekId,
      nama: data.nama,
      alamat: data.alamat,
      nilai_kontrak: data.nilai_kontrak,
      tgl_mulai: data.tgl_mulai,
      tgl_selesai: data.tgl_selesai,
      manajer_id: data.manajer_id || undefined,
    }
    await updateProyek.mutateAsync(input)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-text-dark font-semibold text-lg">Edit Proyek</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {updateProyek.isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
              Gagal menyimpan perubahan. Coba lagi.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Nama Proyek</label>
            <input {...register('nama')} className={inputCls} />
            {errors.nama && <p className="text-danger text-xs">{errors.nama.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Alamat</label>
            <input {...register('alamat')} className={inputCls} />
            {errors.alamat && <p className="text-danger text-xs">{errors.alamat.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Nilai Kontrak (Rp)</label>
            <input {...register('nilai_kontrak')} type="number" className={inputCls} />
            {errors.nilai_kontrak && <p className="text-danger text-xs">{errors.nilai_kontrak.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Tgl Mulai</label>
              <input {...register('tgl_mulai')} type="date" className={inputCls} />
              {errors.tgl_mulai && <p className="text-danger text-xs">{errors.tgl_mulai.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Tgl Selesai</label>
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
              disabled={updateProyek.isPending}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {updateProyek.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'rab' | 'jadwal' | 'pengeluaran' | 'info'

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProyekDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: proyek, isLoading, isError } = useProyek(id ?? '')
  const [activeTab, setActiveTab] = useState<Tab>('rab')
  const [showEdit, setShowEdit] = useState(false)

  const canManage = user?.role === 'owner' || user?.role === 'manajer'

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-border rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-border rounded w-1/4 animate-pulse" />
        <div className="h-10 bg-border rounded animate-pulse" />
        <div className="h-64 bg-border rounded-xl animate-pulse" />
      </div>
    )
  }

  if (isError || !proyek) {
    return (
      <div className="p-6">
        <div className="bg-badge-danger border border-danger/30 rounded-xl px-5 py-4 text-danger text-sm">
          Proyek tidak ditemukan atau terjadi kesalahan.
        </div>
        <button
          onClick={() => navigate('/proyek')}
          className="mt-4 text-primary text-sm font-medium hover:underline"
        >
          ← Kembali ke daftar proyek
        </button>
      </div>
    )
  }

  const status = STATUS_CONFIG[proyek.status] ?? STATUS_CONFIG.aktif
  const tabs: { id: Tab; label: string }[] = [
    { id: 'rab',         label: 'RAB'         },
    { id: 'jadwal',      label: 'Jadwal'      },
    { id: 'pengeluaran', label: 'Pengeluaran' },
    { id: 'info',        label: 'Info'        },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/proyek')}
        className="flex items-center gap-1.5 text-text-mid text-sm hover:text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Proyek
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text-dark">{proyek.nama}</h1>
            <span
              className={clsx(
                'text-xs font-medium px-2.5 py-1 rounded-full',
                status.bg,
                status.text,
              )}
            >
              {status.label}
            </span>
          </div>
          <p className="text-text-mid text-sm">{proyek.alamat}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-mid hover:text-text-dark',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'rab' && id && <RabTab proyekId={id} />}
        {activeTab === 'jadwal' && id && <JadwalTab proyekId={id} />}
        {activeTab === 'pengeluaran' && id && <PengeluaranTab proyekId={id} />}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard label="Nilai Kontrak" value={formatRupiah(proyek.nilai_kontrak)} />
            <InfoCard label="Status" value={status.label} />
            <InfoCard label="Tanggal Mulai" value={formatTanggal(proyek.tgl_mulai)} />
            <InfoCard label="Tanggal Selesai" value={formatTanggal(proyek.tgl_selesai)} />
            {proyek.manajer && (
              <InfoCard label="Manajer" value={proyek.manajer.nama} />
            )}
            {proyek.total_rab !== undefined && (
              <InfoCard label="Total RAB" value={formatRupiah(proyek.total_rab)} />
            )}
            {proyek.total_realisasi !== undefined && (
              <InfoCard label="Total Realisasi" value={formatRupiah(proyek.total_realisasi)} />
            )}
            {proyek.persen_realisasi !== undefined && (
              <InfoCard label="Persentase Realisasi" value={`${proyek.persen_realisasi.toFixed(1)}%`} />
            )}
            <InfoCard label="Dibuat" value={formatTanggal(proyek.created_at)} />
            <InfoCard label="Alamat" value={proyek.alamat} fullWidth />
          </div>
        )}
      </div>

      {showEdit && proyek && (
        <EditProyekModal
          proyekId={proyek.id}
          defaultValues={{
            nama: proyek.nama,
            alamat: proyek.alamat,
            nilai_kontrak: proyek.nilai_kontrak,
            tgl_mulai: proyek.tgl_mulai.slice(0, 10),
            tgl_selesai: proyek.tgl_selesai.slice(0, 10),
            manajer_id: proyek.manajer_id,
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}

function InfoCard({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={clsx('bg-card-bg rounded-xl border border-border p-4', fullWidth && 'sm:col-span-2')}>
      <p className="text-xs text-text-light mb-1">{label}</p>
      <p className="text-text-dark font-medium text-sm">{value}</p>
    </div>
  )
}
