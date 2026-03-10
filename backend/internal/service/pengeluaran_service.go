package service

import (
	"errors"
	"strings"
	"time"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
)

type CreatePengeluaranRequest struct {
	RabItemID    *string   `json:"rab_item_id"`
	Kategori     string    `json:"kategori"`
	Deskripsi    string    `json:"deskripsi"`
	Jumlah       int64     `json:"jumlah"`
	TglTransaksi time.Time `json:"tgl_transaksi"`
	BuktiFotoURL string    `json:"bukti_foto_url"`
}

type PengeluaranService struct {
	repo       *repository.PengeluaranRepo
	proyekRepo *repository.ProyekRepo
}

func NewPengeluaranService() *PengeluaranService {
	return &PengeluaranService{
		repo:       &repository.PengeluaranRepo{},
		proyekRepo: &repository.ProyekRepo{},
	}
}

func (s *PengeluaranService) verifyProyek(proyekID, perusahaanID string) error {
	_, err := s.proyekRepo.FindByID(proyekID, perusahaanID)
	if err != nil {
		return errors.New("proyek tidak ditemukan")
	}
	return nil
}

func (s *PengeluaranService) ListPengeluaran(proyekID, perusahaanID string) ([]model.Pengeluaran, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	return s.repo.FindAllByProyek(proyekID)
}

func (s *PengeluaranService) CreatePengeluaran(proyekID, perusahaanID, dibuatOlehID string, req CreatePengeluaranRequest) (*model.Pengeluaran, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}

	if strings.TrimSpace(req.Kategori) == "" {
		return nil, errors.New("kategori wajib diisi")
	}
	if req.Jumlah < 1 {
		return nil, errors.New("jumlah harus lebih dari 0")
	}

	tgl := req.TglTransaksi
	if tgl.IsZero() {
		tgl = time.Now()
	}

	p := &model.Pengeluaran{
		BaseModel:    model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		ProyekID:     proyekID,
		RabItemID:    req.RabItemID,
		Kategori:     req.Kategori,
		Deskripsi:    req.Deskripsi,
		Jumlah:       req.Jumlah,
		TglTransaksi: tgl,
		BuktiFotoURL: req.BuktiFotoURL,
		DibuatOlehID: dibuatOlehID,
	}

	if err := s.repo.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *PengeluaranService) DeletePengeluaran(id, proyekID, perusahaanID string) error {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return err
	}
	_, err := s.repo.FindByID(id, proyekID)
	if err != nil {
		return errors.New("pengeluaran tidak ditemukan")
	}
	return s.repo.SoftDelete(id, proyekID)
}
