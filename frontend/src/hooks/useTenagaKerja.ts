import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  Pekerja,
  PenugasanProyek,
  Absensi,
  RekapUpahResponse,
  PembayaranUpah,
  ApiResponse,
  ApiListResponse,
} from '../types'

// ─── Query Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  pekerjaList:      () => ['pekerja'] as const,
  pekerjaProyek:    (proyekId: string) => ['proyek', proyekId, 'pekerja'] as const,
  absensi:          (proyekId: string, tanggal: string) => ['proyek', proyekId, 'absensi', tanggal] as const,
  rekapUpah:        (proyekId: string, mulai: string, selesai: string) => ['proyek', proyekId, 'rekap-upah', mulai, selesai] as const,
  pembayaranList:   (proyekId: string) => ['proyek', proyekId, 'upah'] as const,
}

// ─── Master Pekerja ───────────────────────────────────────────────────────────
export function usePekerjaList() {
  return useQuery({
    queryKey: KEYS.pekerjaList(),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Pekerja>>('/pekerja')
      return data.data
    },
  })
}

export interface PekerjaInput {
  nama: string
  telepon?: string
  tipe: 'mandor' | 'tukang' | 'kuli'
  upah_harian: number
}

export function useCreatePekerja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PekerjaInput) => {
      const { data } = await api.post<ApiResponse<Pekerja>>('/pekerja', input)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.pekerjaList() }),
  })
}

export function useDeletePekerja() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pekerja/${id}`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.pekerjaList() }),
  })
}

// ─── Penugasan ────────────────────────────────────────────────────────────────
export function usePekerjaProyek(proyekId: string) {
  return useQuery({
    queryKey: KEYS.pekerjaProyek(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<PenugasanProyek>>(`/proyek/${proyekId}/pekerja`)
      return data.data
    },
    enabled: !!proyekId,
  })
}

export function useAssignPekerja(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pekerjaId: string) => {
      const { data } = await api.post<ApiResponse<PenugasanProyek>>(
        `/proyek/${proyekId}/pekerja`,
        { pekerja_id: pekerjaId },
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.pekerjaProyek(proyekId) }),
  })
}

export function useUnassignPekerja(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pekerjaId: string) => {
      await api.delete(`/proyek/${proyekId}/pekerja/${pekerjaId}`)
      return pekerjaId
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.pekerjaProyek(proyekId) }),
  })
}

// ─── Absensi ──────────────────────────────────────────────────────────────────
export function useAbsensi(proyekId: string, tanggal: string) {
  return useQuery({
    queryKey: KEYS.absensi(proyekId, tanggal),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Absensi>>(
        `/proyek/${proyekId}/absensi?tanggal=${tanggal}`,
      )
      return data.data
    },
    enabled: !!proyekId && !!tanggal,
  })
}

export interface AbsensiItemInput {
  pekerja_id: string
  status: 'hadir' | 'setengah_hari' | 'lembur' | 'tidak_hadir'
  jam_kerja?: number
}

export interface InputAbsensiPayload {
  tanggal: string
  absensi: AbsensiItemInput[]
}

export function useInputAbsensi(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: InputAbsensiPayload) => {
      const { data } = await api.post<ApiListResponse<Absensi>>(
        `/proyek/${proyekId}/absensi`,
        payload,
      )
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.absensi(proyekId, vars.tanggal) })
    },
  })
}

// ─── Rekap Upah ───────────────────────────────────────────────────────────────
export function useRekapUpah(proyekId: string, mulai: string, selesai: string) {
  return useQuery({
    queryKey: KEYS.rekapUpah(proyekId, mulai, selesai),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RekapUpahResponse>>(
        `/proyek/${proyekId}/rekap-upah?mulai=${mulai}&selesai=${selesai}`,
      )
      return data.data
    },
    enabled: !!proyekId && !!mulai && !!selesai,
  })
}

export interface ApproveBayarInput {
  periode_mulai: string
  periode_selesai: string
  pekerja_ids?: string[]
}

export function useApproveBayar(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ApproveBayarInput) => {
      const { data } = await api.post<ApiListResponse<PembayaranUpah>>(
        `/proyek/${proyekId}/upah/approve-bayar`,
        input,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pembayaranList(proyekId) })
      // Invalidate pengeluaran juga karena otomatis dibuat
      qc.invalidateQueries({ queryKey: ['proyek', proyekId, 'pengeluaran'] })
    },
  })
}

export function usePembayaranUpah(proyekId: string) {
  return useQuery({
    queryKey: KEYS.pembayaranList(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<PembayaranUpah>>(
        `/proyek/${proyekId}/upah`,
      )
      return data.data
    },
    enabled: !!proyekId,
  })
}
