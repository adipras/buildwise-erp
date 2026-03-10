package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type RabRepository interface {
	FindAllByProyek(proyekID string) ([]model.RabItem, error)
	FindByID(id, proyekID string) (*model.RabItem, error)
	Create(item *model.RabItem) error
	Update(item *model.RabItem) error
	Delete(id, proyekID string) error
	LockAll(proyekID string) error
	GetStatusLock(proyekID string) (bool, error)
}

type RabRepo struct{}

func (r *RabRepo) FindAllByProyek(proyekID string) ([]model.RabItem, error) {
	var items []model.RabItem
	err := database.DB.Where("proyek_id = ?", proyekID).Order("created_at ASC").Find(&items).Error
	return items, err
}

func (r *RabRepo) FindByID(id, proyekID string) (*model.RabItem, error) {
	var item model.RabItem
	err := database.DB.Where("id = ? AND proyek_id = ?", id, proyekID).First(&item).Error
	return &item, err
}

func (r *RabRepo) Create(item *model.RabItem) error {
	return database.DB.Create(item).Error
}

func (r *RabRepo) Update(item *model.RabItem) error {
	return database.DB.Save(item).Error
}

func (r *RabRepo) Delete(id, proyekID string) error {
	return database.DB.Where("id = ? AND proyek_id = ?", id, proyekID).Delete(&model.RabItem{}).Error
}

func (r *RabRepo) LockAll(proyekID string) error {
	return database.DB.Model(&model.RabItem{}).
		Where("proyek_id = ?", proyekID).
		Update("status", model.StatusRabLocked).Error
}

func (r *RabRepo) GetStatusLock(proyekID string) (bool, error) {
	var count int64
	err := database.DB.Model(&model.RabItem{}).
		Where("proyek_id = ? AND status = ?", proyekID, model.StatusRabLocked).
		Count(&count).Error
	return count > 0, err
}
