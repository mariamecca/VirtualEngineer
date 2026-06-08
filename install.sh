#!/bin/bash

# =============================================================
#  VirtualEngineer — Installazione guidata
# =============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

print_step() { echo -e "\n${CYAN}▶ $1${RESET}"; }
print_ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${RESET}"; }
print_err()  { echo -e "${RED}✗ $1${RESET}"; }

echo -e "\n${BOLD}================================================${RESET}"
echo -e "${BOLD}   VirtualEngineer — Installazione${RESET}"
echo -e "${BOLD}================================================${RESET}"

# ── 1. Node.js ──────────────────────────────────────────────
print_step "Controllo Node.js..."
if ! command -v node &>/dev/null; then
    print_err "Node.js non trovato."
    echo "  Scaricalo da: https://nodejs.org"
    exit 1
fi
NODE_VER=$(node -v)
print_ok "Node.js $NODE_VER trovato"

# ── 2. Python ───────────────────────────────────────────────
print_step "Controllo Python..."
PYTHON_CMD=""
for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then
        PYTHON_CMD="$cmd"
        break
    fi
done
if [ -z "$PYTHON_CMD" ]; then
    print_err "Python non trovato."
    echo "  Scaricalo da: https://python.org"
    exit 1
fi
PY_VER=$($PYTHON_CMD --version 2>&1)
print_ok "$PY_VER trovato"

# ── 3. Dipendenze frontend ──────────────────────────────────
print_step "Installazione dipendenze frontend (npm)..."
npm install --silent
print_ok "Dipendenze frontend installate"

# ── 4. Dipendenze backend ───────────────────────────────────
print_step "Installazione dipendenze backend (Python)..."
cd "$PROJECT_DIR/backend"
$PYTHON_CMD -m pip install -r requirements.txt -q
cd "$PROJECT_DIR"
print_ok "Dipendenze backend installate"

# ── 5. File .env di esempio ─────────────────────────────────
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    print_step "Creazione file di configurazione..."
    cat > "$PROJECT_DIR/backend/.env" << 'EOF'
# Incolla qui la tua API key gratuita di Groq (https://console.groq.com)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
EOF
    print_warn "Ricordati di aggiungere la tua GROQ_API_KEY in backend/.env"
fi

echo -e "\n${GREEN}${BOLD}================================================"
echo -e "  Installazione completata!"
echo -e "================================================${RESET}"
echo -e "\nPer avviare l'app esegui:"
echo -e "  ${BOLD}./start.sh${RESET}"
echo ""
