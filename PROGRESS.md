# BuildWise ERP — Dokumen Progress Pengembangan

## Status Keseluruhan

| Fase | Status | Keterangan |
|---|---|---|
| Setup & Infrastruktur | ✅ Selesai | Project structure, Docker, semua model |
| Auth & RBAC | 🔲 Belum mulai | |
| Modul RAB & Anggaran | 🔲 Belum mulai | |
| Modul Jadwal & Progress | 🔲 Belum mulai | |
| Modul Material & Stok | 🔲 Belum mulai | |
| Modul Tenaga Kerja | 🔲 Belum mulai | |
| Dashboard & Laporan | 🔲 Belum mulai | |
| Notifikasi WhatsApp | 🔲 Belum mulai | |
| Deployment Production | 🔲 Belum mulai | |

---

## ✅ FASE 1 — Setup & Infrastruktur (Selesai)

### Yang Sudah Dibuat

**Root**
- [x] `docker-compose.yml` — MySQL 8, Redis, Go API (:8090), React (:3010), Adminer (:8081)
- [x] `.env.example` — template semua environment variable
- [x] `.gitignore`

**Backend (`backend/`)**
- [x] `go.mod` — semua dependency (Fiber v2, GORM, JWT, asynq, validator, uuid, bcrypt)
- [x] `Dockerfile` (production multi-stage) + `Dockerfile.dev` (air hot reload) + `.air.toml`
- [x] `cmd/main/main.go` — entry point Fiber dengan CORS, logger, recover middleware
- [x] `internal/config/config.go` — load env vars
- [x] `internal/database/database.go` — koneksi GORM + AutoMigrate (dev)
- [x] `internal/model/` — **20 model GORM lengkap**:
  - `base.go` — `BaseModel` (UUID, timestamps, soft delete, perusahaan_id)
  - `user.go` — `Perusahaan`, `User` (4 role enum)
  - `proyek.go` — `Proyek`, `RabItem`, `Pengeluaran`
  - `jadwal.go` — `Milestone`, `ProgressUpdate`, `FotoProgress`
  - `material.go` — `Material`, `KebutuhanMaterial`, `Supplier`, `PurchaseOrder`, `PoItem`, `StokMaterial`, `PenggunaanMaterial`
  - `tenaga_kerja.go` — `Pekerja`, `PenugasanProyek`, `Absensi`, `PembayaranUpah`
  - `notifikasi.go` — `Notifikasi`
- [x] `internal/middleware/auth.go` — `JWTMiddleware`, `TenantMiddleware`, `RequireRoles`
- [x] `internal/handler/health.go` — `GET /health`
- [x] `internal/router/router.go` — struktur route siap diisi

**Frontend (`frontend/`)**
- [x] `package.json` — React 18, React Router v6, TanStack Query, Zustand, React Hook Form, Zod, Recharts
- [x] `vite.config.ts` — proxy `/api` ke backend
- [x] `tailwind.config.js` — semua custom color design system BuildWise
- [x] `tsconfig.json`, `postcss.config.js`
- [x] `src/main.tsx`, `src/App.tsx` — routing dasar
- [x] `src/types/index.ts` — semua TypeScript types (20 entitas)
- [x] `src/utils/format.ts` — `formatRupiah`, `formatRupiahShort`, `formatTanggal`

### Verifikasi

```
✅ go build ./...           → berhasil (0 error)
✅ docker compose build     → semua image terbuild
✅ docker compose up -d     → semua 5 container running
✅ GET /health              → {"status":"ok","message":"BuildWise ERP berjalan normal"}
```

---

## 🔲 FASE 2 — Auth & RBAC

**Backend:**
- [ ] `internal/service/auth_service.go` — login, refresh token, logout
- [ ] `internal/repository/auth_repo.go` — cari user by email, simpan refresh token
- [ ] `internal/handler/auth_handler.go` — POST /auth/login, /refresh, /logout, GET /auth/me
- [ ] `internal/handler/user_handler.go` — CRUD user (hanya owner)
- [ ] `cmd/seed/main.go` — seed 1 perusahaan + 4 user (1 per role)

**Frontend:**
- [ ] `src/pages/Login.tsx` — form email/password, desain navy+accent
- [ ] `src/hooks/useAuth.ts` — AuthContext, login/logout, simpan token ke localStorage
- [ ] `src/components/ProtectedRoute.tsx` — redirect ke /login jika belum auth
- [ ] Route guard di App.tsx

---

## 🔲 FASE 3 — Modul RAB & Anggaran

**Backend:**
- [ ] CRUD Proyek (`/proyek`)
- [ ] CRUD RAB Item (`/proyek/:id/rab`) + lock RAB
- [ ] Catat pengeluaran + laporan laba-rugi
- [ ] Kalkulasi realisasi real-time (sum pengeluaran per rab_item_id)
- [ ] Alert 80% / 100% anggaran

**Frontend:**
- [ ] Halaman daftar proyek dengan progress card
- [ ] Halaman RAB — tabel interaktif, progress bar, donut chart (recharts)
- [ ] Form tambah/edit item RAB
- [ ] Tombol "Kunci RAB" + dialog konfirmasi
- [ ] Alert banner anggaran mendekati batas

---

## 🔲 FASE 4 — Modul Jadwal & Progress

**Backend:**
- [ ] CRUD Milestone
- [ ] POST progress update + upload foto (pre-signed R2 URL)
- [ ] GET kurva-s → `[{minggu, plan_kumulatif, aktual_kumulatif}]`
- [ ] Kalkulasi weighted average progress proyek
- [ ] Auto-set status `TERLAMBAT` jika actual < planned - 10

**Frontend:**
- [ ] Gantt chart (CSS murni, tanpa library)
- [ ] Kurva S LineChart (recharts)
- [ ] Form update progress mobile-friendly (slider, foto, catatan)
- [ ] Badge status dengan animasi pulse untuk TERLAMBAT

---

## 🔲 FASE 5 — Modul Material & Stok

**Backend:**
- [ ] Master material + generate kebutuhan dari koefisien SNI (20 koefisien)
- [ ] CRUD Purchase Order + penerimaan (update stok otomatis)
- [ ] Catat penggunaan material (validasi stok tersedia)
- [ ] Stok real-time: `SUM(qty_masuk) - SUM(qty_terpakai)`
- [ ] Flag `is_kritis` + alert material di bawah minimum

**Frontend:**
- [ ] Kartu stok dengan progress bar (hijau/kuning/merah)
- [ ] Banner alert merah material kritis
- [ ] Form PO multi-item + preview total nilai
- [ ] Form penerimaan (qty dipesan vs diterima)

---

## 🔲 FASE 6 — Modul Tenaga Kerja

**Backend:**
- [ ] CRUD Pekerja + assign ke proyek
- [ ] Input absensi massal (idempoten per mandor per tanggal)
- [ ] Kalkulasi upah otomatis (hadir/setengah/lembur/tidak hadir)
- [ ] Rekap upah mingguan/bulanan
- [ ] Approve & bayar → auto-buat record Pengeluaran kategori 'tenaga_kerja'

**Frontend:**
- [ ] Form absensi massal (toggle besar, mobile-first)
- [ ] Tabel rekap upah (baris pekerja × kolom hari)
- [ ] Tombol "Approve & Bayar" + dialog konfirmasi

---

## 🔲 FASE 7 — Dashboard & Laporan

**Backend:**
- [ ] `GET /dashboard/overview` — ringkasan semua proyek
- [ ] `GET /dashboard/proyek/:id` — ringkasan 1 proyek
- [ ] `GET /laporan/proyek/:id/keuangan` — RAB vs realisasi
- [ ] `GET /laporan/proyek/:id/export` — export PDF

**Frontend:**
- [ ] Overview cards (proyek aktif, total anggaran, realisasi, pekerja)
- [ ] Alert panel — milestone terlambat + material kritis
- [ ] Feed aktivitas terbaru
- [ ] Quick actions shortcuts

---

## 🔲 FASE 8 — Notifikasi WhatsApp

- [ ] `internal/worker/notifikasi_worker.go` — asynq task handler
- [ ] `internal/service/notifikasi_service.go` — template WA Bahasa Indonesia
- [ ] Rate limiting 10 WA/menit per perusahaan
- [ ] Bell icon + dropdown notifikasi (frontend)
- [ ] Halaman `/notifikasi` riwayat lengkap

---

## 🔲 FASE 9 — Deployment Production

- [ ] Cloudflare Pages — frontend
- [ ] Fly.io / Render — backend (`Dockerfile` multi-stage sudah ada)
- [ ] PlanetScale / Aiven — MySQL production
- [ ] Upstash Redis — untuk asynq
- [ ] GitHub Actions CI/CD (staging on push main, production on tag v*.*.*)

---

## Ringkasan Progress

```
Setup & Infrastruktur  ████████████████████  100%  ✅
Auth & RBAC            ░░░░░░░░░░░░░░░░░░░░    0%
RAB & Anggaran         ░░░░░░░░░░░░░░░░░░░░    0%
Jadwal & Progress      ░░░░░░░░░░░░░░░░░░░░    0%
Material & Stok        ░░░░░░░░░░░░░░░░░░░░    0%
Tenaga Kerja           ░░░░░░░░░░░░░░░░░░░░    0%
Dashboard & Laporan    ░░░░░░░░░░░░░░░░░░░░    0%
Notifikasi             ░░░░░░░░░░░░░░░░░░░░    0%
Deployment             ░░░░░░░░░░░░░░░░░░░░    0%
─────────────────────────────────────────────
Total                  ██░░░░░░░░░░░░░░░░░░   ~11%
```
