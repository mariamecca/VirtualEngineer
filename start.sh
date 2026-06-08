#!/bin/bash

# =============================================================
#  VirtualEngineer — Avvio rapido
# =============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

print_ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${RESET}"; }
print_err()  { echo -e "${RED}✗ $1${RESET}"; }

echo -e "\n${BOLD}================================================${RESET}"
echo -e "${BOLD}   VirtualEngineer — Avvio${RESET}"
echo -e "${BOLD}================================================${RESET}"

# ── Controllo dipendenze ────────────────────────────────────
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    print_warn "Dipendenze frontend non trovate. Eseguo l'installazione..."
    npm install --silent || { print_err "npm install fallito. Esegui prima ./install.sh"; exit 1; }
fi

PYTHON_CMD=""
for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then PYTHON_CMD="$cmd"; break; fi
done
if [ -z "$PYTHON_CMD" ]; then
    print_err "Python non trovato. Esegui prima ./install.sh"
    exit 1
fi

# ── Avvio backend ───────────────────────────────────────────
echo -e "\n${CYAN}▶ Avvio backend (porta 8000)...${RESET}"
cd "$PROJECT_DIR/backend"
$PYTHON_CMD main.py &
BACKEND_PID=$!
cd "$PROJECT_DIR"

# Attendi che il backend sia pronto
echo -n "  In attesa del backend"
for i in $(seq 1 15); do
    sleep 1
    echo -n "."
    if curl -s http://localhost:8000/api/settings &>/dev/null; then
        break
    fi
done
echo ""
print_ok "Backend avviato (PID $BACKEND_PID)"

# ── Avvio frontend ──────────────────────────────────────────
echo -e "\n${CYAN}▶ Avvio frontend (porta 5173)...${RESET}"
npm run dev:web &
FRONTEND_PID=$!

echo -n "  In attesa del frontend"
for i in $(seq 1 20); do
    sleep 1; echo -n "."
    if curl -s http://localhost:5173 &>/dev/null; then break; fi
done
echo ""
print_ok "Frontend pronto (PID $FRONTEND_PID)"

# ── Apri il browser ─────────────────────────────────────────
echo -e "\n${CYAN}▶ Apertura browser...${RESET}"
if command -v open &>/dev/null; then
    open http://localhost:5173
elif command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:5173
fi

echo -e "\n${GREEN}${BOLD}================================================"
echo -e "  VirtualEngineer in esecuzione!"
echo -e "  Apri: http://localhost:5173"
echo -e "================================================${RESET}"
echo -e "\nPremere ${BOLD}Ctrl+C${RESET} per fermare tutto.\n"

# ── Cleanup alla chiusura ───────────────────────────────────
cleanup() {
    echo -e "\n${YELLOW}Arresto in corso...${RESET}"
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}Arrestato. Arrivederci!${RESET}\n"
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
