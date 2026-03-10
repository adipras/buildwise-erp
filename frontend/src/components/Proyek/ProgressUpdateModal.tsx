import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Milestone } from '../../types'
import { useCreateProgress } from '../../hooks/useJadwal'

interface Props {
  proyekId: string
  milestone: Milestone
  onClose: () => void
}

const schema = z.object({
  persen: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  catatan: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-light-bg text-text-dark placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-sm'

export default function ProgressUpdateModal({ proyekId, milestone, onClose }: Props) {
  const createProgress = useCreateProgress(proyekId, milestone.id)
  const [fotoUrls, setFotoUrls] = useState<string[]>([''])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { persen: milestone.actual_persen, catatan: '' },
  })

  const persen = watch('persen') ?? 0

  const addFotoUrl = () => setFotoUrls((prev) => [...prev, ''])
  const removeFotoUrl = (i: number) => setFotoUrls((prev) => prev.filter((_, idx) => idx !== i))
  const updateFotoUrl = (i: number, val: string) =>
    setFotoUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)))

  const onSubmit = async (data: FormData) => {
    const validFotos = fotoUrls.filter((u) => u.trim().length > 0)
    await createProgress.mutateAsync({
      persen: data.persen,
      catatan: data.catatan || undefined,
      foto_urls: validFotos.length > 0 ? validFotos : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-text-dark font-semibold text-lg">Update Progress</h2>
            <p className="text-text-light text-xs mt-0.5">{milestone.nama}</p>
          </div>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {createProgress.isError && (
            <div className="bg-badge-danger border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm">
              Gagal menyimpan progress. Coba lagi.
            </div>
          )}

          {/* Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-dark">Persentase Progress</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={persen}
                  onChange={(e) => setValue('persen', Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg border border-border bg-light-bg text-text-dark text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-text-mid text-sm font-medium">%</span>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              {...register('persen')}
              value={persen}
              onChange={(e) => setValue('persen', Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer accent-accent"
              style={{ touchAction: 'none' }}
            />

            {/* Progress bar preview */}
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, persen))}%` }}
              />
            </div>

            {errors.persen && <p className="text-danger text-xs">{errors.persen.message}</p>}
          </div>

          {/* Catatan */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-dark">Catatan (opsional)</label>
            <textarea
              {...register('catatan')}
              rows={3}
              placeholder="Catatan progress..."
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Foto URLs */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-dark">Foto (opsional)</label>
            {fotoUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateFotoUrl(i, e.target.value)}
                  placeholder="https://..."
                  className={inputCls + ' flex-1'}
                />
                {fotoUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFotoUrl(i)}
                    className="text-danger hover:text-danger/70 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addFotoUrl}
              className="text-primary text-xs font-medium hover:underline"
            >
              + Tambah URL Foto
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-text-mid text-sm font-medium hover:bg-light-bg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createProgress.isPending}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-light disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {createProgress.isPending ? 'Menyimpan...' : 'Simpan Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
