package service

import (
	"errors"
)

// ─── Response types ────────────────────────────────────────────────────────────

type RabVsRealisasiItem struct {
	RabItemID     string  `json:"rab_item_id"`
	Kode          string  `json:"kode"`
	Nama          string  `json:"nama"`
	Volume        float64 `json:"volume"`
	Satuan        string  `json:"satuan"`
	HargaSatuan   int64   `json:"harga_satuan"`
	TotalAnggaran int64   `json:"total_anggaran"`
	TotalRealisasi int64  `json:"total_realisasi"`
	Selisih       int64   `json:"selisih"`
	PctTerpakai   float64 `json:"pct_terpakai"`
}

type PengeluaranKategori struct {
	Kategori string `json:"kategori"`
	Total    int64  `json:"total"`
}

type PengeluaranBulanan struct {
	Bulan string `json:"bulan"` // format "2006-01"
	Total int64  `json:"total"`
}

type LaporanKeuangan struct {
	ProyekID         string               `json:"proyek_id"`
	NamaProyek       string               `json:"nama_proyek"`
	NilaiKontrak     int64                `json:"nilai_kontrak"`
	TotalRAB         int64                `json:"total_rab"`
	TotalPengeluaran int64                `json:"total_pengeluaran"`
	SisaAnggaran     int64                `json:"sisa_anggaran"`
	PctTerpakai      float64              `json:"pct_terpakai"`
	Items            []RabVsRealisasiItem `json:"items"`
	PerKategori      []PengeluaranKategori `json:"per_kategori"`
	PerBulan         []PengeluaranBulanan `json:"per_bulan"`
}

// ─── Service ───────────────────────────────────────────────────────────────────

type LaporanService interface {
	GetLaporanKeuangan(perusahaanID, proyekID string) (*LaporanKeuangan, error)
}

type laporanService struct{}

func NewLaporanService() LaporanService {
	return &laporanService{}
}

var ErrNotFound = errors.New("data tidak ditemukan")

func (s *laporanService) GetLaporanKeuangan(perusahaanID, proyekID string) (*LaporanKeuangan, error) {
	d := db()

	// Validasi proyek milik perusahaan
	type proyekRow struct {
		ID           string
		Nama         string
		NilaiKontrak int64
	}
	var p proyekRow
	if err := d.Raw(`
		SELECT id, nama, nilai_kontrak FROM proyeks
		WHERE id = ? AND perusahaan_id = ? AND deleted_at IS NULL LIMIT 1
	`, proyekID, perusahaanID).Scan(&p).Error; err != nil {
		return nil, err
	}
	if p.ID == "" {
		return nil, ErrNotFound
	}

	// RAB items
	type rabRow struct {
		ID            string
		Kode          string
		Nama          string
		Volume        float64
		Satuan        string
		HargaSatuan   int64
		TotalAnggaran int64
	}
	var rabRows []rabRow
	d.Raw(`
		SELECT id, kode, nama, volume, satuan, harga_satuan, total_anggaran
		FROM rab_items WHERE proyek_id = ? AND deleted_at IS NULL ORDER BY kode
	`, proyekID).Scan(&rabRows)

	// Realisasi per rab_item
	type realisasiRow struct {
		RabItemID string
		Total     int64
	}
	var realisasiRows []realisasiRow
	d.Raw(`
		SELECT rab_item_id, COALESCE(SUM(jumlah),0) AS total
		FROM pengeluarans WHERE proyek_id = ? AND deleted_at IS NULL AND rab_item_id IS NOT NULL
		GROUP BY rab_item_id
	`, proyekID).Scan(&realisasiRows)
	realisasiMap := map[string]int64{}
	for _, r := range realisasiRows {
		realisasiMap[r.RabItemID] = r.Total
	}

	// Build items
	var totalRAB, totalPen int64
	items := make([]RabVsRealisasiItem, 0, len(rabRows))
	for _, r := range rabRows {
		realisasi := realisasiMap[r.ID]
		totalRAB += r.TotalAnggaran
		totalPen += realisasi
		var pct float64
		if r.TotalAnggaran > 0 {
			pct = float64(realisasi) / float64(r.TotalAnggaran) * 100
		}
		items = append(items, RabVsRealisasiItem{
			RabItemID:     r.ID,
			Kode:          r.Kode,
			Nama:          r.Nama,
			Volume:        r.Volume,
			Satuan:        r.Satuan,
			HargaSatuan:   r.HargaSatuan,
			TotalAnggaran: r.TotalAnggaran,
			TotalRealisasi: realisasi,
			Selisih:       r.TotalAnggaran - realisasi,
			PctTerpakai:   pct,
		})
	}

	// Pengeluaran yang tidak terikat RAB item (tanpa rab_item_id)
	var totalPenNonRAB int64
	d.Raw(`
		SELECT COALESCE(SUM(jumlah),0) FROM pengeluarans
		WHERE proyek_id = ? AND deleted_at IS NULL AND rab_item_id IS NULL
	`, proyekID).Scan(&totalPenNonRAB)
	totalPen += totalPenNonRAB

	// Per kategori
	type katRow struct {
		Kategori string
		Total    int64
	}
	var katRows []katRow
	d.Raw(`
		SELECT kategori, COALESCE(SUM(jumlah),0) AS total
		FROM pengeluarans WHERE proyek_id = ? AND deleted_at IS NULL
		GROUP BY kategori ORDER BY total DESC
	`, proyekID).Scan(&katRows)
	perKategori := make([]PengeluaranKategori, 0, len(katRows))
	for _, r := range katRows {
		perKategori = append(perKategori, PengeluaranKategori{Kategori: r.Kategori, Total: r.Total})
	}

	// Per bulan
	type bulanRow struct {
		Bulan string
		Total int64
	}
	var bulanRows []bulanRow
	d.Raw(`
		SELECT DATE_FORMAT(tgl_transaksi, '%Y-%m') AS bulan, COALESCE(SUM(jumlah),0) AS total
		FROM pengeluarans WHERE proyek_id = ? AND deleted_at IS NULL
		GROUP BY bulan ORDER BY bulan
	`, proyekID).Scan(&bulanRows)
	perBulan := make([]PengeluaranBulanan, 0, len(bulanRows))
	for _, r := range bulanRows {
		perBulan = append(perBulan, PengeluaranBulanan{Bulan: r.Bulan, Total: r.Total})
	}

	var pctTerpakai float64
	if totalRAB > 0 {
		pctTerpakai = float64(totalPen) / float64(totalRAB) * 100
	}

	return &LaporanKeuangan{
		ProyekID:         proyekID,
		NamaProyek:       p.Nama,
		NilaiKontrak:     p.NilaiKontrak,
		TotalRAB:         totalRAB,
		TotalPengeluaran: totalPen,
		SisaAnggaran:     totalRAB - totalPen,
		PctTerpakai:      pctTerpakai,
		Items:            items,
		PerKategori:      perKategori,
		PerBulan:         perBulan,
	}, nil
}
