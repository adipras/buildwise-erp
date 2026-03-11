package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type UpahRepo struct{}

func (r *UpahRepo) FindByProyek(proyekID string) ([]model.PembayaranUpah, error) {
	var list []model.PembayaranUpah
	err := database.DB.Preload("Pekerja").
		Where("proyek_id = ?", proyekID).
		Order("created_at DESC").
		Find(&list).Error
	return list, err
}

func (r *UpahRepo) Create(p *model.PembayaranUpah) error {
	return database.DB.Create(p).Error
}

func (r *UpahRepo) Update(p *model.PembayaranUpah) error {
	return database.DB.Save(p).Error
}
