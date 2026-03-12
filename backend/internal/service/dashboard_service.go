package service

import (
	"time"

	"buildwise/internal/database"

	"gorm.io/gorm"
)

// ─── Response types ────────────────────────────────────────────────────────────

type DashProyekSummary struct {
	ID               string  `json:"id"`
	Nama             string  `json:"nama"`
	Status           string  `json:"status"`
	TglMulai         string  `json:"tgl_mulai"`
	TglSelesai       string  `json:"tgl_selesai"`
	NilaiKontrak     int64   `json:"nilai_kontrak"`
	TotalRAB         int64   `json:"total_rab"`
	TotalPengeluaran int64   `json:"total_pengeluaran"`
	PctProgress      float64 `json:"pct_progress"`
}

type AlertMilestone struct {
	ProyekID   string  `json:"proyek_id"`
	ProyekNama string  `json:"proyek_nama"`
	MilestoneID string `json:"milestone_id"`
	MilestoneNama string `json:"milestone_nama"`
	PlannedPersen float64 `json:"planned_persen"`
	ActualPersen  float64 `json:"actual_persen"`
	TglRencanaSelesai string `json:"tgl_rencana_selesai"`
}

type AlertStokKritis struct {
	ProyekID    string  `json:"proyek_id"`
	ProyekNama  string  `json:"proyek_nama"`
	MaterialID  string  `json:"material_id"`
	MaterialNama string `json:"material_nama"`
	StokSisa    float64 `json:"stok_sisa"`
	StokMinimum float64 `json:"stok_minimum"`
	Satuan      string  `json:"satuan"`
}

type OverviewResponse struct {
	TotalProyekAktif int            `json:"total_proyek_aktif"`
	TotalRAB         int64          `json:"total_rab"`
	TotalPengeluaran int64          `json:"total_pengeluaran"`
	Proyek           []DashProyekSummary `json:"proyek"`
	AlertMilestone   []AlertMilestone `json:"alert_milestone"`
	AlertStokKritis  []AlertStokKritis `json:"alert_stok_kritis"`
}

type ProyekDetailDashboard struct {
	ProyekID         string  `json:"proyek_id"`
	Nama             string  `json:"nama"`
	Status           string  `json:"status"`
	NilaiKontrak     int64   `json:"nilai_kontrak"`
	TotalRAB         int64   `json:"total_rab"`
	TotalPengeluaran int64   `json:"total_pengeluaran"`
	SisaAnggaran     int64   `json:"sisa_anggaran"`
	PctProgress      float64 `json:"pct_progress"`
	JumlahPekerjaAktif int   `json:"jumlah_pekerja_aktif"`
	StokKritis       []AlertStokKritis `json:"stok_kritis"`
	MilestoneTerlambat []AlertMilestone `json:"milestone_terlambat"`
	PengeluaranPerKategori []KategoriSummary `json:"pengeluaran_per_kategori"`
}

type KategoriSummary struct {
	Kategori string `json:"kategori"`
	Total    int64  `json:"total"`
}

// ─── Service ───────────────────────────────────────────────────────────────────

type DashboardService interface {
	GetOverview(perusahaanID string) (*OverviewResponse, error)
	GetProyekDashboard(perusahaanID, proyekID string) (*ProyekDetailDashboard, error)
}

type dashboardService struct{}

func NewDashboardService() DashboardService {
	return &dashboardService{}
}

func db() *gorm.DB {
	return database.DB
}

func (s *dashboardService) GetOverview(perusahaanID string) (*OverviewResponse, error) {
	type proyekRow struct {
		ID     string
		Nama   string
		Status string
		TglMulai   time.Time
		TglSelesai time.Time
		NilaiKontrak int64
	}
	var rows []proyekRow
	if err := db().Raw(`
		SELECT id, nama, status, tgl_mulai, tgl_selesai, nilai_kontrak
		FROM proyeks
		WHERE perusahaan_id = ? AND deleted_at IS NULL AND status IN ('aktif','terlambat')
		ORDER BY tgl_mulai
	`, perusahaanID).Scan(&rows).Error; err != nil {
		return nil, err
	}

	proyekIDs := make([]string, len(rows))
	for i, r := range rows {
		proyekIDs[i] = r.ID
	}

	// RAB per proyek
	type sumRow struct {
		ProyekID string
		Total    int64
	}
	var rabRows []sumRow
	if len(proyekIDs) > 0 {
		db().Raw(`SELECT proyek_id, COALESCE(SUM(total_anggaran),0) AS total FROM rab_items WHERE proyek_id IN ? AND deleted_at IS NULL GROUP BY proyek_id`, proyekIDs).Scan(&rabRows)
	}
	rabMap := map[string]int64{}
	for _, r := range rabRows {
		rabMap[r.ProyekID] = r.Total
	}

	// Pengeluaran per proyek
	var penRows []sumRow
	if len(proyekIDs) > 0 {
		db().Raw(`SELECT proyek_id, COALESCE(SUM(jumlah),0) AS total FROM pengeluarans WHERE proyek_id IN ? AND deleted_at IS NULL GROUP BY proyek_id`, proyekIDs).Scan(&penRows)
	}
	penMap := map[string]int64{}
	for _, r := range penRows {
		penMap[r.ProyekID] = r.Total
	}

	// Progress per proyek (weighted average milestone)
	type progressRow struct {
		ProyekID    string
		PctProgress float64
	}
	var progRows []progressRow
	if len(proyekIDs) > 0 {
		db().Raw(`
			SELECT proyek_id,
			       COALESCE(SUM(actual_persen * anggaran) / NULLIF(SUM(anggaran),0), 0) AS pct_progress
			FROM milestones
			WHERE proyek_id IN ? AND deleted_at IS NULL
			GROUP BY proyek_id
		`, proyekIDs).Scan(&progRows)
	}
	progMap := map[string]float64{}
	for _, r := range progRows {
		progMap[r.ProyekID] = r.PctProgress
	}

	summaries := make([]DashProyekSummary, 0, len(rows))
	var totalRAB, totalPen int64
	for _, r := range rows {
		rab := rabMap[r.ID]
		pen := penMap[r.ID]
		totalRAB += rab
		totalPen += pen
		summaries = append(summaries, DashProyekSummary{
			ID:               r.ID,
			Nama:             r.Nama,
			Status:           r.Status,
			TglMulai:         r.TglMulai.Format("2006-01-02"),
			TglSelesai:       r.TglSelesai.Format("2006-01-02"),
			NilaiKontrak:     r.NilaiKontrak,
			TotalRAB:         rab,
			TotalPengeluaran: pen,
			PctProgress:      progMap[r.ID],
		})
	}

	// Alert milestone terlambat
	type milestoneRow struct {
		ProyekID          string
		ProyekNama        string
		MilestoneID       string
		MilestoneNama     string
		PlannedPersen     float64
		ActualPersen      float64
		TglRencanaSelesai time.Time
	}
	var milRows []milestoneRow
	if len(proyekIDs) > 0 {
		db().Raw(`
			SELECT m.proyek_id, p.nama AS proyek_nama, m.id AS milestone_id, m.nama AS milestone_nama,
			       m.planned_persen, m.actual_persen, m.tgl_rencana_selesai
			FROM milestones m
			JOIN proyeks p ON m.proyek_id = p.id
			WHERE m.proyek_id IN ? AND m.deleted_at IS NULL AND m.status = 'terlambat'
			ORDER BY m.tgl_rencana_selesai
		`, proyekIDs).Scan(&milRows)
	}
	alertMil := make([]AlertMilestone, 0, len(milRows))
	for _, r := range milRows {
		alertMil = append(alertMil, AlertMilestone{
			ProyekID:          r.ProyekID,
			ProyekNama:        r.ProyekNama,
			MilestoneID:       r.MilestoneID,
			MilestoneNama:     r.MilestoneNama,
			PlannedPersen:     r.PlannedPersen,
			ActualPersen:      r.ActualPersen,
			TglRencanaSelesai: r.TglRencanaSelesai.Format("2006-01-02"),
		})
	}

	// Alert stok kritis
	type stokRow struct {
		ProyekID     string
		ProyekNama   string
		MaterialID   string
		MaterialNama string
		StokSisa     float64
		StokMinimum  float64
		Satuan       string
	}
	var stokRows []stokRow
	if len(proyekIDs) > 0 {
		db().Raw(`
			SELECT s.proyek_id, p.nama AS proyek_nama, s.material_id, m.nama AS material_nama,
			       (s.qty_masuk - s.qty_terpakai) AS stok_sisa, s.stok_minimum, m.satuan
			FROM stok_materials s
			JOIN proyeks p ON s.proyek_id = p.id
			JOIN materials m ON s.material_id = m.id
			WHERE s.proyek_id IN ? AND s.deleted_at IS NULL AND s.is_kritis = 1
		`, proyekIDs).Scan(&stokRows)
	}
	alertStok := make([]AlertStokKritis, 0, len(stokRows))
	for _, r := range stokRows {
		alertStok = append(alertStok, AlertStokKritis{
			ProyekID:    r.ProyekID,
			ProyekNama:  r.ProyekNama,
			MaterialID:  r.MaterialID,
			MaterialNama: r.MaterialNama,
			StokSisa:    r.StokSisa,
			StokMinimum: r.StokMinimum,
			Satuan:      r.Satuan,
		})
	}

	return &OverviewResponse{
		TotalProyekAktif: len(rows),
		TotalRAB:         totalRAB,
		TotalPengeluaran: totalPen,
		Proyek:           summaries,
		AlertMilestone:   alertMil,
		AlertStokKritis:  alertStok,
	}, nil
}

func (s *dashboardService) GetProyekDashboard(perusahaanID, proyekID string) (*ProyekDetailDashboard, error) {
	type proyekRow struct {
		ID           string
		Nama         string
		Status       string
		NilaiKontrak int64
	}
	var p proyekRow
	if err := db().Raw(`
		SELECT id, nama, status, nilai_kontrak FROM proyeks
		WHERE id = ? AND perusahaan_id = ? AND deleted_at IS NULL LIMIT 1
	`, proyekID, perusahaanID).Scan(&p).Error; err != nil {
		return nil, err
	}
	if p.ID == "" {
		return nil, gorm.ErrRecordNotFound
	}

	// RAB total
	var totalRAB int64
	db().Raw(`SELECT COALESCE(SUM(total_anggaran),0) FROM rab_items WHERE proyek_id = ? AND deleted_at IS NULL`, proyekID).Scan(&totalRAB)

	// Pengeluaran total
	var totalPen int64
	db().Raw(`SELECT COALESCE(SUM(jumlah),0) FROM pengeluarans WHERE proyek_id = ? AND deleted_at IS NULL`, proyekID).Scan(&totalPen)

	// Progress
	var pctProgress float64
	db().Raw(`
		SELECT COALESCE(SUM(actual_persen * anggaran) / NULLIF(SUM(anggaran),0), 0)
		FROM milestones WHERE proyek_id = ? AND deleted_at IS NULL
	`, proyekID).Scan(&pctProgress)

	// Pekerja aktif
	var jumlahPekerja int
	db().Raw(`SELECT COUNT(*) FROM penugasan_proyeks WHERE proyek_id = ? AND deleted_at IS NULL AND is_aktif = 1`, proyekID).Scan(&jumlahPekerja)

	// Stok kritis
	type stokRow struct {
		MaterialID   string
		MaterialNama string
		StokSisa     float64
		StokMinimum  float64
		Satuan       string
	}
	var stokRows []stokRow
	db().Raw(`
		SELECT s.material_id, m.nama AS material_nama,
		       (s.qty_masuk - s.qty_terpakai) AS stok_sisa, s.stok_minimum, m.satuan
		FROM stok_materials s
		JOIN materials m ON s.material_id = m.id
		WHERE s.proyek_id = ? AND s.deleted_at IS NULL AND s.is_kritis = 1
	`, proyekID).Scan(&stokRows)
	stokKritis := make([]AlertStokKritis, 0, len(stokRows))
	for _, r := range stokRows {
		stokKritis = append(stokKritis, AlertStokKritis{
			ProyekID:    proyekID,
			ProyekNama:  p.Nama,
			MaterialID:  r.MaterialID,
			MaterialNama: r.MaterialNama,
			StokSisa:    r.StokSisa,
			StokMinimum: r.StokMinimum,
			Satuan:      r.Satuan,
		})
	}

	// Milestone terlambat
	type milRow struct {
		MilestoneID       string
		MilestoneNama     string
		PlannedPersen     float64
		ActualPersen      float64
		TglRencanaSelesai time.Time
	}
	var milRows []milRow
	db().Raw(`
		SELECT id AS milestone_id, nama AS milestone_nama, planned_persen, actual_persen, tgl_rencana_selesai
		FROM milestones WHERE proyek_id = ? AND deleted_at IS NULL AND status = 'terlambat'
		ORDER BY tgl_rencana_selesai
	`, proyekID).Scan(&milRows)
	milTerlambat := make([]AlertMilestone, 0, len(milRows))
	for _, r := range milRows {
		milTerlambat = append(milTerlambat, AlertMilestone{
			ProyekID:          proyekID,
			ProyekNama:        p.Nama,
			MilestoneID:       r.MilestoneID,
			MilestoneNama:     r.MilestoneNama,
			PlannedPersen:     r.PlannedPersen,
			ActualPersen:      r.ActualPersen,
			TglRencanaSelesai: r.TglRencanaSelesai.Format("2006-01-02"),
		})
	}

	// Pengeluaran per kategori
	type katRow struct {
		Kategori string
		Total    int64
	}
	var katRows []katRow
	db().Raw(`
		SELECT kategori, COALESCE(SUM(jumlah),0) AS total
		FROM pengeluarans WHERE proyek_id = ? AND deleted_at IS NULL
		GROUP BY kategori ORDER BY total DESC
	`, proyekID).Scan(&katRows)
	penKategori := make([]KategoriSummary, 0, len(katRows))
	for _, r := range katRows {
		penKategori = append(penKategori, KategoriSummary{Kategori: r.Kategori, Total: r.Total})
	}

	return &ProyekDetailDashboard{
		ProyekID:               proyekID,
		Nama:                   p.Nama,
		Status:                 p.Status,
		NilaiKontrak:           p.NilaiKontrak,
		TotalRAB:               totalRAB,
		TotalPengeluaran:       totalPen,
		SisaAnggaran:           totalRAB - totalPen,
		PctProgress:            pctProgress,
		JumlahPekerjaAktif:     jumlahPekerja,
		StokKritis:             stokKritis,
		MilestoneTerlambat:     milTerlambat,
		PengeluaranPerKategori: penKategori,
	}, nil
}
