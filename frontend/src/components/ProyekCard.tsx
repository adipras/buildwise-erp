import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import type { Proyek, StatusProyek } from '../types'
import { formatRupiah, formatTanggal } from '../utils/format'

interface Props {
  proyek: Proyek
}

const STATUS_CONFIG: Record<StatusProyek, { label: string; bg: string; text: string }> = {
  aktif:    { label: 'Aktif',    bg: 'bg-badge-success', text: 'text-success' },
  selesai:  { label: 'Selesai',  bg: 'bg-badge-success', text: 'text-success' },
  terlambat:{ label: 'Terlambat',bg: 'bg-badge-danger',  text: 'text-danger'  },
  arsip:    { label: 'Arsip',    bg: 'bg-border',         text: 'text-text-mid'},
}

export default function ProyekCard({ proyek }: Props) {
  const navigate = useNavigate()
  const status = STATUS_CONFIG[proyek.status] ?? STATUS_CONFIG.aktif

  const persen = proyek.persen_realisasi ?? 0
  const alertLevel = proyek.alert_level ?? 'normal'

  const barColor = alertLevel === 'danger'
    ? 'bg-danger'
    : alertLevel === 'warning'
    ? 'bg-warning'
    : 'bg-success'

  return (
    <div
      onClick={() => navigate(`/proyek/${proyek.id}`)}
      className="bg-card-bg rounded-xl border border-border p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-text-dark font-semibold text-sm leading-snug line-clamp-2">
          {proyek.nama}
        </h3>
        <span
          className={clsx(
            'shrink-0 text-xs font-medium px-2 py-0.5 rounded-full',
            status.bg,
            status.text,
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Nilai kontrak */}
      <div>
        <p className="text-xs text-text-light mb-0.5">Nilai Kontrak</p>
        <p className="text-primary font-bold text-base">{formatRupiah(proyek.nilai_kontrak)}</p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-text-mid">Realisasi</span>
          <span
            className={clsx(
              'text-xs font-semibold',
              alertLevel === 'danger' ? 'text-danger' :
              alertLevel === 'warning' ? 'text-warning' : 'text-success',
            )}
          >
            {persen.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-light-bg rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all', barColor)}
            style={{ width: `${Math.min(persen, 100)}%` }}
          />
        </div>
      </div>

      {/* Tanggal */}
      <div className="flex items-center gap-1.5 text-xs text-text-mid">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{formatTanggal(proyek.tgl_mulai)}</span>
        <span>—</span>
        <span>{formatTanggal(proyek.tgl_selesai)}</span>
      </div>

      {/* Manajer */}
      {proyek.manajer && (
        <div className="flex items-center gap-1.5 text-xs text-text-mid">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{proyek.manajer.nama}</span>
        </div>
      )}
    </div>
  )
}
