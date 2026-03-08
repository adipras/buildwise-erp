package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv          string
	Port            string
	DBDSN           string
	RedisAddr       string
	JWTSecret       string
	JWTExpiresHours int
	FonnteToken     string
	R2AccountID     string
	R2AccessKey     string
	R2SecretKey     string
	R2Bucket        string
	R2PublicURL     string
	SentryDSN       string
}

var App Config

func Load() {
	// Muat .env jika ada (diabaikan di production)
	_ = godotenv.Load()

	hours, err := strconv.Atoi(getEnv("JWT_EXPIRES_HOURS", "24"))
	if err != nil {
		hours = 24
	}

	App = Config{
		AppEnv:          getEnv("APP_ENV", "development"),
		Port:            getEnv("PORT", "8080"),
		DBDSN:           mustEnv("DB_DSN"),
		RedisAddr:       getEnv("REDIS_ADDR", "localhost:6379"),
		JWTSecret:       mustEnv("JWT_SECRET"),
		JWTExpiresHours: hours,
		FonnteToken:     getEnv("FONNTE_TOKEN", ""),
		R2AccountID:     getEnv("R2_ACCOUNT_ID", ""),
		R2AccessKey:     getEnv("R2_ACCESS_KEY", ""),
		R2SecretKey:     getEnv("R2_SECRET_KEY", ""),
		R2Bucket:        getEnv("R2_BUCKET", "buildwise"),
		R2PublicURL:     getEnv("R2_PUBLIC_URL", ""),
		SentryDSN:       getEnv("SENTRY_DSN", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("variabel environment wajib tidak ditemukan: %s", key)
	}
	return v
}
