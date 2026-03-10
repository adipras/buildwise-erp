package service

import (
	"errors"
	"strings"
	"time"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
)

type ProyekSummary struct {
	*model.Proyek
	TotalRAB        int64   `json:"total_rab"`
	TotalRealisasi  int64   `json:"total_realisasi"`
	PersenRealisasi float64 `json:"persen_realisasi"`
	AlertLevel      string  `json:"alert_level"`
}

type CreateProyekRequest struct {
	Nama         string    `json:"nama"`
	Alamat       string    `json:"alamat"`
	NilaiKontrak int64     `json:"nilai_kontrak"`
	TglMulai     time.Time `json:"tgl_mulai"`
	TglSelesai   time.Time `json:"tgl_selesai"`
	ManajerID    string    `json:"manajer_id"`
}

type UpdateProyekRequest struct {
	Nama         string             `json:"nama"`
	Alamat       string             `json:"alamat"`
	NilaiKontrak int64              `json:"nilai_kontrak"`
	TglMulai     time.Time          `json:"tgl_mulai"`
	TglSelesai   time.Time          `json:"tgl_selesai"`
	Status       model.StatusProyek `json:"status"`
	ManajerID    string             `json:"manajer_id"`
}

type ProyekService struct {
	repo *repository.ProyekRepo
}

func NewProyekService() *ProyekService {
	return &ProyekService{repo: &repository.ProyekRepo{}}
}

func (s *ProyekService) buildSummary(p *model.Proyek) (*ProyekSummary, error) {
	totalRab, err := s.repo.GetTotalRab(p.ID)
	if err != nil {
		return nil, err
	}
	totalRealisasi, err := s.repo.GetTotalRealisasi(p.ID)
	if err != nil {
		return nil, err
	}

	var persen float64
	if totalRab > 0 {
		persen = float64(totalRealisasi) / float64(totalRab) * 100
	}

	alert := ""
	if persen >= 100 {
		alert = "danger"
	} else if persen >= 80 {
		alert = "warning"
	}

	return &ProyekSummary{
		Proyek:          p,
		TotalRAB:        totalRab,
		TotalRealisasi:  totalRealisasi,
		PersenRealisasi: persen,
		AlertLevel:      alert,
	}, nil
}

func (s *ProyekService) ListProyek(perusahaanID string) ([]ProyekSummary, error) {
	proyeks, err := s.repo.FindAll(perusahaanID)
	if err != nil {
		return nil, err
	}

	summaries := make([]ProyekSummary, 0, len(proyeks))
	for i := range proyeks {
		summary, err := s.buildSummary(&proyeks[i])
		if err != nil {
			return nil, err
		}
		summaries = append(summaries, *summary)
	}
	return summaries, nil
}

func (s *ProyekService) GetProyek(id, perusahaanID string) (*ProyekSummary, error) {
	proyek, err := s.repo.FindByID(id, perusahaanID)
	if err != nil {
		return nil, errors.New("proyek tidak ditemukan")
	}
	return s.buildSummary(proyek)
}

func (s *ProyekService) CreateProyek(req CreateProyekRequest, perusahaanID string) (*model.Proyek, error) {
	if strings.TrimSpace(req.Nama) == "" {
		return nil, errors.New("nama proyek wajib diisi")
	}
	if req.NilaiKontrak < 1 {
		return nil, errors.New("nilai kontrak harus lebih dari 0")
	}

	proyek := &model.Proyek{
		BaseModel:    model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		Nama:         req.Nama,
		Alamat:       req.Alamat,
		NilaiKontrak: req.NilaiKontrak,
		TglMulai:     req.TglMulai,
		TglSelesai:   req.TglSelesai,
		Status:       model.StatusProyekAktif,
		ManajerID:    req.ManajerID,
	}

	if err := s.repo.Create(proyek); err != nil {
		return nil, err
	}
	return proyek, nil
}

func (s *ProyekService) UpdateProyek(id, perusahaanID string, req UpdateProyekRequest) (*model.Proyek, error) {
	proyek, err := s.repo.FindByID(id, perusahaanID)
	if err != nil {
		return nil, errors.New("proyek tidak ditemukan")
	}

	if strings.TrimSpace(req.Nama) != "" {
		proyek.Nama = req.Nama
	}
	if req.Alamat != "" {
		proyek.Alamat = req.Alamat
	}
	if req.NilaiKontrak > 0 {
		proyek.NilaiKontrak = req.NilaiKontrak
	}
	if !req.TglMulai.IsZero() {
		proyek.TglMulai = req.TglMulai
	}
	if !req.TglSelesai.IsZero() {
		proyek.TglSelesai = req.TglSelesai
	}
	if req.Status != "" {
		proyek.Status = req.Status
	}
	if req.ManajerID != "" {
		proyek.ManajerID = req.ManajerID
	}

	if err := s.repo.Update(proyek); err != nil {
		return nil, err
	}
	return proyek, nil
}

func (s *ProyekService) DeleteProyek(id, perusahaanID string) error {
	_, err := s.repo.FindByID(id, perusahaanID)
	if err != nil {
		return errors.New("proyek tidak ditemukan")
	}
	return s.repo.Delete(id, perusahaanID)
}
