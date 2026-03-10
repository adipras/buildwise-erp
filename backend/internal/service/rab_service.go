package service

import (
	"errors"
	"strings"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
)

// ErrRabLocked dikembalikan ketika operasi tidak dapat dilakukan karena RAB sudah dikunci.
var ErrRabLocked = errors.New("RAB sudah dikunci, operasi tidak diizinkan")

type RabItemWithRealisasi struct {
	*model.RabItem
	TotalRealisasi  int64   `json:"total_realisasi"`
	PersenRealisasi float64 `json:"persen_realisasi"`
}

type CreateRabRequest struct {
	Kode        string  `json:"kode"`
	Nama        string  `json:"nama"`
	Volume      float64 `json:"volume"`
	Satuan      string  `json:"satuan"`
	HargaSatuan int64   `json:"harga_satuan"`
}

type UpdateRabRequest struct {
	Kode        string  `json:"kode"`
	Nama        string  `json:"nama"`
	Volume      float64 `json:"volume"`
	Satuan      string  `json:"satuan"`
	HargaSatuan int64   `json:"harga_satuan"`
}

type RabService struct {
	repo       *repository.RabRepo
	pelRepo    *repository.PengeluaranRepo
	proyekRepo *repository.ProyekRepo
}

func NewRabService() *RabService {
	return &RabService{
		repo:       &repository.RabRepo{},
		pelRepo:    &repository.PengeluaranRepo{},
		proyekRepo: &repository.ProyekRepo{},
	}
}

func (s *RabService) verifyProyek(proyekID, perusahaanID string) error {
	_, err := s.proyekRepo.FindByID(proyekID, perusahaanID)
	if err != nil {
		return errors.New("proyek tidak ditemukan")
	}
	return nil
}

func (s *RabService) checkLocked(proyekID string) error {
	locked, err := s.repo.GetStatusLock(proyekID)
	if err != nil {
		return err
	}
	if locked {
		return ErrRabLocked
	}
	return nil
}

func (s *RabService) ListRab(proyekID, perusahaanID string) ([]RabItemWithRealisasi, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}

	items, err := s.repo.FindAllByProyek(proyekID)
	if err != nil {
		return nil, err
	}

	result := make([]RabItemWithRealisasi, 0, len(items))
	for i := range items {
		realisasi, err := s.pelRepo.SumByRabItem(items[i].ID)
		if err != nil {
			return nil, err
		}
		var persen float64
		if items[i].TotalAnggaran > 0 {
			persen = float64(realisasi) / float64(items[i].TotalAnggaran) * 100
		}
		result = append(result, RabItemWithRealisasi{
			RabItem:         &items[i],
			TotalRealisasi:  realisasi,
			PersenRealisasi: persen,
		})
	}
	return result, nil
}

func (s *RabService) CreateRabItem(proyekID, perusahaanID string, req CreateRabRequest) (*model.RabItem, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	if err := s.checkLocked(proyekID); err != nil {
		return nil, err
	}

	if strings.TrimSpace(req.Nama) == "" {
		return nil, errors.New("nama item RAB wajib diisi")
	}
	if req.Volume <= 0 {
		return nil, errors.New("volume harus lebih dari 0")
	}
	if req.HargaSatuan < 1 {
		return nil, errors.New("harga satuan harus lebih dari 0")
	}

	total := int64(req.Volume * float64(req.HargaSatuan))
	item := &model.RabItem{
		BaseModel:     model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		ProyekID:      proyekID,
		Kode:          req.Kode,
		Nama:          req.Nama,
		Volume:        req.Volume,
		Satuan:        req.Satuan,
		HargaSatuan:   req.HargaSatuan,
		TotalAnggaran: total,
		Status:        model.StatusRabDraft,
	}

	if err := s.repo.Create(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *RabService) UpdateRabItem(id, proyekID, perusahaanID string, req UpdateRabRequest) (*model.RabItem, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	if err := s.checkLocked(proyekID); err != nil {
		return nil, err
	}

	item, err := s.repo.FindByID(id, proyekID)
	if err != nil {
		return nil, errors.New("item RAB tidak ditemukan")
	}

	if strings.TrimSpace(req.Nama) != "" {
		item.Nama = req.Nama
	}
	if req.Kode != "" {
		item.Kode = req.Kode
	}
	if req.Volume > 0 {
		item.Volume = req.Volume
	}
	if req.Satuan != "" {
		item.Satuan = req.Satuan
	}
	if req.HargaSatuan > 0 {
		item.HargaSatuan = req.HargaSatuan
	}
	item.TotalAnggaran = int64(item.Volume * float64(item.HargaSatuan))

	if err := s.repo.Update(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *RabService) DeleteRabItem(id, proyekID, perusahaanID string) error {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return err
	}
	if err := s.checkLocked(proyekID); err != nil {
		return err
	}

	_, err := s.repo.FindByID(id, proyekID)
	if err != nil {
		return errors.New("item RAB tidak ditemukan")
	}
	return s.repo.Delete(id, proyekID)
}

func (s *RabService) LockRab(proyekID, perusahaanID string) error {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return err
	}
	return s.repo.LockAll(proyekID)
}
