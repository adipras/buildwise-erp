package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type ProyekRepository interface {
	FindAll(perusahaanID string) ([]model.Proyek, error)
	FindByID(id, perusahaanID string) (*model.Proyek, error)
	Create(p *model.Proyek) error
	Update(p *model.Proyek) error
	Delete(id, perusahaanID string) error
	GetTotalRab(proyekID string) (int64, error)
	GetTotalRealisasi(proyekID string) (int64, error)
}

type ProyekRepo struct{}

func (r *ProyekRepo) FindAll(perusahaanID string) ([]model.Proyek, error) {
	var proyeks []model.Proyek
	err := database.DB.Where("perusahaan_id = ?", perusahaanID).Order("created_at DESC").Find(&proyeks).Error
	return proyeks, err
}

func (r *ProyekRepo) FindByID(id, perusahaanID string) (*model.Proyek, error) {
	var proyek model.Proyek
	err := database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).First(&proyek).Error
	return &proyek, err
}

func (r *ProyekRepo) Create(p *model.Proyek) error {
	return database.DB.Create(p).Error
}

func (r *ProyekRepo) Update(p *model.Proyek) error {
	return database.DB.Save(p).Error
}

func (r *ProyekRepo) Delete(id, perusahaanID string) error {
	return database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).Delete(&model.Proyek{}).Error
}

func (r *ProyekRepo) GetTotalRab(proyekID string) (int64, error) {
	var total int64
	err := database.DB.Model(&model.RabItem{}).
		Where("proyek_id = ?", proyekID).
		Select("COALESCE(SUM(total_anggaran), 0)").
		Scan(&total).Error
	return total, err
}

func (r *ProyekRepo) GetTotalRealisasi(proyekID string) (int64, error) {
	var total int64
	err := database.DB.Model(&model.Pengeluaran{}).
		Where("proyek_id = ?", proyekID).
		Select("COALESCE(SUM(jumlah), 0)").
		Scan(&total).Error
	return total, err
}
