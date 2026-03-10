package service

import (
	"errors"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
)

type CreateProgressRequest struct {
	Persen  float64 `json:"persen" validate:"required,min=0,max=100"`
	Catatan string  `json:"catatan"`
	FotoURLs []struct {
		URL     string `json:"url"`
		Caption string `json:"caption"`
	} `json:"foto_urls"`
}

type ProgressService interface {
	ListProgress(milestoneID, proyekID, perusahaanID string) ([]model.ProgressUpdate, error)
	CreateProgress(milestoneID, proyekID, perusahaanID, dibuatOlehID string, req CreateProgressRequest) (*model.ProgressUpdate, error)
	DeleteProgress(id, milestoneID, proyekID, perusahaanID string) error
}

type progressService struct {
	progressRepo  *repository.ProgressRepo
	milestoneRepo *repository.MilestoneRepo
	proyekRepo    *repository.ProyekRepo
}

func NewProgressService() ProgressService {
	return &progressService{
		progressRepo:  &repository.ProgressRepo{},
		milestoneRepo: &repository.MilestoneRepo{},
		proyekRepo:    &repository.ProyekRepo{},
	}
}

func (s *progressService) verifyContext(milestoneID, proyekID, perusahaanID string) (*model.Milestone, error) {
	_, err := s.proyekRepo.FindByID(proyekID, perusahaanID)
	if err != nil {
		return nil, errors.New("proyek tidak ditemukan")
	}
	m, err := s.milestoneRepo.FindByID(milestoneID, proyekID)
	if err != nil {
		return nil, errors.New("milestone tidak ditemukan")
	}
	return m, nil
}

func (s *progressService) ListProgress(milestoneID, proyekID, perusahaanID string) ([]model.ProgressUpdate, error) {
	if _, err := s.verifyContext(milestoneID, proyekID, perusahaanID); err != nil {
		return nil, err
	}
	return s.progressRepo.FindAllByMilestone(milestoneID)
}

func (s *progressService) CreateProgress(milestoneID, proyekID, perusahaanID, dibuatOlehID string, req CreateProgressRequest) (*model.ProgressUpdate, error) {
	milestone, err := s.verifyContext(milestoneID, proyekID, perusahaanID)
	if err != nil {
		return nil, err
	}
	if req.Persen < 0 || req.Persen > 100 {
		return nil, errors.New("persen harus antara 0 dan 100")
	}

	update := &model.ProgressUpdate{
		BaseModel:    model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		MilestoneID:  milestoneID,
		Persen:       req.Persen,
		Catatan:      req.Catatan,
		DibuatOlehID: dibuatOlehID,
	}
	if err := s.progressRepo.Create(update); err != nil {
		return nil, err
	}

	for _, f := range req.FotoURLs {
		if f.URL == "" {
			continue
		}
		foto := &model.FotoProgress{
			BaseModel:        model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
			ProgressUpdateID: update.ID,
			URL:              f.URL,
			Caption:          f.Caption,
		}
		if err := s.progressRepo.CreateFoto(foto); err != nil {
			return nil, err
		}
	}

	// Update actual_persen milestone (langsung replace, bukan kumulatif)
	milestone.ActualPersen = req.Persen
	milestone.Status = computeStatus(milestone.ActualPersen, milestone.PlannedPersen)
	if err := s.milestoneRepo.Update(milestone); err != nil {
		return nil, err
	}

	return update, nil
}

func (s *progressService) DeleteProgress(id, milestoneID, proyekID, perusahaanID string) error {
	if _, err := s.verifyContext(milestoneID, proyekID, perusahaanID); err != nil {
		return err
	}
	_, err := s.progressRepo.FindByID(id, milestoneID)
	if err != nil {
		return errors.New("progress update tidak ditemukan")
	}
	return s.progressRepo.Delete(id, milestoneID)
}
