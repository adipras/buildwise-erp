import { useState } from 'react'
import clsx from 'clsx'
import type { Milestone, StatusMilestone } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useProgressList, useDeleteMilestone } from '../../hooks/useJadwal'
import { formatTanggal } from '../../utils/format'
import ProgressUpdateModal from './ProgressUpdateModal'

interface Props {
  proyekId: string
  milestone: Milestone
  onEdit: (milestone: Milestone) => void
}

const STATUS_CONFIG: Record<StatusMilestone, { label: string; bg: string; text: string; pulse?: boolean }> = {
  belum_mulai:     { label: 'Belum Mulai',     bg: 'bg-border',          text: 'text-text-mid'  },
  sedang_berjalan: { label: 'Sedang Berjalan', bg: 'bg-badge-warning',   text: 'text-warning'   },
  selesai:         { label: 'Selesai',         bg: 'bg-badge-success',   text: 'text-success'   },
  terlambat:       { label: 'Terlambat',       bg: 'bg-badge-danger',    text: 'text-danger', pulse: true },
}

const BAR_COLOR: Record<StatusMilestone, string> = {
  belum_mulai:     'bg-text-light',
  sedang_berjalan: 'bg-primary',
  selesai:         'bg-success',
  terlambat:       'bg-danger',
}

export default function MilestoneCard({ proyekId, milestone, onEdit }: Props) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  const canManage = user?.role === 'owner' || user?.role === 'manajer'
  const deleteMilestone = useDeleteMilestone(proyekId)

  const { data: progressList, isLoading: isLoadingProgress } = useProgressList(
    proyekId,
    milestone.id,
  )

  const cfg = STATUS_CONFIG[milestone.status]

  const handleDelete = async () => {
    if (!confirm(`Hapus milestone "${milestone.nama}"?`)) return
    await deleteMilestone.mutateAsync(milestone.id)
  }

  return (
    <>
      <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-text-dark font-semibold text-sm truncate">{milestone.nama}</h3>
                <span
                  className={clsx(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    cfg.bg,
                    cfg.text,
                    cfg.pulse && 'animate-pulse',
                  )}
                >
                  {cfg.label}
                </span>
              </div>
              <p className="text-text-light text-xs mt-1">
                {formatTanggal(milestone.tgl_rencana_mulai)} – {formatTanggal(milestone.tgl_rencana_selesai)}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowProgress(true)}
                className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-medium transition-colors"
              >
                Update Progress
              </button>
              {canManage && (
                <>
                  <button
                    onClick={() => onEdit(milestone)}
                    className="p-1.5 rounded-lg border border-border text-text-mid hover:bg-light-bg transition-colors"
                    title="Edit milestone"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMilestone.isPending}
                    className="p-1.5 rounded-lg border border-danger/30 text-danger hover:bg-badge-danger transition-colors disabled:opacity-50"
                    title="Hapus milestone"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress bars */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-light w-14">Rencana</span>
              <div className="flex-1 bg-border rounded-full h-2">
                <div
                  className="bg-text-light h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, milestone.planned_persen)}%` }}
                />
              </div>
              <span className="text-xs text-text-mid w-10 text-right">{milestone.planned_persen.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-light w-14">Aktual</span>
              <div className="flex-1 bg-border rounded-full h-2">
                <div
                  className={clsx('h-2 rounded-full transition-all', BAR_COLOR[milestone.status])}
                  style={{ width: `${Math.min(100, milestone.actual_persen)}%` }}
                />
              </div>
              <span className="text-xs text-text-mid w-10 text-right">{milestone.actual_persen.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Expand riwayat */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2 border-t border-border text-xs text-text-light hover:bg-light-bg transition-colors"
        >
          <span>Riwayat Progress</span>
          <svg
            className={clsx('w-4 h-4 transition-transform', expanded && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
            {isLoadingProgress && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 bg-border rounded animate-pulse" />
                ))}
              </div>
            )}
            {!isLoadingProgress && (!progressList || progressList.length === 0) && (
              <p className="text-text-light text-xs text-center py-3">Belum ada riwayat progress</p>
            )}
            {progressList?.map((p) => (
              <div key={p.id} className="flex items-start gap-3 p-3 bg-light-bg rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent text-xs font-bold">{p.persen}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-dark text-xs font-medium">
                    {p.dibuat_oleh?.nama ?? 'Tim Proyek'}
                  </p>
                  {p.catatan && (
                    <p className="text-text-mid text-xs mt-0.5">{p.catatan}</p>
                  )}
                  <p className="text-text-light text-xs mt-0.5">{formatTanggal(p.created_at)}</p>
                  {p.foto && p.foto.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {p.foto.map((f) => (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          📷 Foto
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showProgress && (
        <ProgressUpdateModal
          proyekId={proyekId}
          milestone={milestone}
          onClose={() => setShowProgress(false)}
        />
      )}
    </>
  )
}
