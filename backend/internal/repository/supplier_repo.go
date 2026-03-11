package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type SupplierRepo struct{}

func (r *SupplierRepo) FindAll(perusahaanID string) ([]model.Supplier, error) {
	var suppliers []model.Supplier
	err := database.DB.Where("perusahaan_id = ?", perusahaanID).
		Order("nama ASC").Find(&suppliers).Error
	return suppliers, err
}

func (r *SupplierRepo) FindByID(id, perusahaanID string) (*model.Supplier, error) {
	var s model.Supplier
	err := database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).First(&s).Error
	return &s, err
}

func (r *SupplierRepo) Create(s *model.Supplier) error {
	return database.DB.Create(s).Error
}

func (r *SupplierRepo) Update(s *model.Supplier) error {
	return database.DB.Save(s).Error
}

func (r *SupplierRepo) Delete(id, perusahaanID string) error {
	return database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).
		Delete(&model.Supplier{}).Error
}
