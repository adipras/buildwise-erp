package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type PoRepo struct{}

func (r *PoRepo) FindAllByProyek(proyekID string) ([]model.PurchaseOrder, error) {
	var pos []model.PurchaseOrder
	err := database.DB.Preload("Supplier").Preload("Items.Material").
		Where("proyek_id = ?", proyekID).
		Order("created_at DESC").
		Find(&pos).Error
	return pos, err
}

func (r *PoRepo) FindByID(id, proyekID string) (*model.PurchaseOrder, error) {
	var po model.PurchaseOrder
	err := database.DB.Preload("Supplier").Preload("Items.Material").
		Where("id = ? AND proyek_id = ?", id, proyekID).
		First(&po).Error
	return &po, err
}

func (r *PoRepo) Create(po *model.PurchaseOrder) error {
	return database.DB.Create(po).Error
}

func (r *PoRepo) Update(po *model.PurchaseOrder) error {
	return database.DB.Save(po).Error
}

func (r *PoRepo) UpdateItem(item *model.PoItem) error {
	return database.DB.Save(item).Error
}

func (r *PoRepo) Delete(id, proyekID string) error {
	return database.DB.Where("id = ? AND proyek_id = ?", id, proyekID).
		Delete(&model.PurchaseOrder{}).Error
}
