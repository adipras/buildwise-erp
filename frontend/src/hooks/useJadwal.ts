import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type {
  Milestone,
  ProgressUpdate,
  KurvaSPoint,
  ProgressSummary,
  ApiResponse,
  ApiListResponse,
} from '../types'

// ─── Query Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  milestoneList:   (proyekId: string) => ['proyek', proyekId, 'milestone'] as const,
  milestone:       (proyekId: string, milestoneId: string) => ['proyek', proyekId, 'milestone', milestoneId] as const,
  progressList:    (proyekId: string, milestoneId: string) => ['proyek', proyekId, 'milestone', milestoneId, 'progress'] as const,
  kurvaS:          (proyekId: string) => ['proyek', proyekId, 'kurva-s'] as const,
  progressSummary: (proyekId: string) => ['proyek', proyekId, 'progress-summary'] as const,
}

// ─── Queries ─────────────────────────────────────────────────────────────────
export function useMilestoneList(proyekId: string) {
  return useQuery({
    queryKey: KEYS.milestoneList(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Milestone>>(`/proyek/${proyekId}/milestone`)
      return data.data
    },
    enabled: !!proyekId,
  })
}

export function useMilestone(proyekId: string, milestoneId: string) {
  return useQuery({
    queryKey: KEYS.milestone(proyekId, milestoneId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Milestone>>(`/proyek/${proyekId}/milestone/${milestoneId}`)
      return data.data
    },
    enabled: !!proyekId && !!milestoneId,
  })
}

export function useProgressList(proyekId: string, milestoneId: string) {
  return useQuery({
    queryKey: KEYS.progressList(proyekId, milestoneId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<ProgressUpdate>>(`/proyek/${proyekId}/milestone/${milestoneId}/progress`)
      return data.data
    },
    enabled: !!proyekId && !!milestoneId,
  })
}

export function useKurvaS(proyekId: string) {
  return useQuery({
    queryKey: KEYS.kurvaS(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<KurvaSPoint>>(`/proyek/${proyekId}/kurva-s`)
      return data.data
    },
    enabled: !!proyekId,
  })
}

export function useProgressSummary(proyekId: string) {
  return useQuery({
    queryKey: KEYS.progressSummary(proyekId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProgressSummary>>(`/proyek/${proyekId}/progress-summary`)
      return data.data
    },
    enabled: !!proyekId,
  })
}

// ─── Milestone Mutations ─────────────────────────────────────────────────────
export interface MilestoneInput {
  nama: string
  anggaran: number
  tgl_rencana_mulai: string
  tgl_rencana_selesai: string
  planned_persen: number
}

export function useCreateMilestone(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: MilestoneInput) => {
      const { data } = await api.post<ApiResponse<Milestone>>(`/proyek/${proyekId}/milestone`, input)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.milestoneList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.progressSummary(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.kurvaS(proyekId) })
    },
  })
}

export function useUpdateMilestone(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: MilestoneInput & { id: string }) => {
      const { data } = await api.put<ApiResponse<Milestone>>(`/proyek/${proyekId}/milestone/${id}`, input)
      return data.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.milestoneList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.milestone(proyekId, vars.id) })
      qc.invalidateQueries({ queryKey: KEYS.progressSummary(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.kurvaS(proyekId) })
    },
  })
}

export function useDeleteMilestone(proyekId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (milestoneId: string) => {
      await api.delete(`/proyek/${proyekId}/milestone/${milestoneId}`)
      return milestoneId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.milestoneList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.progressSummary(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.kurvaS(proyekId) })
    },
  })
}

// ─── Progress Mutations ───────────────────────────────────────────────────────
export interface ProgressInput {
  persen: number
  catatan?: string
  foto_urls?: string[]
}

export function useCreateProgress(proyekId: string, milestoneId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProgressInput) => {
      const { data } = await api.post<ApiResponse<ProgressUpdate>>(
        `/proyek/${proyekId}/milestone/${milestoneId}/progress`,
        input,
      )
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.progressList(proyekId, milestoneId) })
      qc.invalidateQueries({ queryKey: KEYS.milestoneList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.milestone(proyekId, milestoneId) })
      qc.invalidateQueries({ queryKey: KEYS.progressSummary(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.kurvaS(proyekId) })
    },
  })
}

export function useDeleteProgress(proyekId: string, milestoneId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (progressId: string) => {
      await api.delete(`/proyek/${proyekId}/milestone/${milestoneId}/progress/${progressId}`)
      return progressId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.progressList(proyekId, milestoneId) })
      qc.invalidateQueries({ queryKey: KEYS.milestoneList(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.milestone(proyekId, milestoneId) })
      qc.invalidateQueries({ queryKey: KEYS.progressSummary(proyekId) })
      qc.invalidateQueries({ queryKey: KEYS.kurvaS(proyekId) })
    },
  })
}
