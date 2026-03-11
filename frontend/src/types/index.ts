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
  total_rab?: number
  total_realisasi?: number
  persen_realisasi?: number
  alert_level?: AlertLevel
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
  total_realisasi?: number
  persen_realisasi?: number
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

export type AlertLevel = 'normal' | 'warning' | 'danger'

export interface Pengeluaran {
  id: string
  proyek_id: string
  rab_item_id?: string
  rab_item?: RabItem
  kategori: string
  deskripsi: string
  jumlah: number
  tgl_pengeluaran: string
  dibuat_oleh?: User
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

export interface FotoProgress {
  id: string
  progress_id: string
  url: string
  created_at: string
}

export interface ProgressUpdate {
  id: string
  milestone_id: string
  proyek_id: string
  persen: number
  catatan?: string
  foto?: FotoProgress[]
  dibuat_oleh?: User
  created_at: string
}

export interface KurvaSPoint {
  minggu: number
  tanggal: string
  plan_kumulatif: number
  aktual_kumulatif: number
}

export interface ProgressSummary {
  weighted_actual: number
  weighted_planned: number
  is_late: boolean
}

// ─── Material & Stok ──────────────────────────────────────────────────────────

export interface Material {
  id: string
  nama: string
  satuan: string
  harga_satuan: number
  keterangan: string
  perusahaan_id: string
  created_at: string
}

export interface Supplier {
  id: string
  nama: string
  telepon: string
  alamat: string
  kontak: string
  perusahaan_id: string
  created_at: string
}

export type StatusPO = 'draft' | 'dikirim' | 'diterima' | 'batal'

export interface PoItem {
  id: string
  purchase_order_id: string
  material_id: string
  material?: Material
  qty_dipesan: number
  qty_diterima: number
  harga_satuan: number
}

export interface PurchaseOrder {
  id: string
  proyek_id: string
  supplier_id: string
  supplier?: Supplier
  nomor_po: string
  tgl_po: string
  total_nilai: number
  status: StatusPO
  items?: PoItem[]
  created_at: string
}

export interface StokMaterial {
  id: string
  proyek_id: string
  material_id: string
  material?: Material
  qty_masuk: number
  qty_terpakai: number
  stok_minimum: number
  is_kritis: boolean
}

export interface StokInfo extends StokMaterial {
  stok_sisa: number
}

export interface PenggunaanMaterial {
  id: string
  proyek_id: string
  material_id: string
  qty: number
  keterangan: string
  tgl_pakai: string
  dibuat_oleh_id: string
  created_at: string
}

// ─── Tenaga Kerja ─────────────────────────────────────────────────────────────

export type TipePekerja = 'mandor' | 'tukang' | 'kuli'
export type StatusAbsensi = 'hadir' | 'setengah_hari' | 'lembur' | 'tidak_hadir'

export interface PenugasanProyek {
  id: string
  proyek_id: string
  pekerja_id: string
  pekerja?: Pekerja
  tgl_mulai: string
  tgl_selesai?: string
  is_aktif: boolean
}

export interface Absensi {
  id: string
  proyek_id: string
  pekerja_id: string
  pekerja?: Pekerja
  tanggal: string
  status: StatusAbsensi
  jam_kerja: number
  upah_harian: number
  upah_dibayar: number
  dicatat_oleh_id: string
  created_at: string
}

export interface RekapUpahItem {
  pekerja: Pekerja
  absensi: Absensi[]
  total_upah: number
  jml_hadir: number
  jml_setengah: number
  jml_lembur: number
  jml_absen: number
}

export interface RekapUpahResponse {
  items: RekapUpahItem[]
  total_semua: number
}

export interface PembayaranUpah {
  id: string
  proyek_id: string
  pekerja_id: string
  pekerja?: Pekerja
  periode_mulai: string
  periode_selesai: string
  total_upah: number
  is_approved: boolean
  is_bayar: boolean
  tgl_bayar?: string
  pengeluaran_id?: string
  created_at: string
}
