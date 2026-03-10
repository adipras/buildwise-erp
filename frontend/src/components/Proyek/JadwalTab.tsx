import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import type { Milestone } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useProyek } from '../../hooks/useProyek'
import {
  useMilestoneList,
  useProgressSummary,
  useCreateMilestone,
  useUpdateMilestone,
  type MilestoneInput,
} from '../../hooks/useJadwal'
import KurvaSChart from './KurvaSChart'
import GanttChart from './GanttChart'
import MilestoneCard from './MilestoneCard'

interface Props {
  proyekId: string
}

// ─── Progress Summary Card ────────────────────────────────────────────────────
function ProgressSummaryCard({ proyekId }: { proyekId: string }) {
  const { data, isLoading } = useProgressSummary(proyekId)

  if (isLoading) {
    return (
      <div className="bg-card-bg rounded-xl border border-border p-5 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-border rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-card-bg rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-text-dark font-semibold text-base">Ringkasan Progress</h3>
        {data.is_late && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-badge-danger text-danger animate-pulse">
            TERLAMBAT
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-text-light">Progress Rencana</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-border rounded-full h-3">
              <div
                className="bg-text-light h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, data.weighted_planned)}%` }}
              />
            </div>
            <span className="text-text-dark font-semibold text-sm w-12 text-right">
              {data.weighted_planned.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-text-light">Progress Aktual</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-border rounded-full h-3">
              <div
                className={clsx(
                  'h-3 rounded-full transition-all',
                  data.is_late ? 'bg-danger' : 'bg-success',
                )}
                style={{ width: `${Math.min(100, data.weighted_actual)}%` }}
              />
            </div>
            <span className="text-text-dark font-semibold text-sm w-12 text-right">
              {data.weighted_actual.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Milestone Form Modal ─────────────────────────────────────────────────────
const milestoneSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  anggaran: z.coerce.number().min(0, 'Anggaran tidak boleh negatif'),
  tgl_rencana_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tgl_rencana_selesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
  planned_persen: z.coerce.number().min(0).max(100, 'Maks 100%'),
})
type MilestoneFormData = z.infer<typeof milestoneSchema>

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm'

function MilestoneModal({
  proyekId,
  editItem,
  onClose,
}: {
  proyekId: string
  editItem?: Milestone
  onClose: () => void
}) {
  const createMilestone = useCreateMilestone(proyekId)
  const updateMilestone = useUpdateMilestone(proyekId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: editItem
      ? {
          nama: editItem.nama,
          anggaran: editItem.anggaran,
          tgl_rencana_mulai: editItem.tgl_rencana_mulai.slice(0, 10),
          tgl_rencana_selesai: editItem.tgl_rencana_selesai.slice(0, 10),
          planned_persen: editItem.planned_persen,
        }
      : { anggaran: 0, planned_persen: 0 },
  })

  const isPending = createMilestone.isPending || updateMilestone.isPending
  const isError = createMilestone.isError || updateMilestone.isError

  const onSubmit = async (data: MilestoneFormData) => {
    const input: MilestoneInput = {
      nama: data.nama,
      anggaran: data.anggaran,
      tgl_rencana_mulai: data.tgl_rencana_mulai,
      tgl_rencana_selesai: data.tgl_rencana_selesai,
      planned_persen: data.planned_persen,
    }
    if (editItem) {
      await updateMilestone.mutateAsync({ id: editItem.id, ...input })
    } else {
      await createMilestone.mutateAsync(input)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-text-dark font-semibold text-lg">
            {editItem ? 'Edit Milestone' : 'Tambah Milestone'}
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
              Gagal menyimpan milestone. Coba lagi.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Nama Milestone</label>
            <input {...register('nama')} className={inputCls} placeholder="Contoh: Pondasi Selesai" />
            {errors.nama && <p className="text-danger text-xs">{errors.nama.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Anggaran (Rp)</label>
            <input {...register('anggaran')} type="number" className={inputCls} />
            {errors.anggaran && <p className="text-danger text-xs">{errors.anggaran.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Tgl Rencana Mulai</label>
              <input {...register('tgl_rencana_mulai')} type="date" className={inputCls} />
              {errors.tgl_rencana_mulai && <p className="text-danger text-xs">{errors.tgl_rencana_mulai.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Tgl Rencana Selesai</label>
              <input {...register('tgl_rencana_selesai')} type="date" className={inputCls} />
              {errors.tgl_rencana_selesai && <p className="text-danger text-xs">{errors.tgl_rencana_selesai.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Bobot Rencana (%)</label>
            <input {...register('planned_persen')} type="number" min={0} max={100} step={0.1} className={inputCls} />
            {errors.planned_persen && <p className="text-danger text-xs">{errors.planned_persen.message}</p>}
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
              {isPending ? 'Menyimpan...' : (editItem ? 'Simpan' : 'Tambah')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main JadwalTab ───────────────────────────────────────────────────────────
export default function JadwalTab({ proyekId }: Props) {
  const { user } = useAuth()
  const { data: proyek } = useProyek(proyekId)
  const { data: milestones, isLoading } = useMilestoneList(proyekId)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editMilestone, setEditMilestone] = useState<Milestone | undefined>()

  const canManage = user?.role === 'owner' || user?.role === 'manajer'

  const handleEdit = (m: Milestone) => {
    setEditMilestone(m)
    setShowMilestoneModal(true)
  }

  const handleCloseModal = () => {
    setShowMilestoneModal(false)
    setEditMilestone(undefined)
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <ProgressSummaryCard proyekId={proyekId} />

      {/* Kurva S */}
      <KurvaSChart proyekId={proyekId} />

      {/* Gantt Chart */}
      {proyek && (
        <GanttChart
          milestones={milestones ?? []}
          proyekMulai={proyek.tgl_mulai}
          proyekSelesai={proyek.tgl_selesai}
        />
      )}

      {/* Milestone list header */}
      <div className="flex items-center justify-between">
        <h3 className="text-text-dark font-semibold text-base">Milestone</h3>
        {canManage && (
          <button
            onClick={() => { setEditMilestone(undefined); setShowMilestoneModal(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Milestone
          </button>
        )}
      </div>

      {/* Milestones */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!milestones || milestones.length === 0) && (
        <div className="bg-card-bg rounded-xl border border-border py-12 text-center">
          <p className="text-text-light text-sm">Belum ada milestone. Tambah milestone pertama!</p>
        </div>
      )}

      {!isLoading && milestones && milestones.length > 0 && (
        <div className="space-y-3">
          {milestones.map((m) => (
            <MilestoneCard
              key={m.id}
              proyekId={proyekId}
              milestone={m}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showMilestoneModal && (
        <MilestoneModal
          proyekId={proyekId}
          editItem={editMilestone}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
