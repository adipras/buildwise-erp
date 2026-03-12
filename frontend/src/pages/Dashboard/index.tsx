import { useNavigate } from 'react-router-dom'
import {
  useDashboardOverview,
  type DashProyekSummary,
  type AlertMilestone,
  type AlertStokKritis,
} from '../../hooks/useDashboard'
import { formatRupiah, formatRupiahShort } from '../../utils/format'

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = 'primary',
  icon,
}: {
  label: string
  value: string
  sub?: string
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent'
  icon: React.ReactNode
}) {
  const bgMap = {
    primary: 'bg-primary/10',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    danger: 'bg-danger/10',
    accent: 'bg-accent/10',
  }
  const textMap = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    accent: 'text-accent',
  }
  return (
    <div className="bg-card-bg rounded-xl border border-border p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgMap[color]}`}>
        <span className={textMap[color]}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-light mb-0.5">{label}</p>
        <p className="text-text-dark font-bold text-xl leading-none">{value}</p>
        {sub && <p className="text-xs text-text-mid mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    aktif: { label: 'Aktif', cls: 'bg-badge-success text-success' },
    terlambat: { label: 'Terlambat', cls: 'bg-badge-danger text-danger' },
    selesai: { label: 'Selesai', cls: 'bg-badge-success text-success' },
    ditunda: { label: 'Ditunda', cls: 'bg-badge-warning text-accent' },
    perencanaan: { label: 'Perencanaan', cls: 'bg-border text-text-mid' },
  }
  const cfg = map[status] ?? { label: status, cls: 'bg-border text-text-mid' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function ProyekRow({ p }: { p: DashProyekSummary }) {
  const navigate = useNavigate()
  const pctBurn = p.total_rab > 0 ? (p.total_pengeluaran / p.total_rab) * 100 : 0
  const isOverBudget = pctBurn > 100
  const barProgress = `${Math.min(p.pct_progress, 100).toFixed(0)}%`
  const barBurn = `${Math.min(pctBurn, 100).toFixed(0)}%`

  return (
    <div
      className="bg-card-bg rounded-xl border border-border p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
      onClick={() => navigate(`/proyek/${p.id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-text-dark font-semibold text-sm leading-snug line-clamp-1">{p.nama}</p>
          <p className="text-xs text-text-light mt-0.5">
            {p.tgl_mulai} → {p.tgl_selesai}
          </p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      {/* Progress fisik */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-text-mid mb-1">
          <span>Progress Fisik</span>
          <span className="font-medium text-primary">{p.pct_progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-light-bg rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: barProgress }}
          />
        </div>
      </div>

      {/* Penyerapan anggaran */}
      <div>
        <div className="flex justify-between text-xs text-text-mid mb-1">
          <span>Penyerapan Anggaran</span>
          <span className={`font-medium ${isOverBudget ? 'text-danger' : 'text-accent'}`}>
            {pctBurn.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-light-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-danger' : 'bg-accent'}`}
            style={{ width: barBurn }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div>
          <p className="text-xs text-text-light">RAB</p>
          <p className="text-xs font-semibold text-text-dark">{formatRupiahShort(p.total_rab)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-light">Realisasi</p>
          <p className={`text-xs font-semibold ${isOverBudget ? 'text-danger' : 'text-text-dark'}`}>
            {formatRupiahShort(p.total_pengeluaran)}
          </p>
        </div>
      </div>
    </div>
  )
}

function AlertMilestoneCard({ alerts }: { alerts: AlertMilestone[] }) {
  const navigate = useNavigate()
  if (alerts.length === 0) return null
  return (
    <div className="bg-badge-danger rounded-xl border border-danger/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p className="text-danger font-semibold text-sm">Milestone Terlambat ({alerts.length})</p>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((a) => (
          <div
            key={a.milestone_id}
            className="bg-white/70 rounded-lg p-3 cursor-pointer hover:bg-white transition-colors"
            onClick={() => navigate(`/proyek/${a.proyek_id}`)}
          >
            <p className="text-xs font-medium text-text-dark line-clamp-1">{a.milestone_nama}</p>
            <p className="text-xs text-text-mid">{a.proyek_nama} · Target: {a.tgl_rencana_selesai}</p>
            <div className="flex gap-3 mt-1.5 text-xs">
              <span className="text-text-light">Rencana: <span className="text-text-mid font-medium">{a.planned_persen.toFixed(0)}%</span></span>
              <span className="text-danger">Aktual: <span className="font-medium">{a.actual_persen.toFixed(0)}%</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlertStokCard({ alerts }: { alerts: AlertStokKritis[] }) {
  const navigate = useNavigate()
  if (alerts.length === 0) return null
  return (
    <div className="bg-badge-warning rounded-xl border border-warning/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-accent font-semibold text-sm">Stok Material Kritis ({alerts.length})</p>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((a) => (
          <div
            key={`${a.proyek_id}-${a.material_id}`}
            className="bg-white/70 rounded-lg p-3 cursor-pointer hover:bg-white transition-colors"
            onClick={() => navigate(`/proyek/${a.proyek_id}`)}
          >
            <p className="text-xs font-medium text-text-dark line-clamp-1">{a.material_nama}</p>
            <p className="text-xs text-text-mid">{a.proyek_nama}</p>
            <p className="text-xs mt-0.5">
              <span className="text-danger font-medium">{a.stok_sisa.toFixed(2)} {a.satuan}</span>
              <span className="text-text-light"> / min {a.stok_minimum.toFixed(2)} {a.satuan}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useDashboardOverview()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-mid text-sm">Memuat dashboard…</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-danger font-semibold mb-2">Gagal memuat dashboard</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-primary hover:underline"
          >
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  const sisaAnggaran = data.total_rab - data.total_pengeluaran
  const pctSerap = data.total_rab > 0 ? (data.total_pengeluaran / data.total_rab) * 100 : 0
  const hasAlerts = data.alert_milestone.length > 0 || data.alert_stok_kritis.length > 0

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-dark font-bold text-xl">Dashboard</h1>
          <p className="text-text-mid text-sm mt-0.5">Ringkasan seluruh proyek aktif</p>
        </div>
        <button
          onClick={() => navigate('/proyek/baru')}
          className="hidden sm:flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Proyek Baru
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Proyek Aktif"
          value={`${data.total_proyek_aktif}`}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="Total RAB"
          value={formatRupiahShort(data.total_rab)}
          sub={formatRupiah(data.total_rab)}
          color="accent"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Total Realisasi"
          value={formatRupiahShort(data.total_pengeluaran)}
          sub={`${pctSerap.toFixed(1)}% terserap`}
          color={pctSerap > 90 ? 'danger' : 'success'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Sisa Anggaran"
          value={formatRupiahShort(Math.abs(sisaAnggaran))}
          sub={sisaAnggaran < 0 ? '⚠ Over budget' : 'tersedia'}
          color={sisaAnggaran < 0 ? 'danger' : 'success'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Alert Panel */}
      {hasAlerts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlertMilestoneCard alerts={data.alert_milestone} />
          <AlertStokCard alerts={data.alert_stok_kritis} />
        </div>
      )}

      {/* Daftar Proyek */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-dark font-semibold text-base">Proyek Aktif</h2>
          <button
            onClick={() => navigate('/proyek')}
            className="text-sm text-primary hover:underline"
          >
            Lihat semua →
          </button>
        </div>

        {data.proyek.length === 0 ? (
          <div className="bg-card-bg rounded-xl border border-border p-10 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            <p className="text-text-mid text-sm mb-4">Belum ada proyek aktif</p>
            <button
              onClick={() => navigate('/proyek')}
              className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy transition-colors"
            >
              Buat Proyek Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.proyek.map((p) => (
              <ProyekRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-text-light mb-3 font-medium uppercase tracking-wide">Aksi Cepat</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Kelola Proyek', path: '/proyek' },
            { label: 'Data Pekerja', path: '/pekerja' },
            { label: 'Master Material', path: '/material' },
            { label: 'Data Supplier', path: '/supplier' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="text-xs text-text-mid border border-border rounded-lg px-3 py-1.5 hover:border-primary hover:text-primary transition-colors bg-card-bg"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
