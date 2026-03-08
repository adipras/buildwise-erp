package model

import "time"

type TipePekerja string

const (
	TipeMandor TipePekerja = "mandor"
	TipeTukang TipePekerja = "tukang"
	TipeKuli   TipePekerja = "kuli"
)

type Pekerja struct {
	BaseModel
	Nama        string      `gorm:"type:varchar(255);not null" json:"nama"`
	Telepon     string      `gorm:"type:varchar(20)" json:"telepon"`
	Tipe        TipePekerja `gorm:"type:enum('mandor','tukang','kuli');not null" json:"tipe"`
	UpahHarian  int64       `gorm:"not null" json:"upah_harian"`
	IsAktif     bool        `gorm:"default:true" json:"is_aktif"`
}

type PenugasanProyek struct {
	BaseModel
	ProyekID  string     `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	PekerjaID string     `gorm:"type:varchar(36);not null" json:"pekerja_id"`
	Pekerja   *Pekerja   `gorm:"foreignKey:PekerjaID" json:"pekerja,omitempty"`
	TglMulai  time.Time  `json:"tgl_mulai"`
	TglSelesai *time.Time `json:"tgl_selesai"`
	IsAktif   bool       `gorm:"default:true" json:"is_aktif"`
}

type StatusAbsensi string

const (
	StatusHadir        StatusAbsensi = "hadir"
	StatusSetengahHari StatusAbsensi = "setengah_hari"
	StatusLembur       StatusAbsensi = "lembur"
	StatusTidakHadir   StatusAbsensi = "tidak_hadir"
)

// Absensi dicatat per pekerja per hari.
// Idempoten: satu mandor tidak boleh input absensi yang sama dua kali
// (unik per proyek_id + pekerja_id + tanggal + dicatat_oleh_id).
type Absensi struct {
	BaseModel
	ProyekID      string        `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	PekerjaID     string        `gorm:"type:varchar(36);not null" json:"pekerja_id"`
	Pekerja       *Pekerja      `gorm:"foreignKey:PekerjaID" json:"pekerja,omitempty"`
	Tanggal       time.Time     `gorm:"type:date;not null" json:"tanggal"`
	Status        StatusAbsensi `gorm:"type:enum('hadir','setengah_hari','lembur','tidak_hadir');not null" json:"status"`
	JamKerja      float64       `gorm:"default:8" json:"jam_kerja"`
	// UpahHarian di-snapshot dari data pekerja saat input (tidak berubah jika upah diedit)
	UpahHarian    int64         `gorm:"not null" json:"upah_harian"`
	// UpahDibayar dikalkulasi otomatis berdasarkan status
	UpahDibayar   int64         `gorm:"not null" json:"upah_dibayar"`
	DicatatOlehID string        `gorm:"type:varchar(36)" json:"dicatat_oleh_id"`
}

// PembayaranUpah bersifat append-only — hanya soft delete yang diizinkan.
// Setelah diapprove, otomatis membuat record Pengeluaran dengan kategori 'tenaga_kerja'.
type PembayaranUpah struct {
	BaseModel
	ProyekID      string     `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	PekerjaID     string     `gorm:"type:varchar(36);not null" json:"pekerja_id"`
	Pekerja       *Pekerja   `gorm:"foreignKey:PekerjaID" json:"pekerja,omitempty"`
	PeriodeMulai  time.Time  `json:"periode_mulai"`
	PeriodeSelesai time.Time `json:"periode_selesai"`
	TotalUpah     int64      `gorm:"not null" json:"total_upah"`
	IsApproved    bool       `gorm:"default:false" json:"is_approved"`
	ApprovedOlehID *string   `gorm:"type:varchar(36)" json:"approved_oleh_id"`
	TglApproved   *time.Time `json:"tgl_approved"`
	IsBayar       bool       `gorm:"default:false" json:"is_bayar"`
	TglBayar      *time.Time `json:"tgl_bayar"`
	PengeluaranID *string    `gorm:"type:varchar(36)" json:"pengeluaran_id"` // link ke Pengeluaran yang dibuat otomatis
}
