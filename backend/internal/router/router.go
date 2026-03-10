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

	// Route publik
	api.Post("/auth/login", authH.Login)
	api.Post("/auth/refresh", authH.RefreshToken)

	// Route privat — stack middleware: JWT → Tenant
	priv := api.Group("", middleware.JWTMiddleware(), middleware.TenantMiddleware())

	// Auth (privat)
	priv.Post("/auth/logout", authH.Logout)
	priv.Get("/auth/me", authH.Me)

	// User management — hanya owner
	ownerOnly := middleware.RequireRoles(string(model.RoleOwner))
	priv.Get("/users", ownerOnly, userH.ListUsers)
	priv.Post("/users", ownerOnly, userH.CreateUser)
	priv.Patch("/users/:id", ownerOnly, userH.UpdateUser)
	priv.Delete("/users/:id", ownerOnly, userH.DeleteUser)
}
