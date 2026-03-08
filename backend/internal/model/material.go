package model

import "time"

type Material struct {
	BaseModel
	Nama        string  `gorm:"type:varchar(255);not null" json:"nama"`
	Satuan      string  `gorm:"type:varchar(50);not null" json:"satuan"`
	HargaSatuan int64   `json:"harga_satuan"`
	Keterangan  string  `gorm:"type:text" json:"keterangan"`
}

// KebutuhanMaterial adalah estimasi kebutuhan material per proyek (dari RAB/koefisien SNI).
type KebutuhanMaterial struct {
	BaseModel
	ProyekID   string   `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	MaterialID string   `gorm:"type:varchar(36);not null" json:"material_id"`
	Material   *Material `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	Volume     float64  `json:"volume"`
	Satuan     string   `gorm:"type:varchar(50)" json:"satuan"`
}

type Supplier struct {
	BaseModel
	Nama    string `gorm:"type:varchar(255);not null" json:"nama"`
	Telepon string `gorm:"type:varchar(20)" json:"telepon"`
	Alamat  string `gorm:"type:text" json:"alamat"`
	Kontak  string `gorm:"type:varchar(255)" json:"kontak"`
}

type StatusPO string

const (
	StatusPODraft    StatusPO = "draft"
	StatusPODikirim  StatusPO = "dikirim"
	StatusPODiterima StatusPO = "diterima"
	StatusPOBatal    StatusPO = "batal"
)

type PurchaseOrder struct {
	BaseModel
	ProyekID   string   `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	SupplierID string   `gorm:"type:varchar(36);not null" json:"supplier_id"`
	Supplier   *Supplier `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	NomorPO    string   `gorm:"type:varchar(100)" json:"nomor_po"`
	TglPO      time.Time `json:"tgl_po"`
	TotalNilai int64    `json:"total_nilai"`
	Status     StatusPO `gorm:"type:enum('draft','dikirim','diterima','batal');default:'draft'" json:"status"`
	Items      []PoItem `gorm:"foreignKey:PurchaseOrderID" json:"items,omitempty"`
}

type PoItem struct {
	BaseModel
	PurchaseOrderID string    `gorm:"type:varchar(36);index;not null" json:"purchase_order_id"`
	MaterialID      string    `gorm:"type:varchar(36);not null" json:"material_id"`
	Material        *Material `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	QtyDipesan      float64   `gorm:"not null" json:"qty_dipesan"`
	QtyDiterima     float64   `gorm:"default:0" json:"qty_diterima"`
	HargaSatuan     int64     `gorm:"not null" json:"harga_satuan"`
}

// StokMaterial adalah ringkasan stok per material per proyek.
// stok_sisa = SUM(qty_masuk) - SUM(qty_terpakai)
type StokMaterial struct {
	BaseModel
	ProyekID    string    `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	MaterialID  string    `gorm:"type:varchar(36);not null" json:"material_id"`
	Material    *Material `gorm:"foreignKey:MaterialID" json:"material,omitempty"`
	QtyMasuk    float64   `gorm:"default:0" json:"qty_masuk"`
	QtyTerpakai float64   `gorm:"default:0" json:"qty_terpakai"`
	StokMinimum float64   `gorm:"default:0" json:"stok_minimum"`
	// IsKritis = true jika (qty_masuk - qty_terpakai) < stok_minimum
	IsKritis    bool      `gorm:"default:false" json:"is_kritis"`
}

// PenggunaanMaterial dicatat setiap kali material dipakai di lapangan.
// Tidak boleh melebihi stok tersedia (validasi di service layer).
type PenggunaanMaterial struct {
	BaseModel
	ProyekID   string    `gorm:"type:varchar(36);index;not null" json:"proyek_id"`
	MaterialID string    `gorm:"type:varchar(36);not null" json:"material_id"`
	Qty        float64   `gorm:"not null" json:"qty"`
	Keterangan string    `gorm:"type:text" json:"keterangan"`
	TglPakai   time.Time `json:"tgl_pakai"`
	DibuatOlehID string  `gorm:"type:varchar(36)" json:"dibuat_oleh_id"`
}
