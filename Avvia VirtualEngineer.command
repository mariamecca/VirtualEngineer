#!/bin/bash

# ─────────────────────────────────────────────────────────────
#  VirtualEngineer — Avvio con doppio clic (macOS)
#  Trascina questo file sul Desktop e fai doppio clic per avviare
# ─────────────────────────────────────────────────────────────

# Spostati nella cartella del progetto (dove si trova questo file)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colori
BOLD='\033[1m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; CYAN='\033[0;36m'; RESET='\033[0m'

clear
echo -e "${BOLD}================================================${RESET}"
echo -e "${BOLD}   VirtualEngineer 🏗️${RESET}"
echo -e "${BOLD}================================================${RESET}\n"

# ── Controlla installazione ──────────────────────────────────
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Prima installazione in corso...${RESET}"
    bash install.sh
    echo ""
fi

# ── Avvia backend ────────────────────────────────────────────
echo -e "${CYAN}▶ Avvio backend...${RESET}"
PYTHON_CMD=""
for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then PYTHON_CMD="$cmd"; break; fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo -e "${RED}✗ Python non trovato.${RESET}"
    echo "  Installa Python da: https://python.org"
    echo ""
    read -p "Premi Invio per chiudere..."
    exit 1
fi

cd backend
$PYTHON_CMD main.py &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

echo -n "  Attendere"
for i in $(seq 1 12); do
    sleep 1; echo -n "."
    if curl -s http://localhost:8000/api/settings &>/dev/null; then break; fi
done
echo -e "\n${GREEN}✓ Backend pronto${RESET}"

# ── Avvia frontend ───────────────────────────────────────────
echo -e "${CYAN}▶ Avvio frontend...${RESET}"
npm run dev:web &
FRONTEND_PID=$!

echo -n "  Attendere"
for i in $(seq 1 20); do
    sleep 1; echo -n "."
    if curl -s http://localhost:5173 &>/dev/null; then break; fi
done
echo -e "\n${GREEN}✓ Frontend pronto${RESET}"

# ── Apri browser ─────────────────────────────────────────────
open http://localhost:5173
echo -e "${GREEN}✓ VirtualEngineer aperto nel browser${RESET}"

echo -e "\n${BOLD}${GREEN}================================================"
echo -e "  App in esecuzione su http://localhost:5173"
echo -e "  Chiudi questa finestra per fermare tutto."
echo -e "================================================${RESET}\n"

# ── Attendi e poi pulisci ────────────────────────────────────
cleanup() {
    echo -e "\n${YELLOW}Arresto...${RESET}"
    kill $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}Arrestato. Arrivederci! 👋${RESET}\n"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Mantieni lo script in vita finché l'utente non chiude la finestra
wait
