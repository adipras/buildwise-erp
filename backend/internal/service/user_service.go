package service

import (
	"errors"
	"strings"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type CreateUserRequest struct {
	Nama    string     `json:"nama"`
	Email   string     `json:"email"`
	Password string    `json:"password"`
	Role    model.Role `json:"role"`
	Telepon string     `json:"telepon"`
}

type UpdateUserRequest struct {
	Nama    string `json:"nama"`
	Telepon string `json:"telepon"`
	IsAktif *bool  `json:"is_aktif"`
}

type UserService struct {
	repo *repository.UserRepo
}

func NewUserService() *UserService {
	return &UserService{repo: &repository.UserRepo{}}
}

func (s *UserService) ListUsers(perusahaanID string) ([]UserDTO, error) {
	users, err := s.repo.FindAll(perusahaanID)
	if err != nil {
		return nil, err
	}

	dtos := make([]UserDTO, len(users))
	for i, u := range users {
		dtos[i] = *toUserDTO(&u)
	}
	return dtos, nil
}

func (s *UserService) CreateUser(perusahaanID string, req CreateUserRequest) (*UserDTO, error) {
	if strings.TrimSpace(req.Nama) == "" || strings.TrimSpace(req.Email) == "" || req.Password == "" {
		return nil, errors.New("nama, email, dan password wajib diisi")
	}

	validRoles := map[model.Role]bool{
		model.RoleOwner:         true,
		model.RoleManajer:       true,
		model.RoleMandor:        true,
		model.RoleAdminKeuangan: true,
	}
	if !validRoles[req.Role] {
		return nil, errors.New("role tidak valid")
	}

	if s.repo.EmailExists(req.Email) {
		return nil, errors.New("email sudah terdaftar")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		BaseModel:    model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		Nama:         req.Nama,
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: string(hash),
		Role:         req.Role,
		Telepon:      req.Telepon,
		IsAktif:      true,
	}

	if err := s.repo.Create(user); err != nil {
		return nil, err
	}

	return toUserDTO(user), nil
}

func (s *UserService) UpdateUser(id, perusahaanID string, req UpdateUserRequest) (*UserDTO, error) {
	user, err := s.repo.FindByID(id, perusahaanID)
	if err != nil {
		return nil, errors.New("user tidak ditemukan")
	}

	if strings.TrimSpace(req.Nama) != "" {
		user.Nama = req.Nama
	}
	if req.Telepon != "" {
		user.Telepon = req.Telepon
	}
	if req.IsAktif != nil {
		user.IsAktif = *req.IsAktif
	}

	if err := s.repo.Update(user); err != nil {
		return nil, err
	}

	return toUserDTO(user), nil
}

func (s *UserService) DeleteUser(id, perusahaanID string) error {
	user, err := s.repo.FindByID(id, perusahaanID)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}

	aktif := false
	user.IsAktif = aktif
	return s.repo.Update(user)
}
