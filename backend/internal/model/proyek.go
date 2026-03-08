package model

import "time"

type StatusProyek string

const (
	StatusProyekAktif    StatusProyek = "aktif"
	StatusProyekSelesai  StatusProyek = "selesai"
	StatusProyekTerlambat StatusProyek = "terlambat"
	StatusProyekArsip    StatusProyek = "arsip"
)

type Proyek struct {
	BaseModel
	Nama          string       `gorm:"type:varchar(255);not null" json:"nama"`
	Alamat        string       `gorm:"type:text" json:"alamat"`
	NilaiKontrak  int64        `gorm:"not null" json:"nilai_kontrak"`
	TglMulai      time.Time    `json:"tgl_mulai"`
	TglSelesai    time.Time    `json:"tgl_selesai"`
	Status        StatusProyek `gorm:"type:enum('aktif','selesai','terlambat','arsip');default:'aktif'" json:"status"`
	ManajerID     string       `gorm:"type:varchar(36)" json:"manajer_id"`
	Manajer       *User        `gorm:"foreignKey:ManajerID" json:"manajer,omitempty"`
	RabItems      []RabItem    `gorm:"foreignKey:ProyekID" json:"rab_items,omitempty"`
	Milestones    []Milestone  `gorm:"foreignKey:ProyekID" json:"milestones,omitempty"`
}

type StatusRab string

const (
	StatusRabDraft  StatusRab = "draft"
	StatusRabLocked StatusRab = "locked"
)

// RabItem adalah item Rencana Anggaran Biaya.
// Setelah status = 'locked', item tidak boleh diubah (HTTP 403).
type RabItem struct {
	BaseModel
	ProyekID    string    `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	Kode        string    `gorm:"type:varchar(10)" json:"kode"`
	Nama        string    `gorm:"type:varchar(255);not null" json:"nama"`
	Volume      float64   `gorm:"not null" json:"volume"`
	Satuan      string    `gorm:"type:varchar(50)" json:"satuan"`
	HargaSatuan int64     `gorm:"not null" json:"harga_satuan"`
	// TotalAnggaran = volume × harga_satuan, dikalkulasi otomatis
	TotalAnggaran int64     `gorm:"not null" json:"total_anggaran"`
	Status        StatusRab `gorm:"type:enum('draft','locked');default:'draft'" json:"status"`
	Pengeluaran   []Pengeluaran `gorm:"foreignKey:RabItemID" json:"pengeluaran,omitempty"`
}

// Pengeluaran bersifat append-only — hanya soft delete yang diizinkan.
type Pengeluaran struct {
	BaseModel
	ProyekID    string    `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	RabItemID   *string   `gorm:"type:varchar(36)" json:"rab_item_id"`
	Kategori    string    `gorm:"type:varchar(100);not null" json:"kategori"`
	Deskripsi   string    `gorm:"type:text" json:"deskripsi"`
	Jumlah      int64     `gorm:"not null" json:"jumlah"`
	TglTransaksi time.Time `json:"tgl_transaksi"`
	BuktiFotoURL string   `gorm:"type:varchar(500)" json:"bukti_foto_url"`
	DibuatOlehID string   `gorm:"type:varchar(36)" json:"dibuat_oleh_id"`
	DibuatOleh  *User     `gorm:"foreignKey:DibuatOlehID" json:"dibuat_oleh,omitempty"`
}
