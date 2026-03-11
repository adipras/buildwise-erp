package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type MaterialRepo struct{}

func (r *MaterialRepo) FindAll(perusahaanID string) ([]model.Material, error) {
	var materials []model.Material
	err := database.DB.Where("perusahaan_id = ?", perusahaanID).
		Order("nama ASC").Find(&materials).Error
	return materials, err
}

func (r *MaterialRepo) FindByID(id, perusahaanID string) (*model.Material, error) {
	var m model.Material
	err := database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).First(&m).Error
	return &m, err
}

func (r *MaterialRepo) Create(m *model.Material) error {
	return database.DB.Create(m).Error
}

func (r *MaterialRepo) Update(m *model.Material) error {
	return database.DB.Save(m).Error
}

func (r *MaterialRepo) Delete(id, perusahaanID string) error {
	return database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).
		Delete(&model.Material{}).Error
}
