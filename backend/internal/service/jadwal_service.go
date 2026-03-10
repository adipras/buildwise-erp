package service

import (
	"errors"
	"strings"
	"time"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
)

// MilestoneWithProgress menggabungkan Milestone dengan daftar ProgressUpdate-nya.
type MilestoneWithProgress struct {
	*model.Milestone
	ProgressUpdates []model.ProgressUpdate `json:"progress_updates,omitempty"`
}

// ProgressSummary berisi ringkasan progress proyek.
type ProgressSummary struct {
	WeightedActual  float64 `json:"weighted_actual"`
	WeightedPlanned float64 `json:"weighted_planned"`
	IsLate          bool    `json:"is_late"`
}

// KurvaSPoint di-re-export dari repository agar handler tidak perlu import dua package.
type KurvaSPoint = repository.KurvaSPoint

type CreateMilestoneRequest struct {
	Nama              string    `json:"nama" validate:"required"`
	Anggaran          int64     `json:"anggaran" validate:"min=0"`
	RabItemID         *string   `json:"rab_item_id"`
	TglRencanaMulai   time.Time `json:"tgl_rencana_mulai"`
	TglRencanaSelesai time.Time `json:"tgl_rencana_selesai"`
	PlannedPersen     float64   `json:"planned_persen" validate:"min=0,max=100"`
}

type UpdateMilestoneRequest struct {
	Nama              string               `json:"nama"`
	Anggaran          int64                `json:"anggaran"`
	RabItemID         *string              `json:"rab_item_id"`
	TglRencanaMulai   time.Time            `json:"tgl_rencana_mulai"`
	TglRencanaSelesai time.Time            `json:"tgl_rencana_selesai"`
	PlannedPersen     float64              `json:"planned_persen"`
	ActualPersen      float64              `json:"actual_persen"`
	Status            model.StatusMilestone `json:"status"`
}

type JadwalService interface {
	ListMilestone(proyekID, perusahaanID string) ([]model.Milestone, error)
	GetMilestone(id, proyekID, perusahaanID string) (*MilestoneWithProgress, error)
	CreateMilestone(proyekID, perusahaanID string, req CreateMilestoneRequest) (*model.Milestone, error)
	UpdateMilestone(id, proyekID, perusahaanID string, req UpdateMilestoneRequest) (*model.Milestone, error)
	DeleteMilestone(id, proyekID, perusahaanID string) error
	GetProgressSummary(proyekID, perusahaanID string) (*ProgressSummary, error)
	GetKurvaS(proyekID, perusahaanID string) ([]KurvaSPoint, error)
}

type jadwalService struct {
	milestoneRepo *repository.MilestoneRepo
	progressRepo  *repository.ProgressRepo
	kurvaSRepo    *repository.KurvaSRepo
	proyekRepo    *repository.ProyekRepo
}

func NewJadwalService() JadwalService {
	return &jadwalService{
		milestoneRepo: &repository.MilestoneRepo{},
		progressRepo:  &repository.ProgressRepo{},
		kurvaSRepo:    &repository.KurvaSRepo{},
		proyekRepo:    &repository.ProyekRepo{},
	}
}

func (s *jadwalService) verifyProyek(proyekID, perusahaanID string) error {
	_, err := s.proyekRepo.FindByID(proyekID, perusahaanID)
	if err != nil {
		return errors.New("proyek tidak ditemukan")
	}
	return nil
}

// computeStatus menghitung status milestone secara otomatis berdasarkan persen aktual dan planned.
func computeStatus(actualPersen, plannedPersen float64) model.StatusMilestone {
	switch {
	case actualPersen >= 100:
		return model.StatusMilestoneSelesai
	case actualPersen < plannedPersen-10:
		return model.StatusMilestoneTerlambat
	case actualPersen > 0:
		return model.StatusMilestoneSedangBerjalan
	default:
		return model.StatusMilestoneBelumMulai
	}
}

func (s *jadwalService) ListMilestone(proyekID, perusahaanID string) ([]model.Milestone, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	return s.milestoneRepo.FindAllByProyek(proyekID)
}

func (s *jadwalService) GetMilestone(id, proyekID, perusahaanID string) (*MilestoneWithProgress, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	m, err := s.milestoneRepo.FindByID(id, proyekID)
	if err != nil {
		return nil, errors.New("milestone tidak ditemukan")
	}
	updates, err := s.progressRepo.FindAllByMilestone(id)
	if err != nil {
		return nil, err
	}
	return &MilestoneWithProgress{Milestone: m, ProgressUpdates: updates}, nil
}

func (s *jadwalService) CreateMilestone(proyekID, perusahaanID string, req CreateMilestoneRequest) (*model.Milestone, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Nama) == "" {
		return nil, errors.New("nama milestone wajib diisi")
	}
	if req.Anggaran < 0 {
		return nil, errors.New("anggaran tidak boleh negatif")
	}

	m := &model.Milestone{
		BaseModel:         model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		ProyekID:          proyekID,
		RabItemID:         req.RabItemID,
		Nama:              req.Nama,
		Anggaran:          req.Anggaran,
		TglRencanaMulai:   req.TglRencanaMulai,
		TglRencanaSelesai: req.TglRencanaSelesai,
		PlannedPersen:     req.PlannedPersen,
		ActualPersen:      0,
		Status:            model.StatusMilestoneBelumMulai,
	}

	if err := s.milestoneRepo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *jadwalService) UpdateMilestone(id, proyekID, perusahaanID string, req UpdateMilestoneRequest) (*model.Milestone, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	m, err := s.milestoneRepo.FindByID(id, proyekID)
	if err != nil {
		return nil, errors.New("milestone tidak ditemukan")
	}

	if strings.TrimSpace(req.Nama) != "" {
		m.Nama = req.Nama
	}
	if req.Anggaran >= 0 {
		m.Anggaran = req.Anggaran
	}
	if req.RabItemID != nil {
		m.RabItemID = req.RabItemID
	}
	if !req.TglRencanaMulai.IsZero() {
		m.TglRencanaMulai = req.TglRencanaMulai
	}
	if !req.TglRencanaSelesai.IsZero() {
		m.TglRencanaSelesai = req.TglRencanaSelesai
	}
	if req.PlannedPersen != 0 {
		m.PlannedPersen = req.PlannedPersen
	}
	// ActualPersen bisa di-set eksplisit via UpdateMilestone
	m.ActualPersen = req.ActualPersen

	m.Status = computeStatus(m.ActualPersen, m.PlannedPersen)

	if err := s.milestoneRepo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *jadwalService) DeleteMilestone(id, proyekID, perusahaanID string) error {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return err
	}
	_, err := s.milestoneRepo.FindByID(id, proyekID)
	if err != nil {
		return errors.New("milestone tidak ditemukan")
	}
	return s.milestoneRepo.Delete(id, proyekID)
}

func (s *jadwalService) GetProgressSummary(proyekID, perusahaanID string) (*ProgressSummary, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}

	actual, err := s.milestoneRepo.GetWeightedProgress(proyekID)
	if err != nil {
		return nil, err
	}
	planned, err := s.milestoneRepo.GetCurrentPlannedProgress(proyekID)
	if err != nil {
		return nil, err
	}

	return &ProgressSummary{
		WeightedActual:  actual,
		WeightedPlanned: planned,
		IsLate:          actual < planned-10,
	}, nil
}

func (s *jadwalService) GetKurvaS(proyekID, perusahaanID string) ([]KurvaSPoint, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	return s.kurvaSRepo.GetKurvaS(proyekID)
}
