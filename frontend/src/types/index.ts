export type Role = 'owner' | 'manajer' | 'mandor' | 'admin_keuangan'

export interface User {
  id: string
  nama: string
  email: string
  role: Role
  telepon: string
  is_aktif: boolean
  perusahaan_id: string
  created_at: string
}

export type StatusProyek = 'aktif' | 'selesai' | 'terlambat' | 'arsip'

export interface Proyek {
  id: string
  nama: string
  alamat: string
  nilai_kontrak: number
  tgl_mulai: string
  tgl_selesai: string
  status: StatusProyek
  manajer_id: string
  manajer?: User
  perusahaan_id: string
  created_at: string
}

export type StatusRab = 'draft' | 'locked'

export interface RabItem {
  id: string
  proyek_id: string
  kode: string
  nama: string
  volume: number
  satuan: string
  harga_satuan: number
  total_anggaran: number
  status: StatusRab
}

export type StatusMilestone = 'belum_mulai' | 'sedang_berjalan' | 'selesai' | 'terlambat'

export interface Milestone {
  id: string
  proyek_id: string
  nama: string
  anggaran: number
  tgl_rencana_mulai: string
  tgl_rencana_selesai: string
  planned_persen: number
  actual_persen: number
  status: StatusMilestone
}

export type StatusAbsensi = 'hadir' | 'setengah_hari' | 'lembur' | 'tidak_hadir'
export type TipePekerja = 'mandor' | 'tukang' | 'kuli'

export interface Pekerja {
  id: string
  nama: string
  telepon: string
  tipe: TipePekerja
  upah_harian: number
  is_aktif: boolean
  perusahaan_id: string
}

export interface Notifikasi {
  id: string
  user_id: string
  proyek_id?: string
  tipe: string
  judul: string
  pesan: string
  is_read: boolean
  is_sent_wa: boolean
  created_at: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiListResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
