package main

import (
	"fmt"
	"log"

	"buildwise/internal/config"
	"buildwise/internal/database"
	"buildwise/internal/router"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// Muat konfigurasi dari environment / .env
	config.Load()

	// Koneksi ke database
	database.Connect()

	// AutoMigrate hanya di development
	if config.App.AppEnv == "development" {
		database.AutoMigrate()
	}

	// Inisialisasi Fiber
	app := fiber.New(fiber.Config{
		AppName: "BuildWise ERP v1.0",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"message": err.Error(),
			})
		},
	})

	// Middleware global
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PATCH, DELETE, OPTIONS",
	}))

	// Daftarkan semua route
	router.Setup(app)

	addr := fmt.Sprintf(":%s", config.App.Port)
	log.Printf("BuildWise ERP berjalan di http://localhost%s", addr)
	log.Fatal(app.Listen(addr))
}
