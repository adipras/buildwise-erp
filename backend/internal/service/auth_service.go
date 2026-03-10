package service

import (
	"errors"
	"time"

	"buildwise/internal/config"
	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserDTO struct {
	ID           string     `json:"id"`
	Nama         string     `json:"nama"`
	Email        string     `json:"email"`
	Role         model.Role `json:"role"`
	Telepon      string     `json:"telepon"`
	IsAktif      bool       `json:"is_aktif"`
	PerusahaanID string     `json:"perusahaan_id"`
	CreatedAt    time.Time  `json:"created_at"`
}

type TokenPair struct {
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	User         *UserDTO `json:"user"`
}

type AuthService struct {
	repo *repository.AuthRepo
}

func NewAuthService() *AuthService {
	return &AuthService{repo: &repository.AuthRepo{}}
}

func (s *AuthService) Login(email, password string) (*TokenPair, error) {
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, errors.New("email atau password salah")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("email atau password salah")
	}

	return s.issueTokens(user)
}

func (s *AuthService) Refresh(refreshToken string) (*TokenPair, error) {
	user, err := s.repo.FindByRefreshToken(refreshToken)
	if err != nil {
		return nil, errors.New("refresh token tidak valid atau sudah kadaluarsa")
	}

	return s.issueTokens(user)
}

func (s *AuthService) Logout(userID string) error {
	return s.repo.ClearRefreshToken(userID)
}

func (s *AuthService) Me(userID string) (*UserDTO, error) {
	user, err := s.repo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user tidak ditemukan")
	}
	return toUserDTO(user), nil
}

func (s *AuthService) issueTokens(user *model.User) (*TokenPair, error) {
	expiry := time.Duration(config.App.JWTExpiresHours) * time.Hour
	claims := jwt.MapClaims{
		"user_id":       user.ID,
		"perusahaan_id": user.PerusahaanID,
		"role":          string(user.Role),
		"exp":           time.Now().Add(expiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString([]byte(config.App.JWTSecret))
	if err != nil {
		return nil, err
	}

	refreshToken := uuid.New().String()
	if err := s.repo.SaveRefreshToken(user.ID, refreshToken); err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         toUserDTO(user),
	}, nil
}

func toUserDTO(u *model.User) *UserDTO {
	return &UserDTO{
		ID:           u.ID,
		Nama:         u.Nama,
		Email:        u.Email,
		Role:         u.Role,
		Telepon:      u.Telepon,
		IsAktif:      u.IsAktif,
		PerusahaanID: u.PerusahaanID,
		CreatedAt:    u.CreatedAt,
	}
}
