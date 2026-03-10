package handler

import (
	"errors"

	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type RabHandler struct {
	svc *service.RabService
}

func NewRabHandler() *RabHandler {
	return &RabHandler{svc: service.NewRabService()}
}

// ListRab godoc
// GET /api/v1/proyek/:id/rab
func (h *RabHandler) ListRab(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	items, err := h.svc.ListRab(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": items})
}

// CreateRabItem godoc
// POST /api/v1/proyek/:id/rab
func (h *RabHandler) CreateRabItem(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	var req service.CreateRabRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "format request tidak valid"})
	}

	item, err := h.svc.CreateRabItem(proyekID, perusahaanID, req)
	if err != nil {
		if errors.Is(err, service.ErrRabLocked) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": err.Error()})
		}
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"message": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": item, "message": "item RAB berhasil dibuat"})
}

// UpdateRabItem godoc
// PATCH /api/v1/proyek/:id/rab/:item_id
func (h *RabHandler) UpdateRabItem(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	itemID := c.Params("item_id")

	var req service.UpdateRabRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "format request tidak valid"})
	}

	item, err := h.svc.UpdateRabItem(itemID, proyekID, perusahaanID, req)
	if err != nil {
		if errors.Is(err, service.ErrRabLocked) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": err.Error()})
		}
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"data": item, "message": "item RAB berhasil diupdate"})
}

// DeleteRabItem godoc
// DELETE /api/v1/proyek/:id/rab/:item_id
func (h *RabHandler) DeleteRabItem(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	itemID := c.Params("item_id")

	if err := h.svc.DeleteRabItem(itemID, proyekID, perusahaanID); err != nil {
		if errors.Is(err, service.ErrRabLocked) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": err.Error()})
		}
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "item RAB berhasil dihapus"})
}

// LockRab godoc
// POST /api/v1/proyek/:id/rab/lock  (hanya owner)
func (h *RabHandler) LockRab(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")

	if err := h.svc.LockRab(proyekID, perusahaanID); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"message": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "RAB berhasil dikunci"})
}
