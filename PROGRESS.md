# BuildWise ERP — Dokumen Progress Pengembangan

## Status Keseluruhan

| Fase | Status | Keterangan |
|---|---|---|
| Setup & Infrastruktur | ✅ Selesai | Project structure, Docker, semua model |
| Auth & RBAC | ✅ Selesai | Backend + Frontend lengkap |
| Modul RAB & Anggaran | ✅ Selesai | Backend + Frontend lengkap |
| Modul Jadwal & Progress | ✅ Selesai | Backend + Frontend lengkap |
| Modul Material & Stok | ✅ Selesai | Backend + Frontend lengkap |
| Modul Tenaga Kerja | ✅ Selesai | Backend + Frontend lengkap |
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

## ✅ FASE 2 — Auth & RBAC (Selesai)

### Yang Sudah Dibuat

**Backend:**
- [x] `internal/model/user.go` — tambah field `RefreshToken` (nullable, indexed)
- [x] `internal/repository/auth_repo.go` — FindByEmail, FindByID, FindByRefreshToken, SaveRefreshToken, ClearRefreshToken
- [x] `internal/repository/user_repo.go` — FindAll, FindByID, EmailExists, Create, Update
- [x] `internal/service/auth_service.go` — Login (bcrypt), Refresh, Logout, Me + `issueTokens` (JWT + UUID refresh token)
- [x] `internal/service/user_service.go` — ListUsers, CreateUser (bcrypt hash), UpdateUser, DeleteUser
- [x] `internal/handler/auth_handler.go` — POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me
- [x] `internal/handler/user_handler.go` — GET/POST /users, PATCH/DELETE /users/:id (owner only)
- [x] `internal/router/router.go` — semua route terdaftar dengan middleware stack
- [x] `cmd/seed/main.go` — seed 1 perusahaan + 4 user (owner/manajer/mandor/admin_keuangan)
- [x] `go.mod` — tambah `golang.org/x/crypto` untuk bcrypt

**Frontend:**
- [x] `src/lib/api.ts` — axios instance + interceptor auto-attach token + auto-refresh 401
- [x] `src/hooks/useAuth.tsx` — AuthContext + AuthProvider + useAuth hook (login/logout/restore session)
- [x] `src/components/ProtectedRoute.tsx` — guard auth + optional role check + loading spinner
- [x] `src/pages/Login.tsx` — form email/password (react-hook-form + zod), desain navy+accent
- [x] `src/App.tsx` — AuthProvider wrapping, route guard aktif

### Akun Seed
| Role | Email | Password |
|---|---|---|
| owner | owner@buildwise.id | owner123 |
| manajer | manajer@buildwise.id | manajer123 |
| mandor | mandor@buildwise.id | mandor123 |
| admin_keuangan | admin@buildwise.id | admin123 |

### Verifikasi
```
✅ go build ./...       → berhasil (0 error)
✅ go vet ./...         → clean
✅ tsc --noEmit         → 0 error TypeScript
```

---

## ✅ FASE 3 — Modul RAB & Anggaran (Selesai)

### Yang Sudah Dibuat

**Backend:**
- [x] `repository/proyek_repo.go` — CRUD proyek + `GetTotalRab` / `GetTotalRealisasi`
- [x] `repository/rab_repo.go` — CRUD RAB item + `LockAll` / `GetStatusLock`
- [x] `repository/pengeluaran_repo.go` — CRUD pengeluaran (soft delete) + `SumByRabItem`
- [x] `service/proyek_service.go` — `ProyekSummary` dengan alert_level warning/danger
- [x] `service/rab_service.go` — CRUD + LockRab, `ErrRabLocked` → HTTP 403, `TotalAnggaran = Volume × HargaSatuan`
- [x] `service/pengeluaran_service.go` — CRUD pengeluaran
- [x] `handler/proyek_handler.go`, `rab_handler.go`, `pengeluaran_handler.go` — 14 route baru
- [x] `router/router.go` — RBAC: owner+manajer CRUD; owner-only delete proyek & lock RAB

**Frontend:**
- [x] `AppLayout` + `Sidebar` — navigasi responsif, mobile hamburger, user info, logout
- [x] `ProyekCard` — status badge, progress bar (alert_level aware), format Rupiah
- [x] `pages/Proyek/index.tsx` — grid + filter 5 status + skeleton + empty state + modal tambah
- [x] `pages/Proyek/ProyekDetail.tsx` — tabs RAB / Jadwal / Pengeluaran / Info + modal edit
- [x] `components/Proyek/RabTab.tsx` — donut chart, summary cards, alert banner, tabel, lock RAB + confirm
- [x] `components/Proyek/PengeluaranTab.tsx` — tabel, total, modal form catat pengeluaran
- [x] `hooks/useProyek.ts` — semua query + mutation hooks (TanStack Query v5)

### Verifikasi
```
✅ go build ./...  → 0 error
✅ tsc --noEmit    → 0 error TypeScript
```

---

## ✅ FASE 4 — Modul Jadwal & Progress (Selesai)

### Yang Sudah Dibuat

**Backend:**
- [x] `repository/milestone_repo.go` — CRUD + `GetWeightedProgress` (SQL weighted-avg) + `GetCurrentPlannedProgress`
- [x] `repository/progress_repo.go` — CRUD ProgressUpdate + FotoProgress (soft delete)
- [x] `repository/kurvas_repo.go` — `KurvaSPoint` + `GetKurvaS` (iterasi per minggu, plan & aktual kumulatif)
- [x] `service/jadwal_service.go` — CRUD milestone + `computeStatus()` otomatis (selesai/terlambat/sedang_berjalan/belum_mulai)
- [x] `service/progress_service.go` — CreateProgress: replace `actual_persen`, recalc status, simpan foto
- [x] `handler/jadwal_handler.go` — 10 endpoint + router update dengan RBAC

**Frontend:**
- [x] `hooks/useJadwal.ts` — semua query + mutation (milestone, progress, kurva-s, summary)
- [x] `components/Proyek/JadwalTab.tsx` — summary card, Kurva S, Gantt, list milestone + modal
- [x] `components/Proyek/GanttChart.tsx` — CSS murni, bar posisi %, garis "Hari Ini", tooltip hover
- [x] `components/Proyek/KurvaSChart.tsx` — Recharts LineChart (plan putus-putus vs aktual solid)
- [x] `components/Proyek/MilestoneCard.tsx` — badge status, dual progress bar, `animate-pulse` untuk TERLAMBAT
- [x] `components/Proyek/ProgressUpdateModal.tsx` — slider besar mobile-friendly, catatan, multi-foto

### Verifikasi
```
✅ go build ./...  → 0 error
✅ tsc --noEmit    → 0 error TypeScript
```

---

## ✅ FASE 5 — Modul Material & Stok (Selesai)

### Yang Sudah Dibuat

**Backend:**
- [x] `repository/material_repo.go` — CRUD Material (scoped perusahaan_id)
- [x] `repository/supplier_repo.go` — CRUD Supplier
- [x] `repository/stok_repo.go` — StokMaterial `GetOrCreate`/`Update` + PenggunaanMaterial create/list
- [x] `repository/po_repo.go` — CRUD PurchaseOrder + PoItem (dengan Preload Supplier & Items.Material)
- [x] `service/material_service.go` — CRUD Material + Supplier, validasi nama wajib
- [x] `service/po_service.go` — CreatePO (multi-item), TerimaPO (update stok otomatis, cek is_kritis), DeletePO, ListStok (+ computed stok_sisa), PakaiMaterial (validasi stok cukup)
- [x] `handler/material_handler.go` — 8 endpoint Material & Supplier
- [x] `handler/po_handler.go` — 8 endpoint PO, Stok, Penggunaan
- [x] `router/router.go` — semua route terdaftar dengan RBAC

**Route yang ditambahkan:**
```
GET  /material                         — semua role
POST /material                         — owner+manajer
PATCH/DELETE /material/:id             — owner+manajer / owner
GET  /supplier                         — semua role
POST /supplier                         — owner+manajer
PATCH/DELETE /supplier/:id             — owner+manajer / owner
GET  /proyek/:id/stok                  — semua role
POST /proyek/:id/stok/pakai            — semua member (mandor dll)
GET  /proyek/:id/stok/penggunaan       — semua role
GET  /proyek/:id/po                    — semua role
POST /proyek/:id/po                    — owner+manajer
GET  /proyek/:id/po/:po_id             — semua role
POST /proyek/:id/po/:po_id/terima      — owner+manajer (update stok otomatis)
DELETE /proyek/:id/po/:po_id           — owner saja
```

**Frontend:**
- [x] `types/index.ts` — tambah `Material`, `Supplier`, `StatusPO`, `PoItem`, `PurchaseOrder`, `StokMaterial`, `StokInfo`, `PenggunaanMaterial`
- [x] `hooks/useMaterial.ts` — semua query + mutation hooks (material, supplier, stok, PO, penggunaan)
- [x] `components/Proyek/MaterialTab.tsx` — 3 sub-tabs:
  - **Stok**: kartu grid dengan progress bar hijau/kuning/merah, banner alert KRITIS, modal catat pemakaian
  - **Purchase Order**: tabel PO, tombol Terima/Hapus, modal buat PO multi-item dengan dynamic row + total nilai real-time
  - **Riwayat Pemakaian**: tabel riwayat penggunaan material
- [x] `pages/Proyek/ProyekDetail.tsx` — tambah tab "Material"

### Verifikasi
```
✅ go build ./...  → 0 error
✅ tsc --noEmit    → 0 error TypeScript
```

---

## ✅ FASE 6 — Modul Tenaga Kerja (Selesai)

**Backend:**
- [x] `repository/pekerja_repo.go` — CRUD Pekerja scoped by perusahaan_id
- [x] `repository/penugasan_repo.go` — assign / unassign pekerja ke proyek
- [x] `repository/absensi_repo.go` — FindByTanggal, FindByPeriode, FindOne (idempotent upsert)
- [x] `repository/upah_repo.go` — PembayaranUpah CRUD
- [x] `service/tenaga_kerja_service.go` — rekap upah, ApproveBayar (auto-create Pengeluaran kategori "Upah")
- [x] `handler/tenaga_kerja_handler.go` — semua HTTP handler

**Route yang ditambahkan:**
```
GET  /pekerja                              — semua role
POST /pekerja                              — owner+manajer
PATCH/DELETE /pekerja/:id                  — owner+manajer / owner
GET  /proyek/:id/penugasan                 — semua role
POST /proyek/:id/penugasan                 — owner+manajer
DELETE /proyek/:id/penugasan/:p_id         — owner+manajer
GET  /proyek/:id/absensi                   — semua role
POST /proyek/:id/absensi                   — semua authenticated (idempotent upsert)
GET  /proyek/:id/upah/rekap                — semua role
POST /proyek/:id/upah/bayar                — owner+manajer (buat Pengeluaran otomatis)
GET  /proyek/:id/upah/riwayat              — semua role
GET  /proyek/:id/upah/:bayar_id            — semua role
```

**Frontend:**
- [x] `types/index.ts` — tambah `TipePekerja`, `StatusAbsensi`, `Pekerja`, `PenugasanProyek`, `Absensi`, `RekapUpahItem`, `RekapUpahResponse`, `PembayaranUpah`
- [x] `hooks/useTenagaKerja.ts` — semua query + mutation hooks
- [x] `components/Proyek/TenagaKerjaTab.tsx` — 3 sub-tabs:
  - **Pekerja**: list pekerja aktif ditugaskan, tombol assign/unassign, form assign dengan dropdown
  - **Absensi**: grid mobile-first tap-to-cycle (hadir/lembur/setengah/absen), badge warna, submit massal
  - **Rekap Upah**: tabel rekap per pekerja per periode, form pilih periode, tombol Approve & Bayar
- [x] `pages/Proyek/ProyekDetail.tsx` — tambah tab "Tenaga Kerja"

### Verifikasi
```
✅ go build ./...  → 0 error
✅ tsc --noEmit    → 0 error TypeScript
```

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
Auth & RBAC            ████████████████████  100%  ✅
RAB & Anggaran         ████████████████████  100%  ✅
Jadwal & Progress      ████████████████████  100%  ✅
Material & Stok        ████████████████████  100%  ✅
Tenaga Kerja           ░░░░░░░░░░░░░░░░░░░░    0%
Dashboard & Laporan    ░░░░░░░░░░░░░░░░░░░░    0%
Notifikasi             ░░░░░░░░░░░░░░░░░░░░    0%
Deployment             ░░░░░░░░░░░░░░░░░░░░    0%
─────────────────────────────────────────────
Total                  ██████████████░░░░░░   ~56%
```
