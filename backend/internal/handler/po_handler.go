package handler

import (
	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type PoHandler struct {
	poSvc service.PoService
}

func NewPoHandler() *PoHandler {
	return &PoHandler{
		poSvc: service.NewPoService(),
	}
}

// ─── Purchase Order ───────────────────────────────────────────────────────────

// GET /api/v1/proyek/:id/po
func (h *PoHandler) ListPO(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	pos, err := h.poSvc.ListPO(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": pos})
}

// GET /api/v1/proyek/:id/po/:po_id
func (h *PoHandler) GetPO(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	poID := c.Params("po_id")
	po, err := h.poSvc.GetPO(poID, proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": po})
}

// POST /api/v1/proyek/:id/po
func (h *PoHandler) CreatePO(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	var req service.CreatePoRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	po, err := h.poSvc.CreatePO(proyekID, perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": po, "message": "purchase order berhasil dibuat"})
}

// POST /api/v1/proyek/:id/po/:po_id/terima
func (h *PoHandler) TerimaPO(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	poID := c.Params("po_id")
	po, err := h.poSvc.TerimaPO(poID, proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": po, "message": "purchase order berhasil diterima, stok diperbarui"})
}

// DELETE /api/v1/proyek/:id/po/:po_id
func (h *PoHandler) DeletePO(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	poID := c.Params("po_id")
	if err := h.poSvc.DeletePO(poID, proyekID, perusahaanID); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "purchase order berhasil dihapus"})
}

// ─── Stok ────────────────────────────────────────────────────────────────────

// GET /api/v1/proyek/:id/stok
func (h *PoHandler) ListStok(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	stoks, err := h.poSvc.ListStok(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": stoks})
}

// POST /api/v1/proyek/:id/stok/pakai
func (h *PoHandler) PakaiMaterial(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	userID, _ := c.Locals("user_id").(string)
	proyekID := c.Params("id")
	var req service.PakaiMaterialRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	p, err := h.poSvc.PakaiMaterial(proyekID, perusahaanID, userID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": p, "message": "penggunaan material berhasil dicatat"})
}

// GET /api/v1/proyek/:id/stok/penggunaan
func (h *PoHandler) ListPenggunaan(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	list, err := h.poSvc.ListPenggunaan(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list})
}
