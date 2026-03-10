package repository

import (
	"buildwise/internal/database"
	"buildwise/internal/model"
)

type AuthRepo struct{}

func (r *AuthRepo) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := database.DB.Where("email = ? AND is_aktif = true", email).First(&user).Error
	return &user, err
}

func (r *AuthRepo) FindByRefreshToken(token string) (*model.User, error) {
	var user model.User
	err := database.DB.Where("refresh_token = ? AND is_aktif = true", token).First(&user).Error
	return &user, err
}

func (r *AuthRepo) FindByID(id string) (*model.User, error) {
	var user model.User
	err := database.DB.Where("id = ? AND is_aktif = true", id).First(&user).Error
	return &user, err
}

func (r *AuthRepo) SaveRefreshToken(userID, token string) error {
	return database.DB.Model(&model.User{}).Where("id = ?", userID).Update("refresh_token", token).Error
}

func (r *AuthRepo) ClearRefreshToken(userID string) error {
	return database.DB.Model(&model.User{}).Where("id = ?", userID).Update("refresh_token", "").Error
}
