package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type PenugasanRepo struct{}

// FindByProyek mengambil semua penugasan aktif di proyek beserta data pekerja.
func (r *PenugasanRepo) FindByProyek(proyekID string) ([]model.PenugasanProyek, error) {
	var list []model.PenugasanProyek
	err := database.DB.Preload("Pekerja").
		Where("proyek_id = ? AND is_aktif = ?", proyekID, true).
		Order("created_at ASC").
		Find(&list).Error
	return list, err
}

func (r *PenugasanRepo) FindByPekerjaAndProyek(pekerjaID, proyekID string) (*model.PenugasanProyek, error) {
	var p model.PenugasanProyek
	err := database.DB.Where("pekerja_id = ? AND proyek_id = ? AND is_aktif = ?", pekerjaID, proyekID, true).
		First(&p).Error
	return &p, err
}

func (r *PenugasanRepo) Create(p *model.PenugasanProyek) error {
	return database.DB.Create(p).Error
}

func (r *PenugasanRepo) Deactivate(pekerjaID, proyekID string) error {
	return database.DB.Model(&model.PenugasanProyek{}).
		Where("pekerja_id = ? AND proyek_id = ?", pekerjaID, proyekID).
		Update("is_aktif", false).Error
}
