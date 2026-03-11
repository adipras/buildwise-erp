import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import {
  useStokList,
  usePOList,
  usePenggunaanList,
  usePakaiMaterial,
  useCreatePO,
  useTerimaPO,
  useDeletePO,
  useMaterialList,
  useSupplierList,
  type PakaiMaterialInput,
  type CreatePoInput,
} from '../../hooks/useMaterial'
import { formatRupiah, formatTanggal } from '../../utils/format'
import type { PurchaseOrder } from '../../types'

// ─── Shared UI ────────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm'

interface Props {
  proyekId: string
}

// ─── Status badge PO ─────────────────────────────────────────────────────────
const STATUS_PO: Record<string, { label: string; bg: string; text: string }> = {
  draft:    { label: 'Draft',    bg: 'bg-border',         text: 'text-text-mid' },
  dikirim:  { label: 'Dikirim',  bg: 'bg-badge-warning',  text: 'text-warning'  },
  diterima: { label: 'Diterima', bg: 'bg-badge-success',  text: 'text-success'  },
  batal:    { label: 'Batal',    bg: 'bg-badge-danger',   text: 'text-danger'   },
}

// ─── Modal Catat Penggunaan ───────────────────────────────────────────────────
const pakaiSchema = z.object({
  material_id: z.string().min(1, 'Pilih material'),
  qty: z.coerce.number().positive('Qty harus positif'),
  keterangan: z.string().optional(),
  tgl_pakai: z.string().min(1, 'Tanggal wajib diisi'),
})
type PakaiFormData = z.infer<typeof pakaiSchema>

function PakaiMaterialModal({ proyekId, onClose }: { proyekId: string; onClose: () => void }) {
  const { data: materials = [] } = useMaterialList()
  const pakai = usePakaiMaterial(proyekId)

  const { register, handleSubmit, formState: { errors } } = useForm<PakaiFormData>({
    resolver: zodResolver(pakaiSchema),
    defaultValues: { tgl_pakai: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = async (data: PakaiFormData) => {
    const input: PakaiMaterialInput = {
      material_id: data.material_id,
      qty: data.qty,
      keterangan: data.keterangan,
      tgl_pakai: data.tgl_pakai,
    }
    await pakai.mutateAsync(input)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-text-dark font-semibold text-lg">Catat Penggunaan Material</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {pakai.isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
              {(pakai.error as Error)?.message ?? 'Gagal menyimpan. Coba lagi.'}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Material</label>
            <select {...register('material_id')} className={inputCls}>
              <option value="">Pilih material...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.nama} ({m.satuan})</option>
              ))}
            </select>
            {errors.material_id && <p className="text-danger text-xs">{errors.material_id.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Qty</label>
            <input {...register('qty')} type="number" step="0.01" placeholder="10" className={inputCls} />
            {errors.qty && <p className="text-danger text-xs">{errors.qty.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Tanggal Pakai</label>
            <input {...register('tgl_pakai')} type="date" className={inputCls} />
            {errors.tgl_pakai && <p className="text-danger text-xs">{errors.tgl_pakai.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Keterangan (opsional)</label>
            <input {...register('keterangan')} placeholder="Dipakai di lantai 2..." className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors">
              Batal
            </button>
            <button type="submit" disabled={pakai.isPending}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {pakai.isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Buat PO ────────────────────────────────────────────────────────────
const poItemSchema = z.object({
  material_id: z.string().min(1, 'Pilih material'),
  qty_dipesan: z.coerce.number().positive('Qty harus positif'),
  harga_satuan: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
})

const poSchema = z.object({
  supplier_id: z.string().min(1, 'Pilih supplier'),
  nomor_po: z.string().optional(),
  tgl_po: z.string().min(1, 'Tanggal wajib diisi'),
  items: z.array(poItemSchema).min(1, 'Minimal 1 item'),
})
type PoFormData = z.infer<typeof poSchema>

function CreatePoModal({ proyekId, onClose }: { proyekId: string; onClose: () => void }) {
  const { data: materials = [] } = useMaterialList()
  const { data: suppliers = [] } = useSupplierList()
  const createPO = useCreatePO(proyekId)

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<PoFormData>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      tgl_po: new Date().toISOString().slice(0, 10),
      items: [{ material_id: '', qty_dipesan: 1, harga_satuan: 0 }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const watchedItems = watch('items')
  const totalNilai = watchedItems.reduce(
    (sum, item) => sum + (Number(item.qty_dipesan) || 0) * (Number(item.harga_satuan) || 0),
    0,
  )

  const onSubmit = async (data: PoFormData) => {
    const input: CreatePoInput = {
      supplier_id: data.supplier_id,
      nomor_po: data.nomor_po,
      tgl_po: data.tgl_po,
      items: data.items.map((it) => ({
        material_id: it.material_id,
        qty_dipesan: it.qty_dipesan,
        harga_satuan: it.harga_satuan,
      })),
    }
    await createPO.mutateAsync(input)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card-bg z-10">
          <h2 className="text-text-dark font-semibold text-lg">Buat Purchase Order</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {createPO.isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
              {(createPO.error as Error)?.message ?? 'Gagal membuat PO. Coba lagi.'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-text-dark">Supplier</label>
              <select {...register('supplier_id')} className={inputCls}>
                <option value="">Pilih supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.nama}</option>
                ))}
              </select>
              {errors.supplier_id && <p className="text-danger text-xs">{errors.supplier_id.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Nomor PO (opsional)</label>
              <input {...register('nomor_po')} placeholder="PO-2025-001" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-dark">Tanggal PO</label>
              <input {...register('tgl_po')} type="date" className={inputCls} />
              {errors.tgl_po && <p className="text-danger text-xs">{errors.tgl_po.message}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-dark uppercase tracking-wide">Item Material</label>
              <button type="button"
                onClick={() => append({ material_id: '', qty_dipesan: 1, harga_satuan: 0 })}
                className="text-xs text-accent hover:text-accent-light font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Item
              </button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="bg-light-bg rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-mid">Item #{index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)}
                      className="text-danger hover:text-danger/70 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 space-y-1">
                    <label className="text-xs text-text-mid">Material</label>
                    <select {...register(`items.${index}.material_id`)} className={inputCls}>
                      <option value="">Pilih...</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>{m.nama} ({m.satuan})</option>
                      ))}
                    </select>
                    {errors.items?.[index]?.material_id && (
                      <p className="text-danger text-xs">{errors.items[index]?.material_id?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-mid">Qty Dipesan</label>
                    <input {...register(`items.${index}.qty_dipesan`)} type="number" step="0.01" placeholder="10" className={inputCls} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs text-text-mid">Harga Satuan (Rp)</label>
                    <input {...register(`items.${index}.harga_satuan`)} type="number" placeholder="50000" className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-danger text-xs">{(errors.items as { message?: string })?.message}</p>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-primary/10 rounded-xl px-5 py-3 flex items-center gap-3">
              <span className="text-sm text-text-mid font-medium">Total Nilai PO</span>
              <span className="text-primary font-bold text-lg">{formatRupiah(totalNilai)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors">
              Batal
            </button>
            <button type="submit" disabled={createPO.isPending}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {createPO.isPending ? 'Menyimpan...' : 'Buat PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Sub-tab: Stok ────────────────────────────────────────────────────────────
function StokSubTab({ proyekId }: { proyekId: string }) {
  const { data: stoks = [], isLoading, isError } = useStokList(proyekId)
  const [showPakai, setShowPakai] = useState(false)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-border rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-badge-danger border border-danger/30 rounded-xl text-danger text-sm">
        Gagal memuat data stok.
      </div>
    )
  }

  // Alert material kritis
  const kritisItems = stoks.filter((s) => s.is_kritis)

  return (
    <div className="space-y-5">
      {kritisItems.length > 0 && (
        <div className="bg-badge-danger border border-danger/30 rounded-xl px-5 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-danger mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-danger text-sm font-semibold">Stok Kritis!</p>
            <p className="text-danger/80 text-xs mt-0.5">
              {kritisItems.map((s) => s.material?.nama).join(', ')} — stok di bawah minimum.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-text-mid text-sm">{stoks.length} material terdaftar</p>
        <button onClick={() => setShowPakai(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Catat Pemakaian
        </button>
      </div>

      {stoks.length === 0 ? (
        <div className="text-center py-12 text-text-light text-sm">
          Belum ada stok material. Buat Purchase Order untuk menambah stok.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stoks.map((stok) => {
            const persen = stok.qty_masuk > 0
              ? Math.min(100, (stok.stok_sisa / stok.qty_masuk) * 100)
              : 0
            const barColor = stok.is_kritis
              ? 'bg-danger'
              : persen < 40
              ? 'bg-warning'
              : 'bg-success'

            return (
              <div key={stok.id}
                className={clsx(
                  'bg-card-bg rounded-xl border p-4 space-y-3',
                  stok.is_kritis ? 'border-danger/50' : 'border-border',
                )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-text-dark font-semibold text-sm leading-tight">
                      {stok.material?.nama ?? '—'}
                    </p>
                    <p className="text-text-light text-xs mt-0.5">{stok.material?.satuan}</p>
                  </div>
                  {stok.is_kritis && (
                    <span className="bg-badge-danger text-danger text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                      KRITIS
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all', barColor)}
                      style={{ width: `${persen}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-mid">
                    <span>Sisa: <strong className="text-text-dark">{stok.stok_sisa.toFixed(2)}</strong></span>
                    <span>Masuk: {stok.qty_masuk.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border text-xs text-text-mid">
                  <div>
                    <p className="text-text-light">Terpakai</p>
                    <p className="text-text-dark font-medium">{stok.qty_terpakai.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-text-light">Min. Stok</p>
                    <p className="text-text-dark font-medium">{stok.stok_minimum.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showPakai && (
        <PakaiMaterialModal proyekId={proyekId} onClose={() => setShowPakai(false)} />
      )}
    </div>
  )
}

// ─── Sub-tab: PO ─────────────────────────────────────────────────────────────
function PoSubTab({ proyekId }: { proyekId: string }) {
  const { data: pos = [], isLoading, isError } = usePOList(proyekId)
  const terimaPO = useTerimaPO(proyekId)
  const deletePO = useDeletePO(proyekId)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-border rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 bg-badge-danger border border-danger/30 rounded-xl text-danger text-sm">
        Gagal memuat data purchase order.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-text-mid text-sm">{pos.length} purchase order</p>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat PO
        </button>
      </div>

      {pos.length === 0 ? (
        <div className="text-center py-12 text-text-light text-sm">
          Belum ada purchase order untuk proyek ini.
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-light-bg">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Nomor PO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">Total Nilai</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-mid">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pos.map((po: PurchaseOrder) => {
                  const status = STATUS_PO[po.status] ?? STATUS_PO.draft
                  return (
                    <tr key={po.id} className="hover:bg-light-bg/50 transition-colors">
                      <td className="px-4 py-3 text-text-dark font-medium">
                        {po.nomor_po || <span className="text-text-light">—</span>}
                      </td>
                      <td className="px-4 py-3 text-text-mid whitespace-nowrap">
                        {formatTanggal(po.tgl_po)}
                      </td>
                      <td className="px-4 py-3 text-text-dark">{po.supplier?.nama ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', status.bg, status.text)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-dark font-semibold">
                        {formatRupiah(po.total_nilai)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {po.status === 'draft' && (
                            <button
                              onClick={() => terimaPO.mutate(po.id)}
                              disabled={terimaPO.isPending}
                              className="text-xs bg-success/10 text-success hover:bg-success/20 px-2 py-1 rounded font-medium transition-colors disabled:opacity-50"
                              title="Terima PO">
                              Terima
                            </button>
                          )}
                          {po.status !== 'diterima' && (
                            <button
                              onClick={() => setConfirmDelete(po.id)}
                              className="text-danger hover:text-danger/70 transition-colors"
                              title="Hapus">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-text-dark font-semibold">Hapus Purchase Order?</h3>
            <p className="text-text-mid text-sm">PO yang dihapus tidak dapat dipulihkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors">
                Batal
              </button>
              <button
                onClick={() => { deletePO.mutate(confirmDelete); setConfirmDelete(null) }}
                disabled={deletePO.isPending}
                className="flex-1 py-2.5 rounded-lg bg-danger hover:bg-danger/90 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreatePoModal proyekId={proyekId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}

// ─── Sub-tab: Penggunaan ──────────────────────────────────────────────────────
function PenggunaanSubTab({ proyekId }: { proyekId: string }) {
  const { data: list = [], isLoading, isError } = usePenggunaanList(proyekId)
  const { data: materials = [] } = useMaterialList()

  const materialMap = Object.fromEntries(materials.map((m) => [m.id, m]))

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
        Gagal memuat riwayat penggunaan.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-text-mid text-sm">{list.length} catatan penggunaan</p>

      {list.length === 0 ? (
        <div className="text-center py-12 text-text-light text-sm">
          Belum ada penggunaan material yang dicatat.
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-light-bg">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-mid">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-mid">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((item) => {
                  const material = materialMap[item.material_id]
                  return (
                    <tr key={item.id} className="hover:bg-light-bg/50 transition-colors">
                      <td className="px-4 py-3 text-text-mid whitespace-nowrap">
                        {formatTanggal(item.tgl_pakai)}
                      </td>
                      <td className="px-4 py-3 text-text-dark">
                        {material ? `${material.nama} (${material.satuan})` : item.material_id}
                      </td>
                      <td className="px-4 py-3 text-right text-text-dark font-semibold">
                        {item.qty.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-text-mid">
                        {item.keterangan || <span className="text-text-light">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main MaterialTab Component ───────────────────────────────────────────────
type SubTab = 'stok' | 'po' | 'penggunaan'

export default function MaterialTab({ proyekId }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('stok')

  const subTabs: { id: SubTab; label: string }[] = [
    { id: 'stok',       label: 'Stok Material' },
    { id: 'po',         label: 'Purchase Order' },
    { id: 'penggunaan', label: 'Riwayat Pemakaian' },
  ]

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
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

      {activeSubTab === 'stok'       && <StokSubTab proyekId={proyekId} />}
      {activeSubTab === 'po'         && <PoSubTab proyekId={proyekId} />}
      {activeSubTab === 'penggunaan' && <PenggunaanSubTab proyekId={proyekId} />}
    </div>
  )
}
