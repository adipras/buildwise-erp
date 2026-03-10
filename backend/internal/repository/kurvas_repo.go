package repository

import (
	"time"

	"buildwise/internal/database"
	"buildwise/internal/model"
)

// KurvaSPoint merepresentasikan satu titik data pada grafik Kurva S.
type KurvaSPoint struct {
	Minggu          int     `json:"minggu"`
	TanggalMinggu   string  `json:"tanggal"`
	PlanKumulatif   float64 `json:"plan_kumulatif"`
	AktualKumulatif float64 `json:"aktual_kumulatif"`
}

type KurvaSRepository interface {
	GetKurvaS(proyekID string) ([]KurvaSPoint, error)
}

type KurvaSRepo struct{}

// GetKurvaS menghitung data Kurva S per minggu sejak proyek mulai
// hingga max(TglSelesai, hari ini).
func (r *KurvaSRepo) GetKurvaS(proyekID string) ([]KurvaSPoint, error) {
	var proyek model.Proyek
	if err := database.DB.Where("id = ?", proyekID).First(&proyek).Error; err != nil {
		return nil, err
	}

	var milestones []model.Milestone
	if err := database.DB.Where("proyek_id = ?", proyekID).Find(&milestones).Error; err != nil {
		return nil, err
	}

	var totalAnggaran int64
	for _, m := range milestones {
		totalAnggaran += m.Anggaran
	}

	// Tentukan batas akhir iterasi
	endDate := proyek.TglSelesai
	if now := time.Now(); now.After(endDate) {
		endDate = now
	}

	start := proyek.TglMulai

	bobot := func(anggaran int64) float64 {
		if totalAnggaran > 0 {
			return float64(anggaran) / float64(totalAnggaran)
		}
		if len(milestones) > 0 {
			return 1.0 / float64(len(milestones))
		}
		return 0
	}

	var points []KurvaSPoint
	minggu := 1

	for weekStart := start; !weekStart.After(endDate); weekStart = weekStart.AddDate(0, 0, 7) {
		weekEnd := weekStart.AddDate(0, 0, 7)

		var planSum, aktualSum float64
		for _, m := range milestones {
			w := bobot(m.Anggaran)

			// Plan kumulatif: interpolasi linear hingga akhir minggu ini
			var plannedAtWeek float64
			if weekEnd.Before(m.TglRencanaMulai) {
				plannedAtWeek = 0
			} else if !weekEnd.Before(m.TglRencanaSelesai) {
				plannedAtWeek = m.PlannedPersen
			} else {
				dur := m.TglRencanaSelesai.Sub(m.TglRencanaMulai)
				elapsed := weekEnd.Sub(m.TglRencanaMulai)
				if dur > 0 {
					plannedAtWeek = m.PlannedPersen * elapsed.Seconds() / dur.Seconds()
				}
			}
			planSum += plannedAtWeek * w

			// Aktual kumulatif: actual_persen milestone yang sudah seharusnya berjalan
			if !m.TglRencanaMulai.After(weekEnd) {
				aktualSum += m.ActualPersen * w
			}
		}

		points = append(points, KurvaSPoint{
			Minggu:          minggu,
			TanggalMinggu:   weekStart.Format("2006-01-02"),
			PlanKumulatif:   planSum,
			AktualKumulatif: aktualSum,
		})
		minggu++
	}

	// Minimal 1 titik
	if len(points) == 0 {
		points = append(points, KurvaSPoint{
			Minggu:          1,
			TanggalMinggu:   start.Format("2006-01-02"),
			PlanKumulatif:   0,
			AktualKumulatif: 0,
		})
	}

	return points, nil
}
