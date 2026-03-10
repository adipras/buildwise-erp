package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type ProgressRepository interface {
	FindAllByMilestone(milestoneID string) ([]model.ProgressUpdate, error)
	FindByID(id, milestoneID string) (*model.ProgressUpdate, error)
	Create(p *model.ProgressUpdate) error
	Delete(id, milestoneID string) error
	CreateFoto(f *model.FotoProgress) error
	FindFotoByUpdate(progressUpdateID string) ([]model.FotoProgress, error)
}

type ProgressRepo struct{}

func (r *ProgressRepo) FindAllByMilestone(milestoneID string) ([]model.ProgressUpdate, error) {
	var updates []model.ProgressUpdate
	err := database.DB.Where("milestone_id = ?", milestoneID).
		Order("created_at DESC").
		Find(&updates).Error
	return updates, err
}

func (r *ProgressRepo) FindByID(id, milestoneID string) (*model.ProgressUpdate, error) {
	var p model.ProgressUpdate
	err := database.DB.Where("id = ? AND milestone_id = ?", id, milestoneID).First(&p).Error
	return &p, err
}

func (r *ProgressRepo) Create(p *model.ProgressUpdate) error {
	return database.DB.Create(p).Error
}

// Delete melakukan soft delete pada ProgressUpdate.
func (r *ProgressRepo) Delete(id, milestoneID string) error {
	return database.DB.Where("id = ? AND milestone_id = ?", id, milestoneID).
		Delete(&model.ProgressUpdate{}).Error
}

func (r *ProgressRepo) CreateFoto(f *model.FotoProgress) error {
	return database.DB.Create(f).Error
}

func (r *ProgressRepo) FindFotoByUpdate(progressUpdateID string) ([]model.FotoProgress, error) {
	var fotos []model.FotoProgress
	err := database.DB.Where("progress_update_id = ?", progressUpdateID).Find(&fotos).Error
	return fotos, err
}
