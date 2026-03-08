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

	// Route publik
	// api.Post("/auth/login", handler.Login)
	// api.Post("/auth/refresh", handler.RefreshToken)

	// Route privat — stack middleware: JWT → Tenant → RequireRoles
	auth := api.Group("", middleware.JWTMiddleware(), middleware.TenantMiddleware())

	// Auth
	// auth.Post("/auth/logout", handler.Logout)
	// auth.Get("/auth/me", handler.Me)

	// User management (hanya owner)
	// auth.Get("/users", middleware.RequireRoles(string(model.RoleOwner)), handler.ListUsers)

	// Proyek
	// auth.Post("/proyek", middleware.RequireRoles(string(model.RoleOwner), string(model.RoleManajer)), handler.CreateProyek)

	// Notifikasi
	// auth.Get("/notifikasi", handler.ListNotifikasi)

	// Gunakan variabel auth & model agar tidak error "imported and not used"
	_ = auth
	_ = model.RoleOwner
}
