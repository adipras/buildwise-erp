package service

import (
	"errors"
	"strings"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
)

// ─── Request Types ────────────────────────────────────────────────────────────

type CreateMaterialRequest struct {
	Nama        string `json:"nama"`
	Satuan      string `json:"satuan"`
	HargaSatuan int64  `json:"harga_satuan"`
	Keterangan  string `json:"keterangan"`
}

type UpdateMaterialRequest struct {
	Nama        string `json:"nama"`
	Satuan      string `json:"satuan"`
	HargaSatuan int64  `json:"harga_satuan"`
	Keterangan  string `json:"keterangan"`
}

type CreateSupplierRequest struct {
	Nama    string `json:"nama"`
	Telepon string `json:"telepon"`
	Alamat  string `json:"alamat"`
	Kontak  string `json:"kontak"`
}

type UpdateSupplierRequest struct {
	Nama    string `json:"nama"`
	Telepon string `json:"telepon"`
	Alamat  string `json:"alamat"`
	Kontak  string `json:"kontak"`
}

// ─── Service Interface ────────────────────────────────────────────────────────

type MaterialService interface {
	ListMaterial(perusahaanID string) ([]model.Material, error)
	CreateMaterial(perusahaanID string, req CreateMaterialRequest) (*model.Material, error)
	UpdateMaterial(id, perusahaanID string, req UpdateMaterialRequest) (*model.Material, error)
	DeleteMaterial(id, perusahaanID string) error

	ListSupplier(perusahaanID string) ([]model.Supplier, error)
	CreateSupplier(perusahaanID string, req CreateSupplierRequest) (*model.Supplier, error)
	UpdateSupplier(id, perusahaanID string, req UpdateSupplierRequest) (*model.Supplier, error)
	DeleteSupplier(id, perusahaanID string) error
}

type materialService struct {
	materialRepo *repository.MaterialRepo
	supplierRepo *repository.SupplierRepo
}

func NewMaterialService() MaterialService {
	return &materialService{
		materialRepo: &repository.MaterialRepo{},
		supplierRepo: &repository.SupplierRepo{},
	}
}

// ─── Material ─────────────────────────────────────────────────────────────────

func (s *materialService) ListMaterial(perusahaanID string) ([]model.Material, error) {
	return s.materialRepo.FindAll(perusahaanID)
}

func (s *materialService) CreateMaterial(perusahaanID string, req CreateMaterialRequest) (*model.Material, error) {
	if strings.TrimSpace(req.Nama) == "" {
		return nil, errors.New("nama material wajib diisi")
	}
	if strings.TrimSpace(req.Satuan) == "" {
		return nil, errors.New("satuan wajib diisi")
	}
	m := &model.Material{
		BaseModel:   model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		Nama:        req.Nama,
		Satuan:      req.Satuan,
		HargaSatuan: req.HargaSatuan,
		Keterangan:  req.Keterangan,
	}
	if err := s.materialRepo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *materialService) UpdateMaterial(id, perusahaanID string, req UpdateMaterialRequest) (*model.Material, error) {
	m, err := s.materialRepo.FindByID(id, perusahaanID)
	if err != nil {
		return nil, errors.New("material tidak ditemukan")
	}
	if strings.TrimSpace(req.Nama) != "" {
		m.Nama = req.Nama
	}
	if strings.TrimSpace(req.Satuan) != "" {
		m.Satuan = req.Satuan
	}
	if req.HargaSatuan >= 0 {
		m.HargaSatuan = req.HargaSatuan
	}
	m.Keterangan = req.Keterangan
	if err := s.materialRepo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *materialService) DeleteMaterial(id, perusahaanID string) error {
	if _, err := s.materialRepo.FindByID(id, perusahaanID); err != nil {
		return errors.New("material tidak ditemukan")
	}
	return s.materialRepo.Delete(id, perusahaanID)
}

// ─── Supplier ─────────────────────────────────────────────────────────────────

func (s *materialService) ListSupplier(perusahaanID string) ([]model.Supplier, error) {
	return s.supplierRepo.FindAll(perusahaanID)
}

func (s *materialService) CreateSupplier(perusahaanID string, req CreateSupplierRequest) (*model.Supplier, error) {
	if strings.TrimSpace(req.Nama) == "" {
		return nil, errors.New("nama supplier wajib diisi")
	}
	sup := &model.Supplier{
		BaseModel: model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		Nama:      req.Nama,
		Telepon:   req.Telepon,
		Alamat:    req.Alamat,
		Kontak:    req.Kontak,
	}
	if err := s.supplierRepo.Create(sup); err != nil {
		return nil, err
	}
	return sup, nil
}

func (s *materialService) UpdateSupplier(id, perusahaanID string, req UpdateSupplierRequest) (*model.Supplier, error) {
	sup, err := s.supplierRepo.FindByID(id, perusahaanID)
	if err != nil {
		return nil, errors.New("supplier tidak ditemukan")
	}
	if strings.TrimSpace(req.Nama) != "" {
		sup.Nama = req.Nama
	}
	sup.Telepon = req.Telepon
	sup.Alamat = req.Alamat
	sup.Kontak = req.Kontak
	if err := s.supplierRepo.Update(sup); err != nil {
		return nil, err
	}
	return sup, nil
}

func (s *materialService) DeleteSupplier(id, perusahaanID string) error {
	if _, err := s.supplierRepo.FindByID(id, perusahaanID); err != nil {
		return errors.New("supplier tidak ditemukan")
	}
	return s.supplierRepo.Delete(id, perusahaanID)
}
