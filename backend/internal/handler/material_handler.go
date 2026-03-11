package handler

import (
	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type MaterialHandler struct {
	materialSvc service.MaterialService
}

func NewMaterialHandler() *MaterialHandler {
	return &MaterialHandler{
		materialSvc: service.NewMaterialService(),
	}
}

// ─── Material ─────────────────────────────────────────────────────────────────

// GET /api/v1/material
func (h *MaterialHandler) ListMaterial(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	materials, err := h.materialSvc.ListMaterial(perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": materials})
}

// POST /api/v1/material
func (h *MaterialHandler) CreateMaterial(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	var req service.CreateMaterialRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	m, err := h.materialSvc.CreateMaterial(perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": m, "message": "material berhasil ditambahkan"})
}

// PATCH /api/v1/material/:id
func (h *MaterialHandler) UpdateMaterial(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")
	var req service.UpdateMaterialRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	m, err := h.materialSvc.UpdateMaterial(id, perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": m, "message": "material berhasil diupdate"})
}

// DELETE /api/v1/material/:id
func (h *MaterialHandler) DeleteMaterial(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")
	if err := h.materialSvc.DeleteMaterial(id, perusahaanID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "material berhasil dihapus"})
}

// ─── Supplier ─────────────────────────────────────────────────────────────────

// GET /api/v1/supplier
func (h *MaterialHandler) ListSupplier(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	suppliers, err := h.materialSvc.ListSupplier(perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": suppliers})
}

// POST /api/v1/supplier
func (h *MaterialHandler) CreateSupplier(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	var req service.CreateSupplierRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	sup, err := h.materialSvc.CreateSupplier(perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": sup, "message": "supplier berhasil ditambahkan"})
}

// PATCH /api/v1/supplier/:id
func (h *MaterialHandler) UpdateSupplier(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")
	var req service.UpdateSupplierRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	sup, err := h.materialSvc.UpdateSupplier(id, perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": sup, "message": "supplier berhasil diupdate"})
}

// DELETE /api/v1/supplier/:id
func (h *MaterialHandler) DeleteSupplier(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")
	if err := h.materialSvc.DeleteSupplier(id, perusahaanID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "supplier berhasil dihapus"})
}
