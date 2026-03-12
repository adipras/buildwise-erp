import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashProyekSummary {
  id: string
  nama: string
  status: string
  tgl_mulai: string
  tgl_selesai: string
  nilai_kontrak: number
  total_rab: number
  total_pengeluaran: number
  pct_progress: number
}

export interface AlertMilestone {
  proyek_id: string
  proyek_nama: string
  milestone_id: string
  milestone_nama: string
  planned_persen: number
  actual_persen: number
  tgl_rencana_selesai: string
}

export interface AlertStokKritis {
  proyek_id: string
  proyek_nama: string
  material_id: string
  material_nama: string
  stok_sisa: number
  stok_minimum: number
  satuan: string
}

export interface DashboardOverview {
  total_proyek_aktif: number
  total_rab: number
  total_pengeluaran: number
  proyek: DashProyekSummary[]
  alert_milestone: AlertMilestone[]
  alert_stok_kritis: AlertStokKritis[]
}

export interface KategoriSummary {
  kategori: string
  total: number
}

export interface ProyekDetailDashboard {
  proyek_id: string
  nama: string
  status: string
  nilai_kontrak: number
  total_rab: number
  total_pengeluaran: number
  sisa_anggaran: number
  pct_progress: number
  jumlah_pekerja_aktif: number
  stok_kritis: AlertStokKritis[]
  milestone_terlambat: AlertMilestone[]
  pengeluaran_per_kategori: KategoriSummary[]
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

const KEYS = {
  overview: ['dashboard', 'overview'] as const,
  proyekDashboard: (id: string) => ['dashboard', 'proyek', id] as const,
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useDashboardOverview() {
  return useQuery({
    queryKey: KEYS.overview,
    queryFn: async () => {
      const { data } = await api.get<DashboardOverview>('/dashboard/overview')
      return data
    },
    staleTime: 60_000,
  })
}

export function useProyekDashboard(proyekId: string) {
  return useQuery({
    queryKey: KEYS.proyekDashboard(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ProyekDetailDashboard>(`/dashboard/proyek/${proyekId}`)
      return data
    },
    enabled: !!proyekId,
  })
}
