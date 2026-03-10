package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type UserRepo struct{}

func (r *UserRepo) FindAll(perusahaanID string) ([]model.User, error) {
	var users []model.User
	err := database.DB.Where("perusahaan_id = ?", perusahaanID).Order("created_at ASC").Find(&users).Error
	return users, err
}

func (r *UserRepo) FindByID(id, perusahaanID string) (*model.User, error) {
	var user model.User
	err := database.DB.Where("id = ? AND perusahaan_id = ?", id, perusahaanID).First(&user).Error
	return &user, err
}

func (r *UserRepo) EmailExists(email string) bool {
	var count int64
	database.DB.Model(&model.User{}).Where("email = ?", email).Count(&count)
	return count > 0
}

func (r *UserRepo) Create(user *model.User) error {
	return database.DB.Create(user).Error
}

func (r *UserRepo) Update(user *model.User) error {
	return database.DB.Save(user).Error
}
