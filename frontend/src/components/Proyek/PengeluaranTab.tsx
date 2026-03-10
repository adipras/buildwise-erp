import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  usePengeluaranList,
  useCreatePengeluaran,
  useDeletePengeluaran,
  useRabList,
  type PengeluaranInput,
} from '../../hooks/useProyek'
import { formatRupiah, formatTanggal } from '../../utils/format'

interface Props {
  proyekId: string
}

// ─── Zod schema ──────────────────────────────────────────────────────────────
const schema = z.object({
  tgl_pengeluaran: z.string().min(1, 'Tanggal wajib diisi'),
  kategori: z.string().min(1, 'Kategori wajib diisi'),
  deskripsi: z.string().min(3, 'Deskripsi minimal 3 karakter'),
  jumlah: z.coerce.number().positive('Jumlah harus positif'),
  rab_item_id: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm'

const KATEGORI_OPTIONS = [
  'Material',
  'Upah',
  'Peralatan',
  'Overhead',
  'Lain-lain',
]

// ─── Form Modal ───────────────────────────────────────────────────────────────
function PengeluaranModal({
  proyekId,
  onClose,
}: {
  proyekId: string
  onClose: () => void
}) {
  const createPengeluaran = useCreatePengeluaran(proyekId)
  const { data: rabItems = [] } = useRabList(proyekId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    const input: PengeluaranInput = {
      tgl_pengeluaran: data.tgl_pengeluaran,
      kategori: data.kategori,
      deskripsi: data.deskripsi,
      jumlah: data.jumlah,
      rab_item_id: data.rab_item_id || undefined,
    }
    await createPengeluaran.mutateAsync(input)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-text-dark font-semibold text-lg">Catat Pengeluaran</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {createPengeluaran.isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
              Gagal menyimpan pengeluaran. Coba lagi.
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Tanggal</label>
            <input {...register('tgl_pengeluaran')} type="date" className={inputCls} />
            {errors.tgl_pengeluaran && <p className="text-danger text-xs">{errors.tgl_pengeluaran.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Kategori</label>
            <select {...register('kategori')} className={inputCls}>
              <option value="">Pilih kategori...</option>
              {KATEGORI_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            {errors.kategori && <p className="text-danger text-xs">{errors.kategori.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Deskripsi</label>
            <input {...register('deskripsi')} placeholder="Pembelian semen 50 sak" className={inputCls} />
            {errors.deskripsi && <p className="text-danger text-xs">{errors.deskripsi.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Jumlah (Rp)</label>
            <input {...register('jumlah')} type="number" placeholder="5000000" className={inputCls} />
            {errors.jumlah && <p className="text-danger text-xs">{errors.jumlah.message}</p>}
          </div>

          {rabItems.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Item RAB (opsional)</label>
              <select {...register('rab_item_id')} className={inputCls}>
                <option value="">— Tidak terkait item RAB —</option>
                {rabItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.kode} — {item.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createPengeluaran.isPending}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {createPengeluaran.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PengeluaranTab({ proyekId }: Props) {
  const { data: pengeluaranList = [], isLoading, isError } = usePengeluaranList(proyekId)
  const deletePengeluaran = useDeletePengeluaran(proyekId)
  const [showModal, setShowModal] = useState(false)

  const total = pengeluaranList.reduce((sum, p) => sum + p.jumlah, 0)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-border rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-badge-danger border border-danger/30 rounded-xl text-danger text-sm">
        Gagal memuat data pengeluaran.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-text-mid text-sm">
          {pengeluaranList.length} transaksi tercatat
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Catat Pengeluaran
        </button>
      </div>

      {/* Empty state */}
      {pengeluaranList.length === 0 ? (
        <div className="text-center py-12 text-text-light text-sm">
          Belum ada pengeluaran tercatat untuk proyek ini.
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-light-bg">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Deskripsi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Item RAB</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">Jumlah</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Dibuat Oleh</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-text-mid">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pengeluaranList.map((item) => (
                    <tr key={item.id} className="hover:bg-light-bg/50 transition-colors">
                      <td className="px-4 py-3 text-text-mid whitespace-nowrap">
                        {formatTanggal(item.tgl_pengeluaran)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-light-bg text-text-mid text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-dark">{item.deskripsi}</td>
                      <td className="px-4 py-3 text-text-mid text-xs">
                        {item.rab_item
                          ? `${item.rab_item.kode} — ${item.rab_item.nama}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-text-dark font-semibold">
                        {formatRupiah(item.jumlah)}
                      </td>
                      <td className="px-4 py-3 text-text-mid text-xs">
                        {item.dibuat_oleh?.nama ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deletePengeluaran.mutate(item.id)}
                          disabled={deletePengeluaran.isPending}
                          className="text-danger hover:text-danger/70 disabled:opacity-50 transition-colors"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-card-bg border border-border rounded-xl px-6 py-3 flex items-center gap-4">
              <span className="text-sm text-text-mid font-medium">Total Pengeluaran</span>
              <span className="text-primary font-bold text-lg">{formatRupiah(total)}</span>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <PengeluaranModal proyekId={proyekId} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
