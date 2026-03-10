import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Proyek, RabItem, Pengeluaran, ApiResponse, ApiListResponse } from '../types'

// ─── Query Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  proyekList: ['proyek'] as const,
  proyek: (id: string) => ['proyek', id] as const,
  rabList: (proyekId: string) => ['proyek', proyekId, 'rab'] as const,
  pengeluaranList: (proyekId: string) => ['proyek', proyekId, 'pengeluaran'] as const,
}

// ─── Queries ─────────────────────────────────────────────────────────────────
export function useProyekList() {
  return useQuery({
    queryKey: KEYS.proyekList,
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Proyek>>('/proyek')
      return data.data
    },
  })
}

export function useProyek(id: string) {
  return useQuery({
    queryKey: KEYS.proyek(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Proyek>>(`/proyek/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useRabList(proyekId: string) {
  return useQuery({
    queryKey: KEYS.rabList(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<RabItem>>(`/proyek/${proyekId}/rab`)
      return data.data
    },
    enabled: !!proyekId,
  })
}

export function usePengeluaranList(proyekId: string) {
  return useQuery({
    queryKey: KEYS.pengeluaranList(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Pengeluaran>>(`/proyek/${proyekId}/pengeluaran`)
      return data.data
    },
    enabled: !!proyekId,
  })
}

// ─── Proyek Mutations ────────────────────────────────────────────────────────
export interface CreateProyekInput {
  nama: string
  alamat: string
  nilai_kontrak: number
  tgl_mulai: string
  tgl_selesai: string
  manajer_id?: string
}

export function useCreateProyek() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateProyekInput) => {
      const { data } = await api.post<ApiResponse<Proyek>>('/proyek', input)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.proyekList })
    },
  })
}

export function useUpdateProyek() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: CreateProyekInput & { id: string }) => {
      const { data } = await api.put<ApiResponse<Proyek>>(`/proyek/${id}`, input)
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.proyekList })
      qc.invalidateQueries({ queryKey: KEYS.proyek(vars.id) })
    },
  })
}

export function useDeleteProyek() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/proyek/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.proyekList })
    },
  })
}

// ─── RAB Mutations ───────────────────────────────────────────────────────────
export interface RabItemInput {
  kode: string
  nama: string
  volume: number
  satuan: string
  harga_satuan: number
}

export function useCreateRabItem(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RabItemInput) => {
      const { data } = await api.post<ApiResponse<RabItem>>(`/proyek/${proyekId}/rab`, input)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.rabList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.proyek(proyekId) })
    },
  })
}

export function useUpdateRabItem(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: RabItemInput & { id: string }) => {
      const { data } = await api.put<ApiResponse<RabItem>>(`/proyek/${proyekId}/rab/${id}`, input)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.rabList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.proyek(proyekId) })
    },
  })
}

export function useDeleteRabItem(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/proyek/${proyekId}/rab/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.rabList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.proyek(proyekId) })
    },
  })
}

export function useLockRab(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ message: string }>>(
        `/proyek/${proyekId}/rab/lock`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.rabList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.proyek(proyekId) })
    },
  })
}

// ─── Pengeluaran Mutations ───────────────────────────────────────────────────
export interface PengeluaranInput {
  rab_item_id?: string
  kategori: string
  deskripsi: string
  jumlah: number
  tgl_pengeluaran: string
}

export function useCreatePengeluaran(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PengeluaranInput) => {
      const { data } = await api.post<ApiResponse<Pengeluaran>>(
        `/proyek/${proyekId}/pengeluaran`,
        input,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pengeluaranList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.rabList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.proyek(proyekId) })
    },
  })
}

export function useDeletePengeluaran(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/proyek/${proyekId}/pengeluaran/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pengeluaranList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.rabList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.proyek(proyekId) })
    },
  })
}
