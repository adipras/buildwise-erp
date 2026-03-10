package model

// Perusahaan adalah tenant utama sistem.
// Semua data lain terikat ke perusahaan melalui perusahaan_id.
type Perusahaan struct {
	BaseTenantless
	Nama        string  `gorm:"type:varchar(255);not null" json:"nama"`
	Telepon     string  `gorm:"type:varchar(20)" json:"telepon"`
	Alamat      string  `gorm:"type:text" json:"alamat"`
	LogoURL     string  `gorm:"type:varchar(500)" json:"logo_url"`
	Users       []User  `gorm:"foreignKey:PerusahaanID" json:"-"`
	Proyek      []Proyek `gorm:"foreignKey:PerusahaanID" json:"-"`
}

type Role string

const (
	RoleOwner         Role = "owner"
	RoleManajer       Role = "manajer"
	RoleMandor        Role = "mandor"
	RoleAdminKeuangan Role = "admin_keuangan"
)

// User adalah pengguna sistem dengan role RBAC.
type User struct {
	BaseModel
	Nama         string `gorm:"type:varchar(255);not null" json:"nama"`
	Email        string `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string `gorm:"type:varchar(255);not null" json:"-"`
	Role         Role   `gorm:"type:enum('owner','manajer','mandor','admin_keuangan');not null" json:"role"`
	Telepon      string `gorm:"type:varchar(20)" json:"telepon"`
	IsAktif      bool   `gorm:"default:true" json:"is_aktif"`
	RefreshToken string `gorm:"type:varchar(500);index" json:"-"`
}
