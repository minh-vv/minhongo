#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Minhongo — Deploy Script
# ─────────────────────────────────────────────────────────────────────────────
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh              # build & deploy
#   ./deploy.sh --no-build   # deploy without rebuild (rollback to existing images)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Pre-flight checks ────────────────────────────────────────────────────────
info "Running pre-flight checks..."

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  error "Docker is not running. Start Docker first."
  exit 1
fi
success "Docker is running"

# Check .env exists
if [ ! -f .env ]; then
  error ".env file not found. Copy from .env.example:"
  echo "  cp .env.example .env"
  exit 1
fi
success ".env file exists"

# Check required env vars
source .env
REQUIRED_VARS=("POSTGRES_PASSWORD" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    error "Required variable $var is not set in .env"
    exit 1
  fi
done
success "Required environment variables are set"

# Warn about weak secrets
if [ "${JWT_SECRET}" = "replace_with_a_long_random_secret" ] || [ "${JWT_SECRET}" = "your-super-secret-jwt-key-change-in-production" ]; then
  warn "JWT_SECRET is still the default value. Generate a proper secret:"
  echo "  node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  if [ "${NON_INTERACTIVE:-false}" = "true" ]; then
    warn "Non-interactive mode active. Continuing with default/weak JWT_SECRET."
  else
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

if [ "${POSTGRES_PASSWORD}" = "changeme_strong_password" ] || [ "${POSTGRES_PASSWORD}" = "123456" ]; then
  warn "POSTGRES_PASSWORD is weak. Use a strong password for production!"
  if [ "${NON_INTERACTIVE:-false}" = "true" ]; then
    warn "Non-interactive mode active. Continuing with default/weak POSTGRES_PASSWORD."
  else
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

# ── Deploy ────────────────────────────────────────────────────────────────────
echo ""
info "═══════════════════════════════════════════════════════════════"
info "  Deploying Minhongo..."
info "═══════════════════════════════════════════════════════════════"
echo ""

BUILD_FLAG="--build"
if [ "${1:-}" = "--no-build" ]; then
  BUILD_FLAG=""
  info "Skipping build (using existing images)"
fi

# Pull latest base images
if [ -n "$BUILD_FLAG" ]; then
  info "Pulling latest base images..."
  docker compose pull db 2>/dev/null || true
fi

# Build and start services
info "Starting services..."
docker compose up ${BUILD_FLAG} -d

# ── Post-deploy health check ─────────────────────────────────────────────────
echo ""
info "Waiting for services to become healthy..."

BACKEND_PORT="${BACKEND_PORT:-3000}"

# Wait for backend health
MAX_RETRIES=30
RETRY_INTERVAL=5
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
    success "Backend is healthy (attempt $i/$MAX_RETRIES)"
    break
  fi
  if [ $i -eq $MAX_RETRIES ]; then
    error "Backend health check failed after ${MAX_RETRIES} attempts"
    echo ""
    warn "Showing backend logs:"
    docker compose logs --tail=50 backend
    echo ""
    error "Deploy may have failed. Check logs above."
    exit 1
  fi
  echo -n "."
  sleep $RETRY_INTERVAL
done

# Show health response
echo ""
info "Health check response:"
curl -s "http://localhost:${BACKEND_PORT}/health" | python3 -m json.tool 2>/dev/null || \
  curl -s "http://localhost:${BACKEND_PORT}/health"
echo ""

# Check all containers are running
info "Container status:"
docker compose ps
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
FRONTEND_PORT="${FRONTEND_PORT:-80}"
REAL_FRONTEND="${FRONTEND_URL:-http://localhost:${FRONTEND_PORT}}"
REAL_BACKEND="${VITE_API_URL:-http://localhost:${BACKEND_PORT}}"

echo ""
success "═══════════════════════════════════════════════════════════════"
success "  Minhongo deployed successfully!"
success "═══════════════════════════════════════════════════════════════"
echo ""
info "  Frontend:  ${REAL_FRONTEND}"
info "  Backend:   ${REAL_BACKEND}"
info "  Health:    ${REAL_BACKEND}/health"
echo ""
info "  Logs:      docker compose logs -f"
info "  Stop:      docker compose down"
info "  Rollback:  ./rollback.sh"
echo ""

