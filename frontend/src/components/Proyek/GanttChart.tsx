import { useState } from 'react'
import clsx from 'clsx'
import type { Milestone, StatusMilestone } from '../../types'
import { formatTanggal } from '../../utils/format'

interface Props {
  milestones: Milestone[]
  proyekMulai: string
  proyekSelesai: string
}

const STATUS_COLOR: Record<StatusMilestone, string> = {
  belum_mulai:     'bg-text-light',
  sedang_berjalan: 'bg-primary',
  selesai:         'bg-success',
  terlambat:       'bg-danger',
}

const STATUS_LABEL: Record<StatusMilestone, string> = {
  belum_mulai:     'Belum Mulai',
  sedang_berjalan: 'Sedang Berjalan',
  selesai:         'Selesai',
  terlambat:       'Terlambat',
}

function dateMs(d: string) {
  return new Date(d).getTime()
}

interface TooltipData {
  milestone: Milestone
  x: number
  y: number
}

export default function GanttChart({ milestones, proyekMulai, proyekSelesai }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const startMs = dateMs(proyekMulai)
  const endMs = dateMs(proyekSelesai)
  const totalMs = endMs - startMs || 1

  const todayMs = Date.now()
  const todayPct = Math.min(100, Math.max(0, ((todayMs - startMs) / totalMs) * 100))

  if (milestones.length === 0) {
    return (
      <div className="bg-card-bg rounded-xl border border-border p-5">
        <h3 className="text-text-dark font-semibold text-base mb-2">Gantt Chart</h3>
        <p className="text-text-light text-sm text-center py-10">Belum ada milestone</p>
      </div>
    )
  }

  return (
    <div className="bg-card-bg rounded-xl border border-border p-5">
      <h3 className="text-text-dark font-semibold text-base mb-1">Gantt Chart</h3>
      <div className="flex items-center gap-4 text-xs text-text-light mb-4 flex-wrap">
        <span>{formatTanggal(proyekMulai)}</span>
        <span className="flex-1 h-px bg-border" />
        <span>{formatTanggal(proyekSelesai)}</span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: '600px' }}>
          {/* Today line (relative container) */}
          <div className="relative">
            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none"
              style={{ left: `${todayPct}%` }}
            >
              <div className="w-px h-full bg-danger opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #E74C3C 0, #E74C3C 6px, transparent 6px, transparent 10px)' }} />
              <span className="absolute -top-5 -translate-x-1/2 text-xs text-danger font-medium whitespace-nowrap">Hari Ini</span>
            </div>

            <div className="space-y-2 mt-6">
              {milestones.map((m) => {
                const barStartMs = dateMs(m.tgl_rencana_mulai)
                const barEndMs = dateMs(m.tgl_rencana_selesai)
                const left = Math.max(0, ((barStartMs - startMs) / totalMs) * 100)
                const width = Math.min(100 - left, ((barEndMs - barStartMs) / totalMs) * 100)

                return (
                  <div key={m.id} className="relative h-9 flex items-center">
                    {/* Label */}
                    <div
                      className="absolute inset-0 flex items-center"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <div
                        className={clsx(
                          'w-full h-7 rounded-md flex items-center px-2 cursor-pointer transition-opacity hover:opacity-90 relative',
                          STATUS_COLOR[m.status],
                          m.status === 'terlambat' && 'animate-pulse',
                        )}
                        onMouseEnter={(e) =>
                          setTooltip({
                            milestone: m,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }
                        onMouseLeave={() => setTooltip(null)}
                        onMouseMove={(e) =>
                          setTooltip((prev) =>
                            prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
                          )
                        }
                      >
                        <span className="text-white text-xs font-medium truncate">{m.nama}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-text-dark text-white text-xs rounded-lg shadow-lg px-3 py-2 pointer-events-none max-w-xs"
          style={{ top: tooltip.y + 12, left: tooltip.x + 8 }}
        >
          <p className="font-semibold mb-1">{tooltip.milestone.nama}</p>
          <p>{formatTanggal(tooltip.milestone.tgl_rencana_mulai)} – {formatTanggal(tooltip.milestone.tgl_rencana_selesai)}</p>
          <p>Status: {STATUS_LABEL[tooltip.milestone.status]}</p>
          <p>Aktual: {tooltip.milestone.actual_persen.toFixed(1)}%</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {(Object.entries(STATUS_COLOR) as [StatusMilestone, string][]).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={clsx('w-3 h-3 rounded-sm', color)} />
            <span className="text-xs text-text-mid">{STATUS_LABEL[status]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-px h-4 bg-danger" />
          <span className="text-xs text-text-mid">Hari Ini</span>
        </div>
      </div>
    </div>
  )
}
