package repository

import (
	"time"

	"buildwise/internal/database"
	"buildwise/internal/model"
)

type AbsensiRepo struct{}

// FindByTanggal mengambil absensi untuk suatu proyek pada tanggal tertentu.
func (r *AbsensiRepo) FindByTanggal(proyekID string, tanggal time.Time) ([]model.Absensi, error) {
	var list []model.Absensi
	tglStr := tanggal.Format("2006-01-02")
	err := database.DB.Preload("Pekerja").
		Where("proyek_id = ? AND DATE(tanggal) = ?", proyekID, tglStr).
		Find(&list).Error
	return list, err
}

// FindByPeriode mengambil absensi untuk suatu proyek dalam rentang periode.
func (r *AbsensiRepo) FindByPeriode(proyekID string, mulai, selesai time.Time) ([]model.Absensi, error) {
	var list []model.Absensi
	err := database.DB.Preload("Pekerja").
		Where("proyek_id = ? AND DATE(tanggal) BETWEEN ? AND ?",
			proyekID,
			mulai.Format("2006-01-02"),
			selesai.Format("2006-01-02"),
		).
		Order("tanggal ASC, pekerja_id ASC").
		Find(&list).Error
	return list, err
}

// FindOne mengambil absensi spesifik per pekerja per tanggal (untuk idempoten).
func (r *AbsensiRepo) FindOne(proyekID, pekerjaID string, tanggal time.Time) (*model.Absensi, error) {
	var a model.Absensi
	err := database.DB.
		Where("proyek_id = ? AND pekerja_id = ? AND DATE(tanggal) = ?",
			proyekID, pekerjaID, tanggal.Format("2006-01-02"),
		).
		First(&a).Error
	return &a, err
}

func (r *AbsensiRepo) Create(a *model.Absensi) error {
	return database.DB.Create(a).Error
}

func (r *AbsensiRepo) Update(a *model.Absensi) error {
	return database.DB.Save(a).Error
}
