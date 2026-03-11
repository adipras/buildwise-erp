package router

import (
	"buildwise/internal/handler"
	"buildwise/internal/middleware"
	"buildwise/internal/model"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	// Health check — publik, tidak perlu auth
	app.Get("/health", handler.Health)

	// Semua route API di bawah prefix /api/v1
	api := app.Group("/api/v1")

	// Handler instances
	authH := handler.NewAuthHandler()
	userH := handler.NewUserHandler()
	proyekH := handler.NewProyekHandler()
	rabH := handler.NewRabHandler()
	pengeluaranH := handler.NewPengeluaranHandler()
	jadwalH := handler.NewJadwalHandler()
	materialH := handler.NewMaterialHandler()
	poH := handler.NewPoHandler()
	tkH := handler.NewTenagaKerjaHandler()

	// Route publik
	api.Post("/auth/login", authH.Login)
	api.Post("/auth/refresh", authH.RefreshToken)

	// Route privat — stack middleware: JWT → Tenant
	priv := api.Group("", middleware.JWTMiddleware(), middleware.TenantMiddleware())

	// Auth (privat)
	priv.Post("/auth/logout", authH.Logout)
	priv.Get("/auth/me", authH.Me)

	// Role helpers
	ownerOnly := middleware.RequireRoles(string(model.RoleOwner))
	ownerManajer := middleware.RequireRoles(string(model.RoleOwner), string(model.RoleManajer))

	// User management — hanya owner
	priv.Get("/users", ownerOnly, userH.ListUsers)
	priv.Post("/users", ownerOnly, userH.CreateUser)
	priv.Patch("/users/:id", ownerOnly, userH.UpdateUser)
	priv.Delete("/users/:id", ownerOnly, userH.DeleteUser)

	// Proyek — semua role bisa baca, owner+manajer bisa create/update, owner saja bisa delete
	priv.Get("/proyek", proyekH.ListProyek)
	priv.Post("/proyek", ownerManajer, proyekH.CreateProyek)
	priv.Get("/proyek/:id", proyekH.GetProyek)
	priv.Patch("/proyek/:id", ownerManajer, proyekH.UpdateProyek)
	priv.Delete("/proyek/:id", ownerOnly, proyekH.DeleteProyek)

	// RAB — semua role bisa baca, owner+manajer bisa create/update/delete, owner saja bisa lock
	priv.Get("/proyek/:id/rab", rabH.ListRab)
	priv.Post("/proyek/:id/rab", ownerManajer, rabH.CreateRabItem)
	priv.Post("/proyek/:id/rab/lock", ownerOnly, rabH.LockRab)
	priv.Patch("/proyek/:id/rab/:item_id", ownerManajer, rabH.UpdateRabItem)
	priv.Delete("/proyek/:id/rab/:item_id", ownerManajer, rabH.DeleteRabItem)

	// Pengeluaran — semua role bisa baca dan create, owner+manajer bisa delete
	priv.Get("/proyek/:id/pengeluaran", pengeluaranH.ListPengeluaran)
	priv.Post("/proyek/:id/pengeluaran", pengeluaranH.CreatePengeluaran)
	priv.Delete("/proyek/:id/pengeluaran/:pel_id", ownerManajer, pengeluaranH.DeletePengeluaran)

	// Milestone & Progress — owner+manajer bisa CRUD milestone; semua member bisa baca & tambah progress; owner+manajer bisa delete progress
	priv.Get("/proyek/:id/milestone", jadwalH.ListMilestone)
	priv.Post("/proyek/:id/milestone", ownerManajer, jadwalH.CreateMilestone)
	priv.Get("/proyek/:id/milestone/:mid", jadwalH.GetMilestone)
	priv.Patch("/proyek/:id/milestone/:mid", ownerManajer, jadwalH.UpdateMilestone)
	priv.Delete("/proyek/:id/milestone/:mid", ownerManajer, jadwalH.DeleteMilestone)
	priv.Post("/proyek/:id/milestone/:mid/progress", jadwalH.CreateProgress)
	priv.Get("/proyek/:id/milestone/:mid/progress", jadwalH.ListProgress)
	priv.Delete("/proyek/:id/milestone/:mid/progress/:pid", ownerManajer, jadwalH.DeleteProgress)
	priv.Get("/proyek/:id/kurva-s", jadwalH.GetKurvaS)
	priv.Get("/proyek/:id/progress-summary", jadwalH.GetProgressSummary)

	// Material (master data) — semua role bisa baca; owner+manajer bisa create/update; owner saja bisa delete
	priv.Get("/material", materialH.ListMaterial)
	priv.Post("/material", ownerManajer, materialH.CreateMaterial)
	priv.Patch("/material/:id", ownerManajer, materialH.UpdateMaterial)
	priv.Delete("/material/:id", ownerOnly, materialH.DeleteMaterial)

	// Supplier — semua role bisa baca; owner+manajer bisa create/update; owner saja bisa delete
	priv.Get("/supplier", materialH.ListSupplier)
	priv.Post("/supplier", ownerManajer, materialH.CreateSupplier)
	priv.Patch("/supplier/:id", ownerManajer, materialH.UpdateSupplier)
	priv.Delete("/supplier/:id", ownerOnly, materialH.DeleteSupplier)

	// Stok — semua role bisa baca; semua member bisa pakai material; penggunaan list bisa dibaca semua
	priv.Get("/proyek/:id/stok", poH.ListStok)
	priv.Post("/proyek/:id/stok/pakai", poH.PakaiMaterial)
	priv.Get("/proyek/:id/stok/penggunaan", poH.ListPenggunaan)

	// Purchase Order — semua role bisa baca; owner+manajer bisa create & terima; owner saja bisa delete
	priv.Get("/proyek/:id/po", poH.ListPO)
	priv.Post("/proyek/:id/po", ownerManajer, poH.CreatePO)
	priv.Get("/proyek/:id/po/:po_id", poH.GetPO)
	priv.Post("/proyek/:id/po/:po_id/terima", ownerManajer, poH.TerimaPO)
	priv.Delete("/proyek/:id/po/:po_id", ownerOnly, poH.DeletePO)

	// Pekerja (master data) — semua role bisa baca; owner+manajer bisa create/update; owner saja bisa delete
	priv.Get("/pekerja", tkH.ListPekerja)
	priv.Post("/pekerja", ownerManajer, tkH.CreatePekerja)
	priv.Patch("/pekerja/:id", ownerManajer, tkH.UpdatePekerja)
	priv.Delete("/pekerja/:id", ownerOnly, tkH.DeletePekerja)

	// Penugasan ke proyek
	priv.Get("/proyek/:id/pekerja", tkH.ListPekerjaProyek)
	priv.Post("/proyek/:id/pekerja", ownerManajer, tkH.AssignPekerja)
	priv.Delete("/proyek/:id/pekerja/:pekerja_id", ownerManajer, tkH.UnassignPekerja)

	// Absensi — semua member bisa input (mandor di lapangan); semua bisa baca
	priv.Get("/proyek/:id/absensi", tkH.GetAbsensi)
	priv.Post("/proyek/:id/absensi", tkH.InputAbsensiMassal)

	// Rekap & pembayaran upah — owner+manajer approve & bayar
	priv.Get("/proyek/:id/rekap-upah", tkH.GetRekapUpah)
	priv.Post("/proyek/:id/upah/approve-bayar", ownerManajer, tkH.ApproveBayar)
	priv.Get("/proyek/:id/upah", tkH.ListPembayaranUpah)
}
