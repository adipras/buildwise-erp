# ─────────────────────────────────────────────────────────────────────────────
# BuildWise ERP — Makefile
# ─────────────────────────────────────────────────────────────────────────────

.DEFAULT_GOAL := help

# Warna output
GREEN  := \033[0;32m
YELLOW := \033[1;33m
CYAN   := \033[0;36m
RESET  := \033[0m

# ─── Help ─────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Tampilkan daftar perintah
	@echo ""
	@echo "  $(CYAN)BuildWise ERP$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

# ─── Docker (seluruh stack) ───────────────────────────────────────────────────

.PHONY: up
up: ## Jalankan semua container (dev)
	docker compose up -d
	@echo "$(GREEN)✔ Stack berjalan$(RESET)"
	@echo "  API      → http://localhost:8090"
	@echo "  Frontend → http://localhost:3010"
	@echo "  Adminer  → http://localhost:8081"

.PHONY: down
down: ## Hentikan semua container
	docker compose down

.PHONY: restart
restart: ## Restart semua container
	docker compose restart

.PHONY: rebuild
rebuild: ## Rebuild image lalu jalankan ulang
	docker compose up -d --build

.PHONY: logs
logs: ## Tampilkan log semua container (follow)
	docker compose logs -f

.PHONY: logs-api
logs-api: ## Tampilkan log container API (follow)
	docker compose logs -f api

.PHONY: logs-fe
logs-fe: ## Tampilkan log container frontend (follow)
	docker compose logs -f frontend

.PHONY: ps
ps: ## Status semua container
	docker compose ps

# ─── Database ─────────────────────────────────────────────────────────────────

.PHONY: seed
seed: ## Jalankan seed data (perusahaan + 4 user)
	docker compose exec api go run ./cmd/seed/main.go
	@echo "$(GREEN)✔ Seed selesai$(RESET)"

.PHONY: db-shell
db-shell: ## Masuk ke MySQL shell
	docker compose exec db mysql -u buildwise -pbuildwise buildwise_dev

.PHONY: db-reset
db-reset: ## ⚠ Hapus volume DB dan mulai ulang (data hilang!)
	@echo "$(YELLOW)⚠ Semua data DB akan dihapus. Lanjutkan? [y/N]$(RESET)" && read ans && [ $${ans:-N} = y ]
	docker compose down -v
	docker compose up -d
	@echo "$(GREEN)✔ DB direset$(RESET)"

# ─── Backend ──────────────────────────────────────────────────────────────────

.PHONY: build-backend
build-backend: ## Build binary backend (lokal, tanpa Docker)
	cd backend && go build -o ./tmp/main ./cmd/main
	@echo "$(GREEN)✔ Backend build selesai → backend/tmp/main$(RESET)"

.PHONY: test-backend
test-backend: ## Jalankan unit test backend
	cd backend && go test ./... -v

.PHONY: lint-backend
lint-backend: ## Lint backend (go vet)
	cd backend && go vet ./...

.PHONY: tidy
tidy: ## go mod tidy
	cd backend && go mod tidy

# ─── Frontend ─────────────────────────────────────────────────────────────────

.PHONY: install-fe
install-fe: ## Install npm dependencies frontend
	cd frontend && npm install

.PHONY: build-fe
build-fe: ## Build frontend production (dist/)
	cd frontend && npm run build
	@echo "$(GREEN)✔ Frontend build selesai → frontend/dist/$(RESET)"

.PHONY: lint-fe
lint-fe: ## Lint frontend (TypeScript check)
	cd frontend && npx tsc --noEmit

# ─── Shortcut umum ────────────────────────────────────────────────────────────

.PHONY: dev
dev: up ## Alias: jalankan stack dev (sama dengan 'up')

.PHONY: stop
stop: down ## Alias: hentikan stack (sama dengan 'down')

.PHONY: health
health: ## Cek health endpoint API
	@curl -sf http://localhost:8090/health | python3 -m json.tool || echo "$(YELLOW)API belum siap$(RESET)"
