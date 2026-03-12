# BuildWise ERP

Sistem ERP berbasis web untuk manajemen proyek konstruksi skala menengah. Dibangun dengan Go (Fiber) di backend dan React di frontend, dikemas dalam Docker untuk kemudahan deployment lokal maupun production.

---

## Fitur Utama

| Modul | Fitur |
|---|---|
| **Auth & RBAC** | Login JWT, refresh token, 4 level role (owner / manajer / mandor / admin_keuangan) |
| **Manajemen Proyek** | CRUD proyek, status tracking, multi-tenant per perusahaan |
| **RAB & Anggaran** | Rencana Anggaran Biaya per item, lock RAB, pencatatan pengeluaran |
| **Jadwal & Progress** | Milestone, update progress fisik, foto progress, Kurva-S, progress summary |
| **Material & Stok** | Master material & supplier, Purchase Order, penerimaan barang, stok per proyek, alert kritis |
| **Tenaga Kerja** | Master pekerja, penugasan ke proyek, absensi massal (idempotent), rekap & pembayaran upah |
| **Dashboard** | Overview semua proyek, alert milestone terlambat & stok kritis, stat cards, quick actions |
| **Laporan Keuangan** | RAB vs realisasi per item, per kategori, per bulan |

---

## Tech Stack

### Backend
| | |
|---|---|
| Bahasa | Go 1.24 |
| Framework | [Fiber v2](https://gofiber.io) |
| ORM | [GORM](https://gorm.io) + driver MySQL |
| Auth | JWT (gofiber/contrib/jwt + golang-jwt/jwt v5) |
| Database | MySQL 8 |
| Cache / Queue | Redis 7 |
| Multi-tenant | Semua data terisolasi per `perusahaan_id` |

### Frontend
| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Routing | React Router v6 |
| State server | TanStack Query v5 |
| State client | Zustand |
| Form | React Hook Form + Zod |
| Chart | Recharts |
| Styling | Tailwind CSS v3 |

---

## Prasyarat

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2
- [Make](https://www.gnu.org/software/make/) (opsional, untuk shortcut)
- Go 1.24+ (hanya jika ingin run backend di luar Docker)
- Node.js 20+ (hanya jika ingin run frontend di luar Docker)

---

## Quickstart

```bash
# 1. Clone repo
git clone <repo-url> buildwise-erp
cd buildwise-erp

# 2. Jalankan seluruh stack (DB + Redis + API + Frontend + Adminer)
make up
# atau: docker compose up -d

# 3. Seed data awal (1 perusahaan + 4 user)
make seed

# 4. Buka aplikasi
#    Frontend  → http://localhost:3010
#    API       → http://localhost:8090
#    Adminer   → http://localhost:8081
```

---

## Akun Bawaan (setelah seed)

| Role | Email | Password |
|---|---|---|
| Owner | owner@buildwise.id | owner123 |
| Manajer | manajer@buildwise.id | manajer123 |
| Mandor | mandor@buildwise.id | mandor123 |
| Admin Keuangan | admin@buildwise.id | admin123 |

---

## Perintah Make

```bash
make help          # Tampilkan semua perintah
```

### Stack
```bash
make up            # Jalankan semua container
make down          # Hentikan semua container
make rebuild       # Rebuild image lalu jalankan ulang
make logs          # Log semua container (follow)
make logs-api      # Log API saja
make logs-fe       # Log frontend saja
make ps            # Status container
make health        # Cek endpoint /health
```

### Database
```bash
make seed          # Seed data awal
make db-shell      # Masuk MySQL shell
make db-reset      # ⚠ Reset DB (hapus semua data)
```

### Backend
```bash
make build-backend # Build binary lokal
make test-backend  # Jalankan unit test
make lint-backend  # go vet
make tidy          # go mod tidy
```

### Frontend
```bash
make build-fe      # Build production (dist/)
make lint-fe       # TypeScript type check
make install-fe    # npm install
```

---

## Struktur Proyek

```
buildwise-erp/
├── backend/
│   ├── cmd/
│   │   ├── main/           # Entry point aplikasi
│   │   └── seed/           # CLI seed data
│   └── internal/
│       ├── config/         # Load environment variables
│       ├── database/       # Koneksi GORM + AutoMigrate
│       ├── handler/        # HTTP handler (Fiber)
│       ├── middleware/      # JWT, Tenant, RBAC
│       ├── model/          # Model GORM (20+ entitas)
│       ├── repository/     # Layer akses database
│       ├── router/         # Definisi semua route
│       └── service/        # Business logic
├── frontend/
│   └── src/
│       ├── components/     # Komponen UI (Layout, shared)
│       ├── hooks/          # TanStack Query hooks
│       ├── pages/          # Halaman React
│       ├── types/          # TypeScript types
│       └── utils/          # Helper (formatRupiah, dll)
├── docker-compose.yml
├── Makefile
└── PROGRESS.md             # Log progress pengembangan
```

---

## API Endpoints

### Auth
```
POST /api/v1/auth/login      — Login, dapat access + refresh token
POST /api/v1/auth/refresh    — Perbarui access token
POST /api/v1/auth/logout     — Logout (hapus refresh token)
GET  /api/v1/auth/me         — Info user yang sedang login
```

### Proyek & RAB
```
GET|POST         /api/v1/proyek
GET|PATCH|DELETE /api/v1/proyek/:id
GET|POST         /api/v1/proyek/:id/rab
POST             /api/v1/proyek/:id/rab/lock
GET|POST         /api/v1/proyek/:id/pengeluaran
```

### Jadwal & Progress
```
GET|POST         /api/v1/proyek/:id/milestone
GET|PATCH|DELETE /api/v1/proyek/:id/milestone/:mid
GET|POST         /api/v1/proyek/:id/milestone/:mid/progress
GET              /api/v1/proyek/:id/kurva-s
GET              /api/v1/proyek/:id/progress-summary
```

### Material, Supplier & Stok
```
GET|POST|PATCH|DELETE /api/v1/material
GET|POST|PATCH|DELETE /api/v1/supplier
GET|POST              /api/v1/proyek/:id/po
POST                  /api/v1/proyek/:id/po/:po_id/terima
GET                   /api/v1/proyek/:id/stok
POST                  /api/v1/proyek/:id/stok/pakai
```

### Tenaga Kerja
```
GET|POST|PATCH|DELETE /api/v1/pekerja
GET|POST|DELETE       /api/v1/proyek/:id/pekerja
GET|POST              /api/v1/proyek/:id/absensi
GET                   /api/v1/proyek/:id/rekap-upah
POST                  /api/v1/proyek/:id/upah/approve-bayar
GET                   /api/v1/proyek/:id/upah
```

### Dashboard & Laporan
```
GET /api/v1/dashboard/overview
GET /api/v1/dashboard/proyek/:id
GET /api/v1/laporan/proyek/:id/keuangan
```

---

## RBAC — Hak Akses per Role

| Aksi | Owner | Manajer | Mandor | Admin Keuangan |
|---|:---:|:---:|:---:|:---:|
| Baca semua data | ✅ | ✅ | ✅ | ✅ |
| Kelola proyek | ✅ | ✅ | — | — |
| Input pengeluaran | ✅ | ✅ | ✅ | ✅ |
| Input absensi | ✅ | ✅ | ✅ | — |
| Approve & bayar upah | ✅ | ✅ | — | — |
| Kelola user | ✅ | — | — | — |
| Hapus data kritis | ✅ | — | — | — |

---

## Environment Variables

Salin `.env.example` ke `.env` dan sesuaikan nilainya:

```bash
cp backend/.env.example backend/.env
```

| Variable | Keterangan | Default (dev) |
|---|---|---|
| `APP_ENV` | `development` / `production` | `development` |
| `DB_DSN` | MySQL DSN | sudah diset di docker-compose |
| `REDIS_ADDR` | Alamat Redis | `redis:6379` |
| `JWT_SECRET` | Secret signing JWT | wajib diganti di production |
| `JWT_EXPIRES_HOURS` | Masa berlaku access token | `24` |
| `PORT` | Port server | `8080` |
| `FONNTE_TOKEN` | Token API WhatsApp (Fonnte) | — |
| `R2_*` | Cloudflare R2 (upload foto) | — |

---

## Lisensi

Proyek ini bersifat privat.
