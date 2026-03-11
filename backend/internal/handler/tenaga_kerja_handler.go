package handler

import (
	"time"

	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type TenagaKerjaHandler struct {
	svc service.TenagaKerjaService
}

func NewTenagaKerjaHandler() *TenagaKerjaHandler {
	return &TenagaKerjaHandler{svc: service.NewTenagaKerjaService()}
}

// ─── Master Pekerja ───────────────────────────────────────────────────────────

// GET /api/v1/pekerja
func (h *TenagaKerjaHandler) ListPekerja(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	list, err := h.svc.ListPekerja(perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list})
}

// POST /api/v1/pekerja
func (h *TenagaKerjaHandler) CreatePekerja(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	var req service.CreatePekerjaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	p, err := h.svc.CreatePekerja(perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": p, "message": "pekerja berhasil ditambahkan"})
}

// PATCH /api/v1/pekerja/:id
func (h *TenagaKerjaHandler) UpdatePekerja(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")
	var req service.UpdatePekerjaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	p, err := h.svc.UpdatePekerja(id, perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": p, "message": "pekerja berhasil diupdate"})
}

// DELETE /api/v1/pekerja/:id
func (h *TenagaKerjaHandler) DeletePekerja(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")
	if err := h.svc.DeletePekerja(id, perusahaanID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "pekerja berhasil dihapus"})
}

// ─── Penugasan ────────────────────────────────────────────────────────────────

// GET /api/v1/proyek/:id/pekerja
func (h *TenagaKerjaHandler) ListPekerjaProyek(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	list, err := h.svc.ListPekerjaProyek(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list})
}

// POST /api/v1/proyek/:id/pekerja
func (h *TenagaKerjaHandler) AssignPekerja(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	var body struct {
		PekerjaID string `json:"pekerja_id"`
	}
	if err := c.BodyParser(&body); err != nil || body.PekerjaID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "pekerja_id wajib diisi"})
	}
	pn, err := h.svc.AssignPekerja(proyekID, perusahaanID, body.PekerjaID)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": pn, "message": "pekerja berhasil ditugaskan"})
}

// DELETE /api/v1/proyek/:id/pekerja/:pekerja_id
func (h *TenagaKerjaHandler) UnassignPekerja(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	pekerjaID := c.Params("pekerja_id")
	if err := h.svc.UnassignPekerja(proyekID, perusahaanID, pekerjaID); err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "pekerja berhasil di-unassign dari proyek"})
}

// ─── Absensi ──────────────────────────────────────────────────────────────────

// GET /api/v1/proyek/:id/absensi?tanggal=2025-03-01
func (h *TenagaKerjaHandler) GetAbsensi(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	tanggal := c.Query("tanggal")
	if tanggal == "" {
		tanggal = time.Now().Format("2006-01-02")
	}
	list, err := h.svc.GetAbsensi(proyekID, perusahaanID, tanggal)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list})
}

// POST /api/v1/proyek/:id/absensi
func (h *TenagaKerjaHandler) InputAbsensiMassal(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	userID, _ := c.Locals("user_id").(string)
	proyekID := c.Params("id")
	var req service.InputAbsensiRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	result, err := h.svc.InputAbsensiMassal(proyekID, perusahaanID, userID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": result, "message": "absensi berhasil dicatat"})
}

// ─── Rekap & Pembayaran ───────────────────────────────────────────────────────

// GET /api/v1/proyek/:id/rekap-upah?mulai=2025-03-01&selesai=2025-03-07
func (h *TenagaKerjaHandler) GetRekapUpah(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	mulai := c.Query("mulai")
	selesai := c.Query("selesai")
	if mulai == "" || selesai == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "query param mulai dan selesai wajib diisi"})
	}
	rekap, err := h.svc.GetRekapUpah(proyekID, perusahaanID, mulai, selesai)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": rekap})
}

// POST /api/v1/proyek/:id/upah/approve-bayar
func (h *TenagaKerjaHandler) ApproveBayar(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	userID, _ := c.Locals("user_id").(string)
	proyekID := c.Params("id")
	var req service.ApproveBayarRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "format request tidak valid"})
	}
	result, err := h.svc.ApproveBayar(proyekID, perusahaanID, userID, req)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"data":    result,
		"message": "upah berhasil diapprove dan dibayar, pengeluaran otomatis tercatat",
	})
}

// GET /api/v1/proyek/:id/upah
func (h *TenagaKerjaHandler) ListPembayaranUpah(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	proyekID := c.Params("id")
	list, err := h.svc.ListPembayaranUpah(proyekID, perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": list})
}
