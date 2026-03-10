package repository

import (
	"time"

	"buildwise/internal/database"
	"buildwise/internal/model"
)

type MilestoneRepository interface {
	FindAllByProyek(proyekID string) ([]model.Milestone, error)
	FindByID(id, proyekID string) (*model.Milestone, error)
	Create(m *model.Milestone) error
	Update(m *model.Milestone) error
	Delete(id, proyekID string) error
	GetWeightedProgress(proyekID string) (float64, error)
	GetCurrentPlannedProgress(proyekID string) (float64, error)
}

type MilestoneRepo struct{}

func (r *MilestoneRepo) FindAllByProyek(proyekID string) ([]model.Milestone, error) {
	var milestones []model.Milestone
	err := database.DB.Where("proyek_id = ?", proyekID).
		Order("tgl_rencana_mulai ASC").
		Find(&milestones).Error
	return milestones, err
}

func (r *MilestoneRepo) FindByID(id, proyekID string) (*model.Milestone, error) {
	var m model.Milestone
	err := database.DB.Where("id = ? AND proyek_id = ?", id, proyekID).First(&m).Error
	return &m, err
}

func (r *MilestoneRepo) Create(m *model.Milestone) error {
	return database.DB.Create(m).Error
}

func (r *MilestoneRepo) Update(m *model.Milestone) error {
	return database.DB.Save(m).Error
}

func (r *MilestoneRepo) Delete(id, proyekID string) error {
	return database.DB.Where("id = ? AND proyek_id = ?", id, proyekID).
		Delete(&model.Milestone{}).Error
}

// GetWeightedProgress menghitung weighted-average actual progress semua milestone.
// weighted = SUM(actual_persen * anggaran) / SUM(anggaran)
func (r *MilestoneRepo) GetWeightedProgress(proyekID string) (float64, error) {
	type result struct {
		WeightedProgress float64
	}
	var res result
	err := database.DB.Model(&model.Milestone{}).
		Where("proyek_id = ?", proyekID).
		Select("COALESCE(SUM(actual_persen * anggaran) / NULLIF(SUM(anggaran), 0), 0) AS weighted_progress").
		Scan(&res).Error
	return res.WeightedProgress, err
}

// GetCurrentPlannedProgress menghitung planned progress kumulatif sampai sekarang
// berdasarkan interpolasi linear TglRencanaMulai/Selesai setiap milestone.
func (r *MilestoneRepo) GetCurrentPlannedProgress(proyekID string) (float64, error) {
	milestones, err := r.FindAllByProyek(proyekID)
	if err != nil {
		return 0, err
	}
	if len(milestones) == 0 {
		return 0, nil
	}

	var totalAnggaran int64
	for _, m := range milestones {
		totalAnggaran += m.Anggaran
	}
	if totalAnggaran == 0 {
		return 0, nil
	}

	now := time.Now()
	var weightedSum float64
	for _, m := range milestones {
		var plannedNow float64
		if now.Before(m.TglRencanaMulai) {
			plannedNow = 0
		} else if !now.Before(m.TglRencanaSelesai) {
			plannedNow = m.PlannedPersen
		} else {
			duration := m.TglRencanaSelesai.Sub(m.TglRencanaMulai)
			elapsed := now.Sub(m.TglRencanaMulai)
			if duration > 0 {
				plannedNow = m.PlannedPersen * elapsed.Seconds() / duration.Seconds()
			}
		}
		weightedSum += plannedNow * float64(m.Anggaran)
	}
	return weightedSum / float64(totalAnggaran), nil
}
