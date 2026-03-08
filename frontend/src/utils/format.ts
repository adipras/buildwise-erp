export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Contoh: formatRupiahShort(1500000) → "1jt"
export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}jt`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`
  return String(amount)
}

// Contoh: formatTanggal("2026-03-08") → "8 Maret 2026"
export function formatTanggal(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date))
}
