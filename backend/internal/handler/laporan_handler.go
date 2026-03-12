package handler

import (
	"errors"

	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type LaporanHandler struct {
	svc service.LaporanService
}

func NewLaporanHandler() *LaporanHandler {
	return &LaporanHandler{svc: service.NewLaporanService()}
}

// GET /laporan/proyek/:id/keuangan
func (h *LaporanHandler) GetLaporanKeuangan(c *fiber.Ctx) error {
	perusahaanID := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	data, err := h.svc.GetLaporanKeuangan(perusahaanID, proyekID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "proyek tidak ditemukan"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(data)
}
