package handler

import (
	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type ProyekHandler struct {
	svc *service.ProyekService
}

func NewProyekHandler() *ProyekHandler {
	return &ProyekHandler{svc: service.NewProyekService()}
}

// ListProyek godoc
// GET /api/v1/proyek
func (h *ProyekHandler) ListProyek(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)

	summaries, err := h.svc.ListProyek(perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data proyek"})
	}
	return c.JSON(fiber.Map{"data": summaries})
}

// CreateProyek godoc
// POST /api/v1/proyek
func (h *ProyekHandler) CreateProyek(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)

	var req service.CreateProyekRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "format request tidak valid"})
	}

	proyek, err := h.svc.CreateProyek(req, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": proyek, "message": "proyek berhasil dibuat"})
}

// GetProyek godoc
// GET /api/v1/proyek/:id
func (h *ProyekHandler) GetProyek(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")

	summary, err := h.svc.GetProyek(id, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": summary})
}

// UpdateProyek godoc
// PATCH /api/v1/proyek/:id
func (h *ProyekHandler) UpdateProyek(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")

	var req service.UpdateProyekRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "format request tidak valid"})
	}

	proyek, err := h.svc.UpdateProyek(id, perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": proyek, "message": "proyek berhasil diupdate"})
}

// DeleteProyek godoc
// DELETE /api/v1/proyek/:id  (hanya owner)
func (h *ProyekHandler) DeleteProyek(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")

	if err := h.svc.DeleteProyek(id, perusahaanID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "proyek berhasil dihapus"})
}
