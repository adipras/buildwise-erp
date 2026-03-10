package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type PengeluaranRepository interface {
	FindAllByProyek(proyekID string) ([]model.Pengeluaran, error)
	FindByID(id, proyekID string) (*model.Pengeluaran, error)
	Create(p *model.Pengeluaran) error
	SoftDelete(id, proyekID string) error
	SumByRabItem(rabItemID string) (int64, error)
}

type PengeluaranRepo struct{}

func (r *PengeluaranRepo) FindAllByProyek(proyekID string) ([]model.Pengeluaran, error) {
	var items []model.Pengeluaran
	err := database.DB.Where("proyek_id = ?", proyekID).Order("tgl_transaksi DESC").Find(&items).Error
	return items, err
}

func (r *PengeluaranRepo) FindByID(id, proyekID string) (*model.Pengeluaran, error) {
	var item model.Pengeluaran
	err := database.DB.Where("id = ? AND proyek_id = ?", id, proyekID).First(&item).Error
	return &item, err
}

func (r *PengeluaranRepo) Create(p *model.Pengeluaran) error {
	return database.DB.Create(p).Error
}

func (r *PengeluaranRepo) SoftDelete(id, proyekID string) error {
	return database.DB.Where("id = ? AND proyek_id = ?", id, proyekID).Delete(&model.Pengeluaran{}).Error
}

func (r *PengeluaranRepo) SumByRabItem(rabItemID string) (int64, error) {
	var total int64
	err := database.DB.Model(&model.Pengeluaran{}).
		Where("rab_item_id = ?", rabItemID).
		Select("COALESCE(SUM(jumlah), 0)").
		Scan(&total).Error
	return total, err
}
