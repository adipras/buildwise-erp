package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"

	"github.com/google/uuid"
)

type StokRepo struct{}

func (r *StokRepo) FindAllByProyek(proyekID string) ([]model.StokMaterial, error) {
	var stoks []model.StokMaterial
	err := database.DB.Preload("Material").
		Where("proyek_id = ?", proyekID).
		Find(&stoks).Error
	return stoks, err
}

// GetOrCreate mengambil atau membuat record stok untuk pasangan proyek+material.
func (r *StokRepo) GetOrCreate(proyekID, materialID, perusahaanID string) (*model.StokMaterial, error) {
	var stok model.StokMaterial
	err := database.DB.Where("proyek_id = ? AND material_id = ?", proyekID, materialID).
		First(&stok).Error
	if err != nil {
		stok = model.StokMaterial{
			BaseModel:  model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
			ProyekID:   proyekID,
			MaterialID: materialID,
		}
		err = database.DB.Create(&stok).Error
	}
	return &stok, err
}

func (r *StokRepo) Update(s *model.StokMaterial) error {
	return database.DB.Save(s).Error
}

func (r *StokRepo) CreatePenggunaan(p *model.PenggunaanMaterial) error {
	return database.DB.Create(p).Error
}

func (r *StokRepo) ListPenggunaan(proyekID string) ([]model.PenggunaanMaterial, error) {
	var list []model.PenggunaanMaterial
	err := database.DB.Where("proyek_id = ?", proyekID).
		Order("tgl_pakai DESC").
		Find(&list).Error
	return list, err
}
