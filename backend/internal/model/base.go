package model

import (
	"time"

	"gorm.io/gorm"
)

// BaseModel disematkan ke semua model utama.
// Menyediakan ID UUID, timestamp, soft delete, dan isolasi tenant.
type BaseModel struct {
	ID           string         `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	PerusahaanID string         `gorm:"type:varchar(36);index;not null" json:"perusahaan_id"`
}

// BaseTenantless digunakan untuk tabel yang tidak perlu perusahaan_id (mis. Perusahaan itu sendiri).
type BaseTenantless struct {
	ID        string         `gorm:"primaryKey;type:varchar(36);default:(UUID())" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}
