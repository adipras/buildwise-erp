package model

type TipeNotifikasi string

const (
	NotifProgressUpdate    TipeNotifikasi = "progress_update"
	NotifKeterlambatan     TipeNotifikasi = "keterlambatan"
	NotifAnggaranMendekati TipeNotifikasi = "anggaran_mendekati"
	NotifStokKritis        TipeNotifikasi = "stok_kritis"
	NotifApprovalUpah      TipeNotifikasi = "approval_upah"
)

// Notifikasi disimpan di DB dan juga dikirim via WhatsApp (asynq queue).
type Notifikasi struct {
	BaseModel
	UserID    string         `gorm:"type:varchar(36);index;not null" json:"user_id"`
	User      *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ProyekID  *string        `gorm:"type:varchar(36)" json:"proyek_id"`
	Tipe      TipeNotifikasi `gorm:"type:varchar(50);not null" json:"tipe"`
	Judul     string         `gorm:"type:varchar(255);not null" json:"judul"`
	Pesan     string         `gorm:"type:text;not null" json:"pesan"`
	IsRead    bool           `gorm:"default:false" json:"is_read"`
	IsSentWA  bool           `gorm:"default:false" json:"is_sent_wa"`
}
