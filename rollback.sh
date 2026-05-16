#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Minhongo — Rollback Script
# ─────────────────────────────────────────────────────────────────────────────
# Quickly roll back to the previous deployment.
#
# Usage:
#   chmod +x rollback.sh
#   ./rollback.sh                      # Interactive: choose rollback method
#   ./rollback.sh --redeploy           # Redeploy previous git commit
#   ./rollback.sh --db-rollback        # Also rollback the last DB migration
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
info "═══════════════════════════════════════════════════════════════"
info "  Minhongo — Rollback"
info "═══════════════════════════════════════════════════════════════"
echo ""

# ── Show current state ────────────────────────────────────────────────────────
info "Current deployment:"
echo "  Commit: $(git log -1 --format='%h %s' 2>/dev/null || echo 'N/A')"
echo "  Date:   $(git log -1 --format='%ci' 2>/dev/null || echo 'N/A')"
echo ""

info "Previous commits:"
git log -5 --format='  %h %ci %s' 2>/dev/null || echo "  (git not available)"
echo ""

# ── Rollback options ──────────────────────────────────────────────────────────
if [ "${1:-}" = "--redeploy" ]; then
  CHOICE="redeploy"
elif [ "${1:-}" = "--db-rollback" ]; then
  CHOICE="db-rollback"
else
  echo "Choose rollback method:"
  echo "  1) Revert to previous git commit and redeploy"
  echo "  2) Restart services with existing images (fastest)"
  echo "  3) Roll back last database migration + redeploy"
  echo "  4) Cancel"
  echo ""
  read -p "Choice [1-4]: " CHOICE_NUM

  case $CHOICE_NUM in
    1) CHOICE="redeploy" ;;
    2) CHOICE="restart" ;;
    3) CHOICE="db-rollback" ;;
    4) info "Cancelled."; exit 0 ;;
    *) error "Invalid choice"; exit 1 ;;
  esac
fi

case $CHOICE in
  "redeploy")
    warn "Reverting to previous commit..."
    PREV_COMMIT=$(git log -1 --format='%h')
    git revert --no-edit HEAD
    info "Rebuilding and deploying..."
    docker compose up --build -d
    success "Rolled back from commit $PREV_COMMIT"
    ;;

  "restart")
    info "Restarting services with existing images..."
    docker compose down
    docker compose up -d
    success "Services restarted"
    ;;

  "db-rollback")
    warn "This will roll back the last database migration."
    warn "Make sure you understand the data implications!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      info "Cancelled."
      exit 0
    fi

    info "Rolling back last migration..."
    # Prisma does not have a built-in rollback command in production.
    # We need to manually resolve the migration, then redeploy.
    docker compose exec backend npx prisma migrate resolve --rolled-back "$(docker compose exec backend npx prisma migrate status 2>/dev/null | grep 'applied' | tail -1 | awk '{print $1}')" 2>/dev/null || \
      warn "Auto-rollback failed. You may need to manually resolve the migration."

    # Revert code and redeploy
    git revert --no-edit HEAD
    docker compose up --build -d
    success "Database migration rolled back and redeployed"
    ;;
esac

# ── Post-rollback health check ────────────────────────────────────────────────
echo ""
info "Waiting for health check..."
BACKEND_PORT="${BACKEND_PORT:-3002}"

for i in $(seq 1 20); do
  if curl -sf "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
    success "Backend is healthy after rollback"
    break
  fi
  if [ $i -eq 20 ]; then
    error "Health check failed after rollback!"
    docker compose logs --tail=30 backend
    exit 1
  fi
  sleep 3
done

echo ""
info "Container status:"
docker compose ps
echo ""
success "Rollback complete."
