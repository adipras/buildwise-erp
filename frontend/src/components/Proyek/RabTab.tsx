import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import clsx from 'clsx'
import type { RabItem } from '../../types'
import {
  useRabList,
  useCreateRabItem,
  useUpdateRabItem,
  useDeleteRabItem,
  useLockRab,
  type RabItemInput,
} from '../../hooks/useProyek'
import { useAuth } from '../../hooks/useAuth'
import { formatRupiah } from '../../utils/format'

interface Props {
  proyekId: string
}

// ─── Zod schema ──────────────────────────────────────────────────────────────
const rabSchema = z.object({
  kode: z.string().min(1, 'Kode wajib diisi'),
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  volume: z.coerce.number().positive('Volume harus positif'),
  satuan: z.string().min(1, 'Satuan wajib diisi'),
  harga_satuan: z.coerce.number().positive('Harga satuan harus positif'),
})
type RabFormData = z.infer<typeof rabSchema>

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm'

// ─── Form Modal ───────────────────────────────────────────────────────────────
function RabItemModal({
  proyekId,
  editItem,
  onClose,
}: {
  proyekId: string
  editItem?: RabItem
  onClose: () => void
}) {
  const createRab = useCreateRabItem(proyekId)
  const updateRab = useUpdateRabItem(proyekId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RabFormData>({
    resolver: zodResolver(rabSchema),
    defaultValues: editItem
      ? {
          kode: editItem.kode,
          nama: editItem.nama,
          volume: editItem.volume,
          satuan: editItem.satuan,
          harga_satuan: editItem.harga_satuan,
        }
      : undefined,
  })

  const isPending = createRab.isPending || updateRab.isPending

  const onSubmit = async (data: RabFormData) => {
    const input: RabItemInput = {
      kode: data.kode,
      nama: data.nama,
      volume: data.volume,
      satuan: data.satuan,
      harga_satuan: data.harga_satuan,
    }
    if (editItem) {
      await updateRab.mutateAsync({ id: editItem.id, ...input })
    } else {
      await createRab.mutateAsync(input)
    }
    onClose()
  }

  const isError = createRab.isError || updateRab.isError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-text-dark font-semibold text-lg">
            {editItem ? 'Edit Item RAB' : 'Tambah Item RAB'}
          </h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
              Gagal menyimpan. Coba lagi.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Kode</label>
              <input {...register('kode')} placeholder="A.1.1" className={inputCls} />
              {errors.kode && <p className="text-danger text-xs">{errors.kode.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Satuan</label>
              <input {...register('satuan')} placeholder="m², unit, ls" className={inputCls} />
              {errors.satuan && <p className="text-danger text-xs">{errors.satuan.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Nama Pekerjaan</label>
            <input {...register('nama')} placeholder="Pekerjaan Pondasi" className={inputCls} />
            {errors.nama && <p className="text-danger text-xs">{errors.nama.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Volume</label>
              <input {...register('volume')} type="number" step="0.01" placeholder="100" className={inputCls} />
              {errors.volume && <p className="text-danger text-xs">{errors.volume.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Harga Satuan (Rp)</label>
              <input {...register('harga_satuan')} type="number" placeholder="50000" className={inputCls} />
              {errors.harga_satuan && <p className="text-danger text-xs">{errors.harga_satuan.message}</p>}
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
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Lock Confirm Dialog ──────────────────────────────────────────────────────
function LockConfirmDialog({ onConfirm, onCancel, isPending }: {
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-badge-warning flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-text-dark font-semibold text-lg mb-2">Kunci RAB?</h3>
        <p className="text-text-mid text-sm mb-6">
          RAB yang sudah dikunci tidak dapat diubah lagi. Pastikan semua item sudah benar.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-warning hover:bg-yellow-500 disabled:opacity-60 text-text-dark text-sm font-semibold transition-colors"
          >
            {isPending ? 'Mengunci...' : 'Ya, Kunci'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RabTab({ proyekId }: Props) {
  const { user } = useAuth()
  const { data: rabItems = [], isLoading, isError } = useRabList(proyekId)
  const deleteRab = useDeleteRabItem(proyekId)
  const lockRab = useLockRab(proyekId)

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<RabItem | undefined>()
  const [showLockConfirm, setShowLockConfirm] = useState(false)

  const canManage = user?.role === 'owner' || user?.role === 'manajer'
  const isLocked = rabItems.length > 0 && rabItems[0].status === 'locked'

  const totalAnggaran = rabItems.reduce((sum, r) => sum + r.total_anggaran, 0)
  const totalRealisasi = rabItems.reduce((sum, r) => sum + (r.total_realisasi ?? 0), 0)
  const sisa = totalAnggaran - totalRealisasi
  const persen = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0

  const alertLevel = persen >= 100 ? 'danger' : persen >= 80 ? 'warning' : 'normal'

  // Pie chart data
  const chartData =
    totalAnggaran > 0
      ? [
          { name: 'Realisasi', value: totalRealisasi, color: alertLevel === 'danger' ? '#E74C3C' : alertLevel === 'warning' ? '#F1C40F' : '#27AE60' },
          { name: 'Sisa', value: Math.max(sisa, 0), color: '#D4E1F0' },
        ]
      : [{ name: 'Belum ada RAB', value: 1, color: '#D4E1F0' }]

  const handleLock = async () => {
    await lockRab.mutateAsync()
    setShowLockConfirm(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-border rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-badge-danger border border-danger/30 rounded-xl text-danger text-sm">
        Gagal memuat data RAB.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {rabItems.length > 0 && alertLevel !== 'normal' && (
        <div
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
            alertLevel === 'danger'
              ? 'bg-badge-danger border border-danger/30 text-danger'
              : 'bg-badge-warning border border-warning/30 text-accent',
          )}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {alertLevel === 'danger'
            ? `⚠️ Realisasi telah melebihi anggaran RAB (${persen.toFixed(1)}%)`
            : `Realisasi mendekati batas anggaran RAB (${persen.toFixed(1)}%)`}
        </div>
      )}

      {/* Summary + Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut chart */}
        <div className="bg-card-bg rounded-xl border border-border p-5">
          <h3 className="text-text-dark font-semibold text-sm mb-3">Anggaran vs Realisasi</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatRupiah(value)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-card-bg rounded-xl border border-border p-4">
            <p className="text-xs text-text-mid mb-1">Total RAB</p>
            <p className="text-primary font-bold text-lg">{formatRupiah(totalAnggaran)}</p>
          </div>
          <div className="bg-card-bg rounded-xl border border-border p-4">
            <p className="text-xs text-text-mid mb-1">Total Realisasi</p>
            <p
              className={clsx(
                'font-bold text-lg',
                alertLevel === 'danger' ? 'text-danger' : alertLevel === 'warning' ? 'text-warning' : 'text-success',
              )}
            >
              {formatRupiah(totalRealisasi)}
            </p>
          </div>
          <div className="bg-card-bg rounded-xl border border-border p-4">
            <p className="text-xs text-text-mid mb-1">Sisa Anggaran</p>
            <p className={clsx('font-bold text-lg', sisa < 0 ? 'text-danger' : 'text-text-dark')}>
              {formatRupiah(sisa)}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {isLocked && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-warning bg-badge-warning border border-warning/20 px-3 py-1.5 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              RAB Terkunci
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {canManage && !isLocked && (
            <button
              onClick={() => setShowLockConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-warning text-warning text-sm font-medium hover:bg-badge-warning transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Kunci RAB
            </button>
          )}
          <button
            onClick={() => { setEditItem(undefined); setShowForm(true) }}
            disabled={isLocked}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Item
          </button>
        </div>
      </div>

      {/* Table */}
      {rabItems.length === 0 ? (
        <div className="text-center py-12 text-text-light text-sm">
          Belum ada item RAB. Klik "+ Tambah Item" untuk memulai.
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-light-bg">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Kode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Nama Pekerjaan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">Volume</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Satuan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">Harga Satuan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">Realisasi</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">%</th>
                  {canManage && !isLocked && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-text-mid">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rabItems.map((item) => {
                  const itemPersen = item.total_anggaran > 0
                    ? ((item.total_realisasi ?? 0) / item.total_anggaran) * 100
                    : 0
                  const itemAlert = itemPersen >= 100 ? 'danger' : itemPersen >= 80 ? 'warning' : 'normal'
                  return (
                    <tr key={item.id} className="hover:bg-light-bg/50 transition-colors">
                      <td className="px-4 py-3 text-text-mid font-mono text-xs">{item.kode}</td>
                      <td className="px-4 py-3 text-text-dark font-medium">{item.nama}</td>
                      <td className="px-4 py-3 text-right text-text-mid">{item.volume}</td>
                      <td className="px-4 py-3 text-text-mid">{item.satuan}</td>
                      <td className="px-4 py-3 text-right text-text-mid">{formatRupiah(item.harga_satuan)}</td>
                      <td className="px-4 py-3 text-right text-text-dark font-medium">{formatRupiah(item.total_anggaran)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={clsx(
                          'font-medium',
                          itemAlert === 'danger' ? 'text-danger' : itemAlert === 'warning' ? 'text-warning' : 'text-success',
                        )}>
                          {formatRupiah(item.total_realisasi ?? 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={clsx(
                          'text-xs font-semibold',
                          itemAlert === 'danger' ? 'text-danger' : itemAlert === 'warning' ? 'text-warning' : 'text-success',
                        )}>
                          {itemPersen.toFixed(1)}%
                        </span>
                      </td>
                      {canManage && !isLocked && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setEditItem(item); setShowForm(true) }}
                              className="text-primary hover:text-primary/70 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteRab.mutate(item.id)}
                              disabled={deleteRab.isPending}
                              className="text-danger hover:text-danger/70 disabled:opacity-50 transition-colors"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <RabItemModal
          proyekId={proyekId}
          editItem={editItem}
          onClose={() => { setShowForm(false); setEditItem(undefined) }}
        />
      )}
      {showLockConfirm && (
        <LockConfirmDialog
          onConfirm={handleLock}
          onCancel={() => setShowLockConfirm(false)}
          isPending={lockRab.isPending}
        />
      )}
    </div>
  )
}
