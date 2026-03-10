import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { useKurvaS } from '../../hooks/useJadwal'

interface Props {
  proyekId: string
}

export default function KurvaSChart({ proyekId }: Props) {
  const { data, isLoading } = useKurvaS(proyekId)

  if (isLoading) {
    return (
      <div className="bg-card-bg rounded-xl border border-border p-5">
        <div className="h-5 bg-border rounded w-32 animate-pulse mb-4" />
        <div className="h-64 bg-border rounded animate-pulse" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-card-bg rounded-xl border border-border p-5">
        <h3 className="text-text-dark font-semibold text-base mb-3">Kurva S</h3>
        <p className="text-text-light text-sm text-center py-10">Belum ada data Kurva S</p>
      </div>
    )
  }

  return (
    <div className="bg-card-bg rounded-xl border border-border p-5">
      <h3 className="text-text-dark font-semibold text-base mb-4">Kurva S</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#D4E1F0" />
          <XAxis
            dataKey="minggu"
            tickFormatter={(v) => `M${v}`}
            tick={{ fontSize: 11, fill: '#8FA5C0' }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#8FA5C0' }}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`]}
            labelFormatter={(label) => `Minggu ${label}`}
          />
          <Legend />
          <ReferenceLine y={100} stroke="#27AE60" strokeDasharray="4 4" label={{ value: 'Selesai', fill: '#27AE60', fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="plan_kumulatif"
            name="Plan"
            stroke="#1A5276"
            strokeDasharray="6 3"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="aktual_kumulatif"
            name="Aktual"
            stroke="#E67E22"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#E67E22' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
