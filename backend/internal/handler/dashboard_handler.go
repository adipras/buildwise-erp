package handler

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"buildwise/internal/service"
)

type DashboardHandler struct {
	svc service.DashboardService
}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{svc: service.NewDashboardService()}
}

// GET /dashboard/overview
func (h *DashboardHandler) GetOverview(c *fiber.Ctx) error {
	perusahaanID := c.Locals("perusahaan_id").(string)
	data, err := h.svc.GetOverview(perusahaanID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(data)
}

// GET /dashboard/proyek/:id
func (h *DashboardHandler) GetProyekDashboard(c *fiber.Ctx) error {
	perusahaanID := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	data, err := h.svc.GetProyekDashboard(perusahaanID, proyekID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "proyek tidak ditemukan"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(data)
}
