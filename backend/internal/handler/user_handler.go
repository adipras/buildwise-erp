package handler

import (
	"buildwise/internal/service"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{svc: service.NewUserService()}
}

// ListUsers godoc
// GET /api/v1/users  (hanya owner)
func (h *UserHandler) ListUsers(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)

	users, err := h.svc.ListUsers(perusahaanID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "gagal mengambil data user"})
	}

	return c.JSON(fiber.Map{"data": users})
}

// CreateUser godoc
// POST /api/v1/users  (hanya owner)
func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)

	var req service.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "format request tidak valid"})
	}

	user, err := h.svc.CreateUser(perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": user, "message": "user berhasil dibuat"})
}

// UpdateUser godoc
// PATCH /api/v1/users/:id  (hanya owner)
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")

	var req service.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "format request tidak valid"})
	}

	user, err := h.svc.UpdateUser(id, perusahaanID, req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"data": user, "message": "user berhasil diupdate"})
}

// DeleteUser godoc
// DELETE /api/v1/users/:id  (hanya owner)
func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	perusahaanID, _ := c.Locals("perusahaan_id").(string)
	id := c.Params("id")

	if err := h.svc.DeleteUser(id, perusahaanID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "user berhasil dinonaktifkan"})
}
