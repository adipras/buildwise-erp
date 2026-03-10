package main

import (
	"fmt"
	"log"

	"buildwise/internal/config"
	"buildwise/internal/database"
	"buildwise/internal/model"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	config.Load()
	database.Connect()

	log.Println("memulai seeding data...")

	// 1. Buat perusahaan
	perusahaanID := uuid.New().String()
	perusahaan := model.Perusahaan{
		BaseTenantless: model.BaseTenantless{ID: perusahaanID},
		Nama:           "PT Bangun Jaya Sentosa",
		Telepon:        "021-55550001",
		Alamat:         "Jl. Sudirman No. 1, Jakarta Pusat",
	}

	if err := database.DB.FirstOrCreate(&perusahaan, model.Perusahaan{
		BaseTenantless: model.BaseTenantless{ID: perusahaanID},
	}).Error; err != nil {
		log.Fatalf("gagal seed perusahaan: %v", err)
	}
	log.Printf("✅ perusahaan: %s (ID: %s)", perusahaan.Nama, perusahaan.ID)

	// 2. Seed 4 user (1 per role)
	users := []struct {
		Nama     string
		Email    string
		Password string
		Role     model.Role
		Telepon  string
	}{
		{"Budi Santoso (Owner)", "owner@buildwise.id", "owner123", model.RoleOwner, "08111000001"},
		{"Siti Manajer", "manajer@buildwise.id", "manajer123", model.RoleManajer, "08111000002"},
		{"Pak Mandor", "mandor@buildwise.id", "mandor123", model.RoleMandor, "08111000003"},
		{"Admin Keuangan", "admin@buildwise.id", "admin123", model.RoleAdminKeuangan, "08111000004"},
	}

	for _, u := range users {
		hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("gagal hash password untuk %s: %v", u.Email, err)
		}

		user := model.User{
			BaseModel:    model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaan.ID},
			Nama:         u.Nama,
			Email:        u.Email,
			PasswordHash: string(hash),
			Role:         u.Role,
			Telepon:      u.Telepon,
			IsAktif:      true,
		}

		result := database.DB.Where("email = ?", u.Email).FirstOrCreate(&user, user)
		if result.Error != nil {
			log.Fatalf("gagal seed user %s: %v", u.Email, result.Error)
		}
		log.Printf("✅ user: %s | email: %s | password: %s | role: %s", u.Nama, u.Email, u.Password, u.Role)
	}

	fmt.Println("\n🎉 Seeding selesai!")
	fmt.Println("──────────────────────────────────────────")
	fmt.Printf("Perusahaan : %s\n", perusahaan.Nama)
	fmt.Println("Akun login :")
	for _, u := range users {
		fmt.Printf("  %-22s | %-30s | password: %s\n", string(u.Role), u.Email, u.Password)
	}
}
