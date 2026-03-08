package database

import (
	"log"

	"buildwise/internal/config"
	"buildwise/internal/model"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	logLevel := logger.Silent
	if config.App.AppEnv == "development" {
		logLevel = logger.Info
	}

	db, err := gorm.Open(mysql.Open(config.App.DBDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("gagal koneksi ke database: %v", err)
	}

	DB = db
	log.Println("koneksi database berhasil")
}

// AutoMigrate menjalankan migrasi otomatis semua model.
// Gunakan hanya di development — production pakai file SQL di migrations/.
func AutoMigrate() {
	err := DB.AutoMigrate(
		&model.Perusahaan{},
		&model.User{},
		&model.Proyek{},
		&model.RabItem{},
		&model.Pengeluaran{},
		&model.Milestone{},
		&model.ProgressUpdate{},
		&model.FotoProgress{},
		&model.Material{},
		&model.KebutuhanMaterial{},
		&model.Supplier{},
		&model.PurchaseOrder{},
		&model.PoItem{},
		&model.StokMaterial{},
		&model.PenggunaanMaterial{},
		&model.Pekerja{},
		&model.PenugasanProyek{},
		&model.Absensi{},
		&model.PembayaranUpah{},
		&model.Notifikasi{},
	)
	if err != nil {
		log.Fatalf("gagal migrasi database: %v", err)
	}
	log.Println("migrasi database berhasil")
}
