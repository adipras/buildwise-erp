import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  Material,
  Supplier,
  StokInfo,
  PurchaseOrder,
  PenggunaanMaterial,
  ApiResponse,
  ApiListResponse,
} from '../types'

// ─── Query Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  materialList:   () => ['material'] as const,
  supplierList:   () => ['supplier'] as const,
  stokList:       (proyekId: string) => ['proyek', proyekId, 'stok'] as const,
  poList:         (proyekId: string) => ['proyek', proyekId, 'po'] as const,
  po:             (proyekId: string, poId: string) => ['proyek', proyekId, 'po', poId] as const,
  penggunaanList: (proyekId: string) => ['proyek', proyekId, 'stok', 'penggunaan'] as const,
}

// ─── Material ─────────────────────────────────────────────────────────────────
export function useMaterialList() {
  return useQuery({
    queryKey: KEYS.materialList(),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Material>>('/material')
      return data.data
    },
  })
}

export interface MaterialInput {
  nama: string
  satuan: string
  harga_satuan: number
  keterangan?: string
}

export function useCreateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: MaterialInput) => {
      const { data } = await api.post<ApiResponse<Material>>('/material', input)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.materialList() }),
  })
}

export function useDeleteMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/material/${id}`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.materialList() }),
  })
}

// ─── Supplier ─────────────────────────────────────────────────────────────────
export function useSupplierList() {
  return useQuery({
    queryKey: KEYS.supplierList(),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Supplier>>('/supplier')
      return data.data
    },
  })
}

export interface SupplierInput {
  nama: string
  telepon?: string
  alamat?: string
  kontak?: string
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SupplierInput) => {
      const { data } = await api.post<ApiResponse<Supplier>>('/supplier', input)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.supplierList() }),
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/supplier/${id}`)
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.supplierList() }),
  })
}

// ─── Stok ────────────────────────────────────────────────────────────────────
export function useStokList(proyekId: string) {
  return useQuery({
    queryKey: KEYS.stokList(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<StokInfo>>(`/proyek/${proyekId}/stok`)
      return data.data
    },
    enabled: !!proyekId,
  })
}

export interface PakaiMaterialInput {
  material_id: string
  qty: number
  keterangan?: string
  tgl_pakai?: string
}

export function usePakaiMaterial(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PakaiMaterialInput) => {
      const { data } = await api.post<ApiResponse<PenggunaanMaterial>>(
        `/proyek/${proyekId}/stok/pakai`,
        input,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.stokList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.penggunaanList(proyekId) })
    },
  })
}

export function usePenggunaanList(proyekId: string) {
  return useQuery({
    queryKey: KEYS.penggunaanList(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<PenggunaanMaterial>>(
        `/proyek/${proyekId}/stok/penggunaan`,
      )
      return data.data
    },
    enabled: !!proyekId,
  })
}

// ─── Purchase Order ───────────────────────────────────────────────────────────
export function usePOList(proyekId: string) {
  return useQuery({
    queryKey: KEYS.poList(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<PurchaseOrder>>(`/proyek/${proyekId}/po`)
      return data.data
    },
    enabled: !!proyekId,
  })
}

export function usePO(proyekId: string, poId: string) {
  return useQuery({
    queryKey: KEYS.po(proyekId, poId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PurchaseOrder>>(
        `/proyek/${proyekId}/po/${poId}`,
      )
      return data.data
    },
    enabled: !!proyekId && !!poId,
  })
}

export interface PoItemInput {
  material_id: string
  qty_dipesan: number
  harga_satuan: number
}

export interface CreatePoInput {
  supplier_id: string
  nomor_po?: string
  tgl_po?: string
  items: PoItemInput[]
}

export function useCreatePO(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePoInput) => {
      const { data } = await api.post<ApiResponse<PurchaseOrder>>(
        `/proyek/${proyekId}/po`,
        input,
      )
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.poList(proyekId) }),
  })
}

export function useTerimaPO(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (poId: string) => {
      const { data } = await api.post<ApiResponse<PurchaseOrder>>(
        `/proyek/${proyekId}/po/${poId}/terima`,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.poList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.stokList(proyekId) })
    },
  })
}

export function useDeletePO(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (poId: string) => {
      await api.delete(`/proyek/${proyekId}/po/${poId}`)
      return poId
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.poList(proyekId) }),
  })
}
