package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type PekerjaRepo struct{}

func (r *PekerjaRepo) FindAll(perusahaanID string) ([]model.Pekerja, error) {
	var list []model.Pekerja
	err := database.DB.Where("perusahaan_id = ?", perusahaanID).
		Order("nama ASC").Find(&list).Error
	return list, err
}

func (r *PekerjaRepo) FindByID(id, perusahaanID string) (*model.Pekerja, error) {
	var p model.Pekerja
	err := database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).First(&p).Error
	return &p, err
}

func (r *PekerjaRepo) Create(p *model.Pekerja) error {
	return database.DB.Create(p).Error
}

func (r *PekerjaRepo) Update(p *model.Pekerja) error {
	return database.DB.Save(p).Error
}

func (r *PekerjaRepo) Delete(id, perusahaanID string) error {
	return database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).
		Delete(&model.Pekerja{}).Error
}
