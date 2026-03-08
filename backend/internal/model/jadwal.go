package model

import "time"

type StatusMilestone string

const (
	StatusMilestoneBelumMulai    StatusMilestone = "belum_mulai"
	StatusMilestoneSedangBerjalan StatusMilestone = "sedang_berjalan"
	StatusMilestoneSelesai       StatusMilestone = "selesai"
	StatusMilestoneTerlambat     StatusMilestone = "terlambat"
)

// Milestone adalah tahapan pekerjaan dalam proyek.
// Progress keseluruhan proyek = weighted average semua milestone
// dengan bobot = milestone.anggaran / total_anggaran_proyek.
type Milestone struct {
	BaseModel
	ProyekID        string          `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	RabItemID       *string         `gorm:"type:varchar(36)" json:"rab_item_id"`
	Nama            string          `gorm:"type:varchar(255);not null" json:"nama"`
	Anggaran        int64           `json:"anggaran"`
	TglRencanaMulai time.Time       `json:"tgl_rencana_mulai"`
	TglRencanaSelesai time.Time     `json:"tgl_rencana_selesai"`
	PlannedPersen   float64         `gorm:"default:0" json:"planned_persen"`
	ActualPersen    float64         `gorm:"default:0" json:"actual_persen"`
	// Status otomatis: TERLAMBAT jika actual_persen < planned_persen - 10
	Status          StatusMilestone `gorm:"type:enum('belum_mulai','sedang_berjalan','selesai','terlambat');default:'belum_mulai'" json:"status"`
	ProgressUpdates []ProgressUpdate `gorm:"foreignKey:MilestoneID" json:"progress_updates,omitempty"`
}

type ProgressUpdate struct {
	BaseModel
	MilestoneID  string        `gorm:"type:varchar(36);index;not null" json:"milestone_id"`
	Persen       float64       `gorm:"not null" json:"persen"`
	Catatan      string        `gorm:"type:text" json:"catatan"`
	DibuatOlehID string        `gorm:"type:varchar(36)" json:"dibuat_oleh_id"`
	DibuatOleh   *User         `gorm:"foreignKey:DibuatOlehID" json:"dibuat_oleh,omitempty"`
	Foto         []FotoProgress `gorm:"foreignKey:ProgressUpdateID" json:"foto,omitempty"`
}

type FotoProgress struct {
	BaseModel
	ProgressUpdateID string `gorm:"type:varchar(36);index;not null" json:"progress_update_id"`
	URL              string `gorm:"type:varchar(500);not null" json:"url"`
	Caption          string `gorm:"type:varchar(255)" json:"caption"`
}
