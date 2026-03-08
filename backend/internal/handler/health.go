package handler

import (
	"buildwise/internal/database"

	"github.com/gofiber/fiber/v2"
)

// Health adalah endpoint untuk health check (digunakan oleh Railway/Fly.io).
func Health(c *fiber.Ctx) error {
	// Cek koneksi database
	sqlDB, err := database.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status":  "error",
			"message": "database tidak dapat dijangkau",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "ok",
		"message": "BuildWise ERP berjalan normal",
	})
}
