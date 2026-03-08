package middleware

import (
	"strings"

	"buildwise/internal/config"

	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// JWTMiddleware memvalidasi Bearer token dan menyimpan claims ke context.
func JWTMiddleware() fiber.Handler {
	return jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(config.App.JWTSecret)},
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "token tidak valid atau sudah kadaluarsa",
			})
		},
	})
}

// TenantMiddleware mengekstrak perusahaan_id dan user_id dari JWT claims
// lalu menyimpannya ke fiber context untuk dipakai di handler/repository.
func TenantMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		token, ok := c.Locals("user").(*jwt.Token)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "token tidak ditemukan",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "format token tidak valid",
			})
		}

		perusahaanID, _ := claims["perusahaan_id"].(string)
		userID, _ := claims["user_id"].(string)
		role, _ := claims["role"].(string)

		if perusahaanID == "" || userID == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"message": "data tenant tidak ditemukan dalam token",
			})
		}

		c.Locals("perusahaan_id", perusahaanID)
		c.Locals("user_id", userID)
		c.Locals("role", role)

		return c.Next()
	}
}

// RequireRoles membatasi akses hanya untuk role tertentu.
// Selalu gunakan setelah JWTMiddleware + TenantMiddleware.
func RequireRoles(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, _ := c.Locals("role").(string)
		for _, r := range roles {
			if strings.EqualFold(userRole, r) {
				return c.Next()
			}
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "anda tidak memiliki akses untuk aksi ini",
		})
	}
}
