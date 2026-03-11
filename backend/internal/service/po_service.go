package service

import (
	"errors"
	"time"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
)

// ─── Request / Response Types ─────────────────────────────────────────────────

type PoItemInput struct {
	MaterialID  string  `json:"material_id"`
	QtyDipesan  float64 `json:"qty_dipesan"`
	HargaSatuan int64   `json:"harga_satuan"`
}

type CreatePoRequest struct {
	SupplierID string       `json:"supplier_id"`
	NomorPO    string       `json:"nomor_po"`
	TglPO      time.Time    `json:"tgl_po"`
	Items      []PoItemInput `json:"items"`
}

type PakaiMaterialRequest struct {
	MaterialID string    `json:"material_id"`
	Qty        float64   `json:"qty"`
	Keterangan string    `json:"keterangan"`
	TglPakai   time.Time `json:"tgl_pakai"`
}

// StokInfo menambahkan field computed stok_sisa ke StokMaterial.
type StokInfo struct {
	*model.StokMaterial
	StokSisa float64 `json:"stok_sisa"`
}

// ─── Service Interface ────────────────────────────────────────────────────────

type PoService interface {
	ListPO(proyekID, perusahaanID string) ([]model.PurchaseOrder, error)
	GetPO(id, proyekID, perusahaanID string) (*model.PurchaseOrder, error)
	CreatePO(proyekID, perusahaanID string, req CreatePoRequest) (*model.PurchaseOrder, error)
	TerimaPO(id, proyekID, perusahaanID string) (*model.PurchaseOrder, error)
	DeletePO(id, proyekID, perusahaanID string) error

	ListStok(proyekID, perusahaanID string) ([]StokInfo, error)
	PakaiMaterial(proyekID, perusahaanID, userID string, req PakaiMaterialRequest) (*model.PenggunaanMaterial, error)
	ListPenggunaan(proyekID, perusahaanID string) ([]model.PenggunaanMaterial, error)
}

type poService struct {
	poRepo       *repository.PoRepo
	stokRepo     *repository.StokRepo
	proyekRepo   *repository.ProyekRepo
	materialRepo *repository.MaterialRepo
}

func NewPoService() PoService {
	return &poService{
		poRepo:       &repository.PoRepo{},
		stokRepo:     &repository.StokRepo{},
		proyekRepo:   &repository.ProyekRepo{},
		materialRepo: &repository.MaterialRepo{},
	}
}

func (s *poService) verifyProyek(proyekID, perusahaanID string) error {
	if _, err := s.proyekRepo.FindByID(proyekID, perusahaanID); err != nil {
		return errors.New("proyek tidak ditemukan")
	}
	return nil
}

// ─── PO ──────────────────────────────────────────────────────────────────────

func (s *poService) ListPO(proyekID, perusahaanID string) ([]model.PurchaseOrder, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	return s.poRepo.FindAllByProyek(proyekID)
}

func (s *poService) GetPO(id, proyekID, perusahaanID string) (*model.PurchaseOrder, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	po, err := s.poRepo.FindByID(id, proyekID)
	if err != nil {
		return nil, errors.New("purchase order tidak ditemukan")
	}
	return po, nil
}

func (s *poService) CreatePO(proyekID, perusahaanID string, req CreatePoRequest) (*model.PurchaseOrder, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	if req.SupplierID == "" {
		return nil, errors.New("supplier wajib dipilih")
	}
	if len(req.Items) == 0 {
		return nil, errors.New("PO harus memiliki minimal 1 item")
	}

	var totalNilai int64
	items := make([]model.PoItem, 0, len(req.Items))
	for _, it := range req.Items {
		if it.QtyDipesan <= 0 {
			return nil, errors.New("qty dipesan harus lebih dari 0")
		}
		if it.MaterialID == "" {
			return nil, errors.New("material wajib dipilih untuk setiap item")
		}
		items = append(items, model.PoItem{
			BaseModel:   model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
			MaterialID:  it.MaterialID,
			QtyDipesan:  it.QtyDipesan,
			HargaSatuan: it.HargaSatuan,
		})
		totalNilai += int64(it.QtyDipesan) * it.HargaSatuan
	}

	tglPO := req.TglPO
	if tglPO.IsZero() {
		tglPO = time.Now()
	}

	po := &model.PurchaseOrder{
		BaseModel:  model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		ProyekID:   proyekID,
		SupplierID: req.SupplierID,
		NomorPO:    req.NomorPO,
		TglPO:      tglPO,
		TotalNilai: totalNilai,
		Status:     model.StatusPODraft,
		Items:      items,
	}
	if err := s.poRepo.Create(po); err != nil {
		return nil, err
	}
	return po, nil
}

// TerimaPO menandai PO sebagai diterima dan mengupdate stok masuk per item.
func (s *poService) TerimaPO(id, proyekID, perusahaanID string) (*model.PurchaseOrder, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	po, err := s.poRepo.FindByID(id, proyekID)
	if err != nil {
		return nil, errors.New("purchase order tidak ditemukan")
	}
	if po.Status == model.StatusPOBatal {
		return nil, errors.New("PO yang sudah dibatalkan tidak bisa diterima")
	}
	if po.Status == model.StatusPODiterima {
		return nil, errors.New("PO sudah diterima sebelumnya")
	}

	for i := range po.Items {
		item := &po.Items[i]
		item.QtyDiterima = item.QtyDipesan

		stok, err := s.stokRepo.GetOrCreate(proyekID, item.MaterialID, perusahaanID)
		if err != nil {
			return nil, err
		}
		stok.QtyMasuk += item.QtyDiterima
		stok.IsKritis = (stok.QtyMasuk - stok.QtyTerpakai) < stok.StokMinimum
		if err := s.stokRepo.Update(stok); err != nil {
			return nil, err
		}
		if err := s.poRepo.UpdateItem(item); err != nil {
			return nil, err
		}
	}

	po.Status = model.StatusPODiterima
	if err := s.poRepo.Update(po); err != nil {
		return nil, err
	}
	return po, nil
}

func (s *poService) DeletePO(id, proyekID, perusahaanID string) error {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return err
	}
	po, err := s.poRepo.FindByID(id, proyekID)
	if err != nil {
		return errors.New("purchase order tidak ditemukan")
	}
	if po.Status == model.StatusPODiterima {
		return errors.New("PO yang sudah diterima tidak bisa dihapus")
	}
	return s.poRepo.Delete(id, proyekID)
}

// ─── Stok ────────────────────────────────────────────────────────────────────

func (s *poService) ListStok(proyekID, perusahaanID string) ([]StokInfo, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	stoks, err := s.stokRepo.FindAllByProyek(proyekID)
	if err != nil {
		return nil, err
	}
	result := make([]StokInfo, len(stoks))
	for i := range stoks {
		result[i] = StokInfo{
			StokMaterial: &stoks[i],
			StokSisa:     stoks[i].QtyMasuk - stoks[i].QtyTerpakai,
		}
	}
	return result, nil
}

// PakaiMaterial mencatat penggunaan material dan memvalidasi ketersediaan stok.
func (s *poService) PakaiMaterial(proyekID, perusahaanID, userID string, req PakaiMaterialRequest) (*model.PenggunaanMaterial, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	if req.Qty <= 0 {
		return nil, errors.New("qty harus lebih dari 0")
	}
	if req.MaterialID == "" {
		return nil, errors.New("material wajib dipilih")
	}

	stok, err := s.stokRepo.GetOrCreate(proyekID, req.MaterialID, perusahaanID)
	if err != nil {
		return nil, err
	}
	stokSisa := stok.QtyMasuk - stok.QtyTerpakai
	if req.Qty > stokSisa {
		return nil, errors.New("stok tidak mencukupi")
	}

	tglPakai := req.TglPakai
	if tglPakai.IsZero() {
		tglPakai = time.Now()
	}

	p := &model.PenggunaanMaterial{
		BaseModel:    model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		ProyekID:     proyekID,
		MaterialID:   req.MaterialID,
		Qty:          req.Qty,
		Keterangan:   req.Keterangan,
		TglPakai:     tglPakai,
		DibuatOlehID: userID,
	}
	if err := s.stokRepo.CreatePenggunaan(p); err != nil {
		return nil, err
	}

	stok.QtyTerpakai += req.Qty
	stok.IsKritis = (stok.QtyMasuk - stok.QtyTerpakai) < stok.StokMinimum
	if err := s.stokRepo.Update(stok); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *poService) ListPenggunaan(proyekID, perusahaanID string) ([]model.PenggunaanMaterial, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	return s.stokRepo.ListPenggunaan(proyekID)
}
