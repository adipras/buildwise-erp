package handler

import (
	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type JadwalHandler struct {
	jadwalSvc   service.JadwalService
	progressSvc service.ProgressService
}

func NewJadwalHandler() *JadwalHandler {
	return &JadwalHandler{
		jadwalSvc:   service.NewJadwalService(),
		progressSvc: service.NewProgressService(),
	}
}

// ListMilestone godoc
// GET /api/v1/proyek/:id/milestone
func (h *JadwalHandler) ListMilestone(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	milestones, err := h.jadwalSvc.ListMilestone(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": milestones})
}

// CreateMilestone godoc
// POST /api/v1/proyek/:id/milestone
func (h *JadwalHandler) CreateMilestone(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	var req service.CreateMilestoneRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}

	m, err := h.jadwalSvc.CreateMilestone(proyekID, perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": m, "message": "milestone berhasil dibuat"})
}

// GetMilestone godoc
// GET /api/v1/proyek/:id/milestone/:mid
func (h *JadwalHandler) GetMilestone(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	mid := c.Params("mid")

	m, err := h.jadwalSvc.GetMilestone(mid, proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": m})
}

// UpdateMilestone godoc
// PATCH /api/v1/proyek/:id/milestone/:mid
func (h *JadwalHandler) UpdateMilestone(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	mid := c.Params("mid")

	var req service.UpdateMilestoneRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}

	m, err := h.jadwalSvc.UpdateMilestone(mid, proyekID, perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": m, "message": "milestone berhasil diupdate"})
}

// DeleteMilestone godoc
// DELETE /api/v1/proyek/:id/milestone/:mid
func (h *JadwalHandler) DeleteMilestone(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	mid := c.Params("mid")

	if err := h.jadwalSvc.DeleteMilestone(mid, proyekID, perusahaanID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "milestone berhasil dihapus"})
}

// CreateProgress godoc
// POST /api/v1/proyek/:id/milestone/:mid/progress
func (h *JadwalHandler) CreateProgress(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	userID, _ := c.Locals("user_id").(string)
	proyekID := c.Params("id")
	mid := c.Params("mid")

	var req service.CreateProgressRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}

	p, err := h.progressSvc.CreateProgress(mid, proyekID, perusahaanID, userID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": p, "message": "progress berhasil dicatat"})
}

// ListProgress godoc
// GET /api/v1/proyek/:id/milestone/:mid/progress
func (h *JadwalHandler) ListProgress(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	mid := c.Params("mid")

	updates, err := h.progressSvc.ListProgress(mid, proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": updates})
}

// DeleteProgress godoc
// DELETE /api/v1/proyek/:id/milestone/:mid/progress/:pid
func (h *JadwalHandler) DeleteProgress(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	mid := c.Params("mid")
	pid := c.Params("pid")

	if err := h.progressSvc.DeleteProgress(pid, mid, proyekID, perusahaanID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "progress berhasil dihapus"})
}

// GetKurvaS godoc
// GET /api/v1/proyek/:id/kurva-s
func (h *JadwalHandler) GetKurvaS(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	points, err := h.jadwalSvc.GetKurvaS(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": points})
}

// GetProgressSummary godoc
// GET /api/v1/proyek/:id/progress-summary
func (h *JadwalHandler) GetProgressSummary(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	summary, err := h.jadwalSvc.GetProgressSummary(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": summary})
}
