import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import {
  usePekerjaList,
  usePekerjaProyek,
  useAssignPekerja,
  useUnassignPekerja,
  useCreatePekerja,
  useAbsensi,
  useInputAbsensi,
  useRekapUpah,
  useApproveBayar,
  usePembayaranUpah,
  type PekerjaInput,
  type AbsensiItemInput,
} from '../../hooks/useTenagaKerja'
import { formatRupiah, formatTanggal } from '../../utils/format'
import type { StatusAbsensi, RekapUpahItem } from '../../types'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm'

interface Props {
  proyekId: string
}

// ─── Status absensi config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<StatusAbsensi, { label: string; short: string; bg: string; text: string }> = {
  hadir:        { label: 'Hadir',        short: 'H',  bg: 'bg-badge-success', text: 'text-success'  },
  lembur:       { label: 'Lembur',       short: 'L',  bg: 'bg-blue-100',      text: 'text-blue-700' },
  setengah_hari:{ label: 'Setengah Hari',short: '½',  bg: 'bg-badge-warning', text: 'text-warning'  },
  tidak_hadir:  { label: 'Tidak Hadir',  short: 'X',  bg: 'bg-badge-danger',  text: 'text-danger'   },
}
const STATUS_CYCLE: StatusAbsensi[] = ['hadir', 'lembur', 'setengah_hari', 'tidak_hadir']

// ─── Modal Tambah Pekerja ────────────────────────────────────────────────────
const pekerjaSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  telepon: z.string().optional(),
  tipe: z.enum(['mandor', 'tukang', 'kuli']),
  upah_harian: z.coerce.number().positive('Upah harus positif'),
})
type PekerjaFormData = z.infer<typeof pekerjaSchema>

function TambahPekerjaModal({ onClose }: { onClose: () => void }) {
  const createPekerja = useCreatePekerja()
  const { register, handleSubmit, formState: { errors } } = useForm<PekerjaFormData>({
    resolver: zodResolver(pekerjaSchema),
    defaultValues: { tipe: 'tukang' },
  })
  const onSubmit = async (data: PekerjaFormData) => {
    const input: PekerjaInput = { nama: data.nama, telepon: data.telepon, tipe: data.tipe, upah_harian: data.upah_harian }
    await createPekerja.mutateAsync(input)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-text-dark font-semibold text-lg">Tambah Pekerja</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {createPekerja.isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
              {(createPekerja.error as Error)?.message ?? 'Gagal menyimpan.'}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Nama Lengkap</label>
            <input {...register('nama')} placeholder="Budi Santoso" className={inputCls} />
            {errors.nama && <p className="text-danger text-xs">{errors.nama.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Tipe</label>
              <select {...register('tipe')} className={inputCls}>
                <option value="mandor">Mandor</option>
                <option value="tukang">Tukang</option>
                <option value="kuli">Kuli</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Telepon</label>
              <input {...register('telepon')} placeholder="08123..." className={inputCls} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Upah Harian (Rp)</label>
            <input {...register('upah_harian')} type="number" placeholder="150000" className={inputCls} />
            {errors.upah_harian && <p className="text-danger text-xs">{errors.upah_harian.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors">
              Batal
            </button>
            <button type="submit" disabled={createPekerja.isPending}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {createPekerja.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Sub-tab: Pekerja ─────────────────────────────────────────────────────────
function PekerjaSubTab({ proyekId }: { proyekId: string }) {
  const { data: penugasan = [], isLoading: loadingPenugasan } = usePekerjaProyek(proyekId)
  const { data: allPekerja = [] } = usePekerjaList()
  const assign = useAssignPekerja(proyekId)
  const unassign = useUnassignPekerja(proyekId)
  const [showTambah, setShowTambah] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  const assignedIds = new Set(penugasan.map((p) => p.pekerja_id))
  const unassignedPekerja = allPekerja.filter((p) => !assignedIds.has(p.id) && p.is_aktif)

  const TIPE_LABEL: Record<string, string> = { mandor: 'Mandor', tukang: 'Tukang', kuli: 'Kuli' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-text-mid text-sm">{penugasan.length} pekerja ditugaskan</p>
        <div className="flex gap-2">
          <button onClick={() => setShowTambah(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Pekerja Baru
          </button>
          <button onClick={() => setShowAssign(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tugaskan
          </button>
        </div>
      </div>

      {loadingPenugasan ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : penugasan.length === 0 ? (
        <div className="text-center py-12 text-text-light text-sm">
          Belum ada pekerja yang ditugaskan ke proyek ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {penugasan.map((pn) => {
            const p = pn.pekerja
            if (!p) return null
            return (
              <div key={pn.id} className="bg-card-bg rounded-xl border border-border px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{p.nama.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-text-dark font-medium text-sm">{p.nama}</p>
                    <p className="text-text-light text-xs">{TIPE_LABEL[p.tipe]} · {formatRupiah(p.upah_harian)}/hari</p>
                  </div>
                </div>
                <button
                  onClick={() => unassign.mutate(p.id)}
                  disabled={unassign.isPending}
                  className="text-text-light hover:text-danger transition-colors disabled:opacity-50"
                  title="Lepas dari proyek">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Assign modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-text-dark font-semibold text-lg">Tugaskan Pekerja</h2>
              <button onClick={() => setShowAssign(false)} className="text-text-light hover:text-text-dark">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-4 space-y-2 max-h-72 overflow-y-auto">
              {unassignedPekerja.length === 0 ? (
                <p className="text-center text-text-light text-sm py-6">Semua pekerja sudah ditugaskan.</p>
              ) : unassignedPekerja.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { assign.mutate(p.id); setShowAssign(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-light-bg transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-xs">{p.nama.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-text-dark text-sm font-medium">{p.nama}</p>
                    <p className="text-text-light text-xs">{TIPE_LABEL[p.tipe]} · {formatRupiah(p.upah_harian)}/hari</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTambah && <TambahPekerjaModal onClose={() => setShowTambah(false)} />}
    </div>
  )
}

// ─── Sub-tab: Absensi ─────────────────────────────────────────────────────────
function AbsensiSubTab({ proyekId }: { proyekId: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const [tanggal, setTanggal] = useState(today)
  const { data: penugasan = [] } = usePekerjaProyek(proyekId)
  const { data: existingAbsensi = [] } = useAbsensi(proyekId, tanggal)
  const inputAbsensi = useInputAbsensi(proyekId)

  // Status per pekerja, default = hadir
  const [statusMap, setStatusMap] = useState<Record<string, StatusAbsensi>>({})

  // Isi dari data existing
  useEffect(() => {
    const map: Record<string, StatusAbsensi> = {}
    penugasan.forEach((pn) => {
      const existing = existingAbsensi.find((a) => a.pekerja_id === pn.pekerja_id)
      map[pn.pekerja_id] = existing?.status ?? 'hadir'
    })
    setStatusMap(map)
  }, [penugasan, existingAbsensi])

  const cycleStatus = (pekerjaId: string) => {
    setStatusMap((prev) => {
      const current = prev[pekerjaId] ?? 'hadir'
      const idx = STATUS_CYCLE.indexOf(current)
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
      return { ...prev, [pekerjaId]: next }
    })
  }

  const handleSimpan = async () => {
    const absensi: AbsensiItemInput[] = penugasan
      .filter((pn) => pn.pekerja_id in statusMap)
      .map((pn) => ({
        pekerja_id: pn.pekerja_id,
        status: statusMap[pn.pekerja_id],
        jam_kerja: statusMap[pn.pekerja_id] === 'setengah_hari' ? 4 : statusMap[pn.pekerja_id] === 'lembur' ? 10 : 8,
      }))
    await inputAbsensi.mutateAsync({ tanggal, absensi })
  }

  return (
    <div className="space-y-5">
      {/* Tanggal picker */}
      <div className="flex items-center gap-3">
        <label className="text-text-dark font-medium text-sm shrink-0">Tanggal Absensi</label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          max={today}
          className={inputCls + ' max-w-[180px]'}
        />
      </div>

      {penugasan.length === 0 ? (
        <div className="text-center py-12 text-text-light text-sm">
          Belum ada pekerja di proyek ini. Tugaskan pekerja di tab Pekerja.
        </div>
      ) : (
        <>
          {/* Panduan */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_CYCLE.map((s) => {
              const cfg = STATUS_CONFIG[s]
              return (
                <span key={s} className={clsx('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', cfg.bg, cfg.text)}>
                  <span className="font-bold">{cfg.short}</span> {cfg.label}
                </span>
              )
            })}
            <span className="text-text-light text-xs self-center ml-1">— tap toggle untuk ganti status</span>
          </div>

          {/* Toggle cards — mobile-first */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {penugasan.map((pn) => {
              const p = pn.pekerja
              if (!p) return null
              const status = statusMap[pn.pekerja_id] ?? 'hadir'
              const cfg = STATUS_CONFIG[status]
              return (
                <button
                  key={pn.pekerja_id}
                  onClick={() => cycleStatus(pn.pekerja_id)}
                  className={clsx(
                    'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all active:scale-95',
                    status === 'hadir'        ? 'border-success bg-badge-success/30' :
                    status === 'lembur'       ? 'border-blue-400 bg-blue-50'          :
                    status === 'setengah_hari'? 'border-warning bg-badge-warning/30'  :
                    'border-danger bg-badge-danger/30',
                  )}
                >
                  <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0', cfg.bg, cfg.text)}>
                    {cfg.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-dark font-semibold text-sm truncate">{p.nama}</p>
                    <p className="text-text-light text-xs capitalize">{p.tipe} · {formatRupiah(p.upah_harian)}/hari</p>
                    <p className={clsx('text-xs font-medium mt-0.5', cfg.text)}>{cfg.label}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Summary */}
          <div className="flex gap-3 flex-wrap text-sm bg-light-bg rounded-xl px-5 py-3">
            {STATUS_CYCLE.map((s) => {
              const count = Object.values(statusMap).filter((v) => v === s).length
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={clsx('text-xs font-bold px-1.5 py-0.5 rounded', STATUS_CONFIG[s].bg, STATUS_CONFIG[s].text)}>
                    {STATUS_CONFIG[s].short}
                  </span>
                  <span className="text-text-mid">{count} orang</span>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleSimpan}
            disabled={inputAbsensi.isPending || penugasan.length === 0}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold text-sm transition-colors">
            {inputAbsensi.isPending ? 'Menyimpan...' : `Simpan Absensi ${tanggal}`}
          </button>

          {inputAbsensi.isSuccess && (
            <div className="bg-badge-success border border-success/30 rounded-xl px-4 py-3 text-success text-sm font-medium">
              ✅ Absensi berhasil disimpan.
            </div>
          )}
          {inputAbsensi.isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-xl px-4 py-3 text-danger text-sm">
              {(inputAbsensi.error as Error)?.message ?? 'Gagal menyimpan absensi.'}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Sub-tab: Rekap Upah ──────────────────────────────────────────────────────
function RekapUpahSubTab({ proyekId }: { proyekId: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [mulai, setMulai] = useState(weekAgo)
  const [selesai, setSelesai] = useState(today)
  const [confirmPeriode, setConfirmPeriode] = useState<{ mulai: string; selesai: string } | null>(null)

  const { data: rekap, isLoading, isError } = useRekapUpah(proyekId, mulai, selesai)
  const approveBayar = useApproveBayar(proyekId)
  const { data: riwayat = [] } = usePembayaranUpah(proyekId)

  const handleApproveBayar = async () => {
    if (!confirmPeriode) return
    await approveBayar.mutateAsync({
      periode_mulai: confirmPeriode.mulai,
      periode_selesai: confirmPeriode.selesai,
    })
    setConfirmPeriode(null)
  }

  return (
    <div className="space-y-6">
      {/* Periode filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-text-dark font-medium text-sm shrink-0">Periode</label>
        <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)}
          className={inputCls + ' max-w-[160px]'} />
        <span className="text-text-mid text-sm">s/d</span>
        <input type="date" value={selesai} onChange={(e) => setSelesai(e.target.value)}
          className={inputCls + ' max-w-[160px]'} />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4 bg-badge-danger border border-danger/30 rounded-xl text-danger text-sm">
          Gagal memuat rekap upah.
        </div>
      )}

      {rekap && (
        <>
          {rekap.items.length === 0 ? (
            <div className="text-center py-12 text-text-light text-sm">
              Tidak ada data absensi pada periode ini.
            </div>
          ) : (
            <>
              {/* Rekap table */}
              <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-light-bg">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Pekerja</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-text-mid">H</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-text-mid">L</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-text-mid">½</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-text-mid">X</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">Total Upah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rekap.items.map((item: RekapUpahItem) => (
                        <tr key={item.pekerja.id} className="hover:bg-light-bg/50">
                          <td className="px-4 py-3">
                            <p className="text-text-dark font-medium">{item.pekerja.nama}</p>
                            <p className="text-text-light text-xs capitalize">{item.pekerja.tipe}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-badge-success text-success text-xs font-bold px-2 py-0.5 rounded-full">
                              {item.jml_hadir}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                              {item.jml_lembur}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-badge-warning text-warning text-xs font-bold px-2 py-0.5 rounded-full">
                              {item.jml_setengah}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-badge-danger text-danger text-xs font-bold px-2 py-0.5 rounded-full">
                              {item.jml_absen}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-text-dark font-semibold">
                            {formatRupiah(item.total_upah)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-light-bg">
                        <td colSpan={5} className="px-4 py-3 text-text-mid text-sm font-semibold">Total Semua</td>
                        <td className="px-4 py-3 text-right text-primary font-bold text-base">
                          {formatRupiah(rekap.total_semua)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <button
                onClick={() => setConfirmPeriode({ mulai, selesai })}
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent-light text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approve & Bayar Semua ({formatRupiah(rekap.total_semua)})
              </button>
            </>
          )}

          {/* Riwayat Pembayaran */}
          {riwayat.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-text-dark font-semibold text-sm">Riwayat Pembayaran</h3>
              <div className="space-y-2">
                {riwayat.map((r) => (
                  <div key={r.id} className="bg-card-bg rounded-xl border border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-text-dark font-medium text-sm">{r.pekerja?.nama ?? '—'}</p>
                      <p className="text-text-light text-xs">
                        {formatTanggal(r.periode_mulai)} — {formatTanggal(r.periode_selesai)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold">{formatRupiah(r.total_upah)}</p>
                      <span className="text-xs bg-badge-success text-success font-medium px-2 py-0.5 rounded-full">
                        {r.is_bayar ? 'Lunas' : 'Approved'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm dialog */}
      {confirmPeriode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-text-dark font-semibold text-lg">Approve & Bayar Upah?</h3>
            <p className="text-text-mid text-sm">
              Pembayaran upah periode <strong>{confirmPeriode.mulai}</strong> s/d <strong>{confirmPeriode.selesai}</strong> akan diproses. Pengeluaran otomatis akan tercatat.
            </p>
            <p className="text-primary font-bold text-xl">{formatRupiah(rekap?.total_semua ?? 0)}</p>
            {approveBayar.isError && (
              <p className="text-danger text-sm">{(approveBayar.error as Error)?.message}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmPeriode(null)}
                className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors">
                Batal
              </button>
              <button
                onClick={handleApproveBayar}
                disabled={approveBayar.isPending}
                className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                {approveBayar.isPending ? 'Memproses...' : 'Ya, Bayar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main TenagaKerjaTab ──────────────────────────────────────────────────────
type SubTab = 'pekerja' | 'absensi' | 'rekap'

export default function TenagaKerjaTab({ proyekId }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('pekerja')

  const subTabs: { id: SubTab; label: string }[] = [
    { id: 'pekerja', label: 'Daftar Pekerja' },
    { id: 'absensi', label: 'Input Absensi'  },
    { id: 'rekap',   label: 'Rekap Upah'     },
  ]

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-border">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeSubTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-mid hover:text-text-dark',
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'pekerja' && <PekerjaSubTab proyekId={proyekId} />}
      {activeSubTab === 'absensi' && <AbsensiSubTab proyekId={proyekId} />}
      {activeSubTab === 'rekap'   && <RekapUpahSubTab proyekId={proyekId} />}
    </div>
  )
}
