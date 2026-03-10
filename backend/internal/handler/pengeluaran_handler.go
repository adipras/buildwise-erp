package handler

import (
	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type PengeluaranHandler struct {
	svc *service.PengeluaranService
}

func NewPengeluaranHandler() *PengeluaranHandler {
	return &PengeluaranHandler{svc: service.NewPengeluaranService()}
}

// ListPengeluaran godoc
// GET /api/v1/proyek/:id/pengeluaran
func (h *PengeluaranHandler) ListPengeluaran(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	items, err := h.svc.ListPengeluaran(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": items})
}

// CreatePengeluaran godoc
// POST /api/v1/proyek/:id/pengeluaran
func (h *PengeluaranHandler) CreatePengeluaran(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	userID, _ := c.Locals("user_id").(string)
	proyekID := c.Params("id")

	var req service.CreatePengeluaranRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "format request tidak valid"})
	}

	item, err := h.svc.CreatePengeluaran(proyekID, perusahaanID, userID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": item, "message": "pengeluaran berhasil dicatat"})
}

// DeletePengeluaran godoc
// DELETE /api/v1/proyek/:id/pengeluaran/:pel_id
func (h *PengeluaranHandler) DeletePengeluaran(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	pelID := c.Params("pel_id")

	if err := h.svc.DeletePengeluaran(pelID, proyekID, perusahaanID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "pengeluaran berhasil dihapus"})
}
