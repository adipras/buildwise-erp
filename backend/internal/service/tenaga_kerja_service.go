package service

import (
	"errors"
	"strings"
	"time"

	"buildwise/internal/model"
	"buildwise/internal/repository"

	"github.com/google/uuid"
)

// ─── Request Types ────────────────────────────────────────────────────────────

type CreatePekerjaRequest struct {
	Nama       string           `json:"nama"`
	Telepon    string           `json:"telepon"`
	Tipe       model.TipePekerja `json:"tipe"`
	UpahHarian int64            `json:"upah_harian"`
}

type UpdatePekerjaRequest struct {
	Nama       string           `json:"nama"`
	Telepon    string           `json:"telepon"`
	Tipe       model.TipePekerja `json:"tipe"`
	UpahHarian int64            `json:"upah_harian"`
	IsAktif    *bool            `json:"is_aktif"`
}

type AbsensiItemInput struct {
	PekerjaID string              `json:"pekerja_id"`
	Status    model.StatusAbsensi `json:"status"`
	JamKerja  float64             `json:"jam_kerja"`
}

type InputAbsensiRequest struct {
	Tanggal string             `json:"tanggal"` // format: "2006-01-02"
	Absensi []AbsensiItemInput `json:"absensi"`
}

type ApproveBayarRequest struct {
	PeriodeMulai   string   `json:"periode_mulai"`   // "2006-01-02"
	PeriodeSelesai string   `json:"periode_selesai"` // "2006-01-02"
	PekerjaIDs     []string `json:"pekerja_ids"`     // kosong = semua
}

// ─── Response Types ───────────────────────────────────────────────────────────

type RekapUpahItem struct {
	Pekerja     *model.Pekerja  `json:"pekerja"`
	Absensi     []model.Absensi `json:"absensi"`
	TotalUpah   int64           `json:"total_upah"`
	JmlHadir    int             `json:"jml_hadir"`
	JmlSetengah int             `json:"jml_setengah"`
	JmlLembur   int             `json:"jml_lembur"`
	JmlAbsen    int             `json:"jml_absen"`
}

type RekapUpahResponse struct {
	Items      []RekapUpahItem `json:"items"`
	TotalSemua int64           `json:"total_semua"`
}

// ─── Service Interface ────────────────────────────────────────────────────────

type TenagaKerjaService interface {
	// Master Pekerja
	ListPekerja(perusahaanID string) ([]model.Pekerja, error)
	CreatePekerja(perusahaanID string, req CreatePekerjaRequest) (*model.Pekerja, error)
	UpdatePekerja(id, perusahaanID string, req UpdatePekerjaRequest) (*model.Pekerja, error)
	DeletePekerja(id, perusahaanID string) error

	// Penugasan ke proyek
	ListPekerjaProyek(proyekID, perusahaanID string) ([]model.PenugasanProyek, error)
	AssignPekerja(proyekID, perusahaanID, pekerjaID string) (*model.PenugasanProyek, error)
	UnassignPekerja(proyekID, perusahaanID, pekerjaID string) error

	// Absensi
	GetAbsensi(proyekID, perusahaanID, tanggal string) ([]model.Absensi, error)
	InputAbsensiMassal(proyekID, perusahaanID, dicatatOlehID string, req InputAbsensiRequest) ([]model.Absensi, error)

	// Rekap & Pembayaran
	GetRekapUpah(proyekID, perusahaanID, mulai, selesai string) (*RekapUpahResponse, error)
	ApproveBayar(proyekID, perusahaanID, approvedOlehID string, req ApproveBayarRequest) ([]model.PembayaranUpah, error)
	ListPembayaranUpah(proyekID, perusahaanID string) ([]model.PembayaranUpah, error)
}

type tenagaKerjaService struct {
	pekerjaRepo   *repository.PekerjaRepo
	penugasanRepo *repository.PenugasanRepo
	absensiRepo   *repository.AbsensiRepo
	upahRepo      *repository.UpahRepo
	pengeluaranRepo *repository.PengeluaranRepo
	proyekRepo    *repository.ProyekRepo
}

func NewTenagaKerjaService() TenagaKerjaService {
	return &tenagaKerjaService{
		pekerjaRepo:     &repository.PekerjaRepo{},
		penugasanRepo:   &repository.PenugasanRepo{},
		absensiRepo:     &repository.AbsensiRepo{},
		upahRepo:        &repository.UpahRepo{},
		pengeluaranRepo: &repository.PengeluaranRepo{},
		proyekRepo:      &repository.ProyekRepo{},
	}
}

func (s *tenagaKerjaService) verifyProyek(proyekID, perusahaanID string) error {
	if _, err := s.proyekRepo.FindByID(proyekID, perusahaanID); err != nil {
		return errors.New("proyek tidak ditemukan")
	}
	return nil
}

// hitungUpah menghitung upah berdasarkan status kehadiran.
func hitungUpah(status model.StatusAbsensi, upahHarian int64) int64 {
	switch status {
	case model.StatusHadir:
		return upahHarian
	case model.StatusSetengahHari:
		return upahHarian / 2
	case model.StatusLembur:
		return upahHarian * 3 / 2 // 1.5×
	default: // tidak_hadir
		return 0
	}
}

// ─── Master Pekerja ───────────────────────────────────────────────────────────

func (s *tenagaKerjaService) ListPekerja(perusahaanID string) ([]model.Pekerja, error) {
	return s.pekerjaRepo.FindAll(perusahaanID)
}

func (s *tenagaKerjaService) CreatePekerja(perusahaanID string, req CreatePekerjaRequest) (*model.Pekerja, error) {
	if strings.TrimSpace(req.Nama) == "" {
		return nil, errors.New("nama pekerja wajib diisi")
	}
	if req.UpahHarian <= 0 {
		return nil, errors.New("upah harian harus lebih dari 0")
	}
	tipe := req.Tipe
	if tipe == "" {
		tipe = model.TipeTukang
	}
	p := &model.Pekerja{
		BaseModel:  model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		Nama:       req.Nama,
		Telepon:    req.Telepon,
		Tipe:       tipe,
		UpahHarian: req.UpahHarian,
		IsAktif:    true,
	}
	if err := s.pekerjaRepo.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *tenagaKerjaService) UpdatePekerja(id, perusahaanID string, req UpdatePekerjaRequest) (*model.Pekerja, error) {
	p, err := s.pekerjaRepo.FindByID(id, perusahaanID)
	if err != nil {
		return nil, errors.New("pekerja tidak ditemukan")
	}
	if strings.TrimSpace(req.Nama) != "" {
		p.Nama = req.Nama
	}
	p.Telepon = req.Telepon
	if req.Tipe != "" {
		p.Tipe = req.Tipe
	}
	if req.UpahHarian > 0 {
		p.UpahHarian = req.UpahHarian
	}
	if req.IsAktif != nil {
		p.IsAktif = *req.IsAktif
	}
	if err := s.pekerjaRepo.Update(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *tenagaKerjaService) DeletePekerja(id, perusahaanID string) error {
	if _, err := s.pekerjaRepo.FindByID(id, perusahaanID); err != nil {
		return errors.New("pekerja tidak ditemukan")
	}
	return s.pekerjaRepo.Delete(id, perusahaanID)
}

// ─── Penugasan ────────────────────────────────────────────────────────────────

func (s *tenagaKerjaService) ListPekerjaProyek(proyekID, perusahaanID string) ([]model.PenugasanProyek, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	return s.penugasanRepo.FindByProyek(proyekID)
}

func (s *tenagaKerjaService) AssignPekerja(proyekID, perusahaanID, pekerjaID string) (*model.PenugasanProyek, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	if _, err := s.pekerjaRepo.FindByID(pekerjaID, perusahaanID); err != nil {
		return nil, errors.New("pekerja tidak ditemukan")
	}
	// Cek apakah sudah ada penugasan aktif
	if existing, err := s.penugasanRepo.FindByPekerjaAndProyek(pekerjaID, proyekID); err == nil && existing.IsAktif {
		return existing, nil // idempoten
	}
	pn := &model.PenugasanProyek{
		BaseModel: model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
		ProyekID:  proyekID,
		PekerjaID: pekerjaID,
		TglMulai:  time.Now(),
		IsAktif:   true,
	}
	if err := s.penugasanRepo.Create(pn); err != nil {
		return nil, err
	}
	return pn, nil
}

func (s *tenagaKerjaService) UnassignPekerja(proyekID, perusahaanID, pekerjaID string) error {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return err
	}
	return s.penugasanRepo.Deactivate(pekerjaID, proyekID)
}

// ─── Absensi ──────────────────────────────────────────────────────────────────

func (s *tenagaKerjaService) GetAbsensi(proyekID, perusahaanID, tanggalStr string) ([]model.Absensi, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	tgl, err := time.Parse("2006-01-02", tanggalStr)
	if err != nil {
		return nil, errors.New("format tanggal tidak valid (YYYY-MM-DD)")
	}
	return s.absensiRepo.FindByTanggal(proyekID, tgl)
}

// InputAbsensiMassal mencatat/memperbarui absensi untuk banyak pekerja sekaligus.
// Idempoten: jika absensi sudah ada untuk pekerja+tanggal, nilainya diupdate.
func (s *tenagaKerjaService) InputAbsensiMassal(proyekID, perusahaanID, dicatatOlehID string, req InputAbsensiRequest) ([]model.Absensi, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	if len(req.Absensi) == 0 {
		return nil, errors.New("data absensi tidak boleh kosong")
	}
	tgl, err := time.Parse("2006-01-02", req.Tanggal)
	if err != nil {
		return nil, errors.New("format tanggal tidak valid (YYYY-MM-DD)")
	}

	result := make([]model.Absensi, 0, len(req.Absensi))
	for _, item := range req.Absensi {
		pekerja, err := s.pekerjaRepo.FindByID(item.PekerjaID, perusahaanID)
		if err != nil {
			return nil, errors.New("pekerja tidak ditemukan: " + item.PekerjaID)
		}
		jamKerja := item.JamKerja
		if jamKerja <= 0 {
			jamKerja = 8
		}
		upahDibayar := hitungUpah(item.Status, pekerja.UpahHarian)

		existing, findErr := s.absensiRepo.FindOne(proyekID, item.PekerjaID, tgl)
		if findErr == nil {
			// Update existing
			existing.Status = item.Status
			existing.JamKerja = jamKerja
			existing.UpahHarian = pekerja.UpahHarian
			existing.UpahDibayar = upahDibayar
			existing.DicatatOlehID = dicatatOlehID
			if err := s.absensiRepo.Update(existing); err != nil {
				return nil, err
			}
			result = append(result, *existing)
		} else {
			// Create new
			a := &model.Absensi{
				BaseModel:     model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
				ProyekID:      proyekID,
				PekerjaID:     item.PekerjaID,
				Tanggal:       tgl,
				Status:        item.Status,
				JamKerja:      jamKerja,
				UpahHarian:    pekerja.UpahHarian,
				UpahDibayar:   upahDibayar,
				DicatatOlehID: dicatatOlehID,
			}
			if err := s.absensiRepo.Create(a); err != nil {
				return nil, err
			}
			result = append(result, *a)
		}
	}
	return result, nil
}

// ─── Rekap & Pembayaran ───────────────────────────────────────────────────────

func (s *tenagaKerjaService) GetRekapUpah(proyekID, perusahaanID, mulaiStr, selesaiStr string) (*RekapUpahResponse, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	mulai, err := time.Parse("2006-01-02", mulaiStr)
	if err != nil {
		return nil, errors.New("format periode_mulai tidak valid (YYYY-MM-DD)")
	}
	selesai, err := time.Parse("2006-01-02", selesaiStr)
	if err != nil {
		return nil, errors.New("format periode_selesai tidak valid (YYYY-MM-DD)")
	}

	absensiList, err := s.absensiRepo.FindByPeriode(proyekID, mulai, selesai)
	if err != nil {
		return nil, err
	}

	// Group absensi by pekerja_id
	type grupData struct {
		pekerja *model.Pekerja
		absensi []model.Absensi
	}
	grupMap := make(map[string]*grupData)
	pekerjaOrder := []string{}

	for i := range absensiList {
		a := &absensiList[i]
		if _, ok := grupMap[a.PekerjaID]; !ok {
			grupMap[a.PekerjaID] = &grupData{pekerja: a.Pekerja, absensi: []model.Absensi{}}
			pekerjaOrder = append(pekerjaOrder, a.PekerjaID)
		}
		grupMap[a.PekerjaID].absensi = append(grupMap[a.PekerjaID].absensi, *a)
	}

	items := make([]RekapUpahItem, 0, len(grupMap))
	var totalSemua int64

	for _, pid := range pekerjaOrder {
		g := grupMap[pid]
		var totalUpah int64
		var hadir, setengah, lembur, absen int
		for _, a := range g.absensi {
			totalUpah += a.UpahDibayar
			switch a.Status {
			case model.StatusHadir:
				hadir++
			case model.StatusSetengahHari:
				setengah++
			case model.StatusLembur:
				lembur++
			case model.StatusTidakHadir:
				absen++
			}
		}
		totalSemua += totalUpah
		items = append(items, RekapUpahItem{
			Pekerja:     g.pekerja,
			Absensi:     g.absensi,
			TotalUpah:   totalUpah,
			JmlHadir:    hadir,
			JmlSetengah: setengah,
			JmlLembur:   lembur,
			JmlAbsen:    absen,
		})
	}

	return &RekapUpahResponse{Items: items, TotalSemua: totalSemua}, nil
}

// ApproveBayar menyetujui dan membayar upah untuk periode tertentu.
// Otomatis membuat record Pengeluaran dengan kategori "Upah".
func (s *tenagaKerjaService) ApproveBayar(proyekID, perusahaanID, approvedOlehID string, req ApproveBayarRequest) ([]model.PembayaranUpah, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	mulai, err := time.Parse("2006-01-02", req.PeriodeMulai)
	if err != nil {
		return nil, errors.New("format periode_mulai tidak valid")
	}
	selesai, err := time.Parse("2006-01-02", req.PeriodeSelesai)
	if err != nil {
		return nil, errors.New("format periode_selesai tidak valid")
	}

	absensiList, err := s.absensiRepo.FindByPeriode(proyekID, mulai, selesai)
	if err != nil {
		return nil, err
	}

	// Filter per pekerja jika ada filter
	filterSet := make(map[string]bool)
	for _, pid := range req.PekerjaIDs {
		filterSet[pid] = true
	}

	// Sum per pekerja
	upahPerPekerja := make(map[string]int64)
	pekerjaData := make(map[string]*model.Pekerja)
	for i := range absensiList {
		a := &absensiList[i]
		if len(filterSet) > 0 && !filterSet[a.PekerjaID] {
			continue
		}
		upahPerPekerja[a.PekerjaID] += a.UpahDibayar
		if pekerjaData[a.PekerjaID] == nil {
			pekerjaData[a.PekerjaID] = a.Pekerja
		}
	}

	if len(upahPerPekerja) == 0 {
		return nil, errors.New("tidak ada data absensi untuk periode dan pekerja yang dipilih")
	}

	now := time.Now()
	result := make([]model.PembayaranUpah, 0, len(upahPerPekerja))

	for pekerjaID, totalUpah := range upahPerPekerja {
		if totalUpah == 0 {
			continue
		}
		pekerja := pekerjaData[pekerjaID]

		// Buat Pengeluaran otomatis
		deskripsi := "Upah " + req.PeriodeMulai + " s/d " + req.PeriodeSelesai
		if pekerja != nil {
			deskripsi = "Upah " + pekerja.Nama + " (" + req.PeriodeMulai + " s/d " + req.PeriodeSelesai + ")"
		}
		pel := &model.Pengeluaran{
			BaseModel:    model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
			ProyekID:     proyekID,
			Kategori:     "Upah",
			Deskripsi:    deskripsi,
			Jumlah:       totalUpah,
			TglTransaksi: now,
			DibuatOlehID: approvedOlehID,
		}
		if err := s.pengeluaranRepo.Create(pel); err != nil {
			return nil, err
		}

		// Buat PembayaranUpah
		pelID := pel.ID
		upah := &model.PembayaranUpah{
			BaseModel:       model.BaseModel{ID: uuid.New().String(), PerusahaanID: perusahaanID},
			ProyekID:        proyekID,
			PekerjaID:       pekerjaID,
			PeriodeMulai:    mulai,
			PeriodeSelesai:  selesai,
			TotalUpah:       totalUpah,
			IsApproved:      true,
			ApprovedOlehID:  &approvedOlehID,
			TglApproved:     &now,
			IsBayar:         true,
			TglBayar:        &now,
			PengeluaranID:   &pelID,
		}
		if err := s.upahRepo.Create(upah); err != nil {
			return nil, err
		}
		upah.Pekerja = pekerja
		result = append(result, *upah)
	}

	return result, nil
}

func (s *tenagaKerjaService) ListPembayaranUpah(proyekID, perusahaanID string) ([]model.PembayaranUpah, error) {
	if err := s.verifyProyek(proyekID, perusahaanID); err != nil {
		return nil, err
	}
	return s.upahRepo.FindByProyek(proyekID)
}
