# VirtualEngineer 🏗️

> AI-powered construction site management platform

VirtualEngineer è una piattaforma intelligente che funge da responsabile di cantiere virtuale. Genera piani giornalieri, traccia l'avanzamento, ottimizza budget e scadenze, e produce resoconti di fine giornata — tutto alimentato dall'intelligenza artificiale.

**Attualmente in fase di test su un cantiere stradale attivo.**

---

## Funzionalità

- 📋 **Pianificazione AI giornaliera** — genera una checklist di attività basata su fase, budget e scadenze del progetto
- ✅ **Gestione WBS** — struttura il lavoro in voci gerarchiche con avanzamento, budget e checklist
- 📊 **Resoconti di fine giornata** — l'AI riassume il progresso e anticipa le priorità del giorno successivo
- 📁 **Caricamento documenti e foto** — upload di materiale di cantiere per il monitoraggio
- 🔍 **Onboarding smart** — importa un progetto esistente caricando documenti; l'AI estrae tutte le informazioni automaticamente
- 💡 **Suggerimenti di ottimizzazione** — l'AI consiglia azioni per risparmiare budget e tempo
- 🗓️ **Calendario progetto** — tracciamento completo dalla partenza alla consegna

---

## Stack tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React + Tailwind CSS + Vite |
| Desktop | Electron.js |
| Backend | Python FastAPI |
| Database | SQLite (locale) |
| AI | Groq API (Llama 3.3 70B) |

---

## Avvio rapido

### Prerequisiti
- [Node.js](https://nodejs.org) (v18 o superiore)
- [Python 3](https://python.org) (v3.9 o superiore)

### 1. Clona il repository

```bash
git clone https://github.com/mariamecca/VirtualEngineer.git
cd VirtualEngineer
```

### 2. Installazione (una sola volta)

```bash
./install.sh
```

Lo script installa automaticamente tutte le dipendenze frontend (npm) e backend (pip) e crea il file di configurazione.

> **Problema "Permission denied"?**
> ```bash
> chmod +x install.sh start.sh
> ```

### 3. Avvio

```bash
./start.sh
```

Avvia backend e frontend con un solo comando e apre il browser su `http://localhost:5173`.

Per fermare tutto: `Ctrl+C`

---

### Guida visiva

Apri **`setup.html`** nel browser per una pagina interattiva con istruzioni passo-passo, comandi cliccabili e soluzioni ai problemi più comuni.

---

### Installazione manuale (alternativa)

<details>
<summary>Mostra istruzioni manuali</summary>

```bash
# Dipendenze frontend
npm install

# Dipendenze backend
cd backend
pip3 install -r requirements.txt
cd ..
```

```bash
# Terminale 1 — Avvia backend
cd backend && python3 main.py

# Terminale 2 — Avvia frontend
npm run dev:web
```

Apri `http://localhost:5173` nel browser.

</details>

---

## Configurazione AI

1. Ottieni una API key gratuita su [console.groq.com](https://console.groq.com)
2. Apri **Impostazioni** nell'app
3. Incolla la chiave e salva

In alternativa, inseriscila direttamente in `backend/.env`:
```
GROQ_API_KEY=tua_chiave_qui
```

---

## Utilizzo

### Nuovo progetto
1. Clicca **"Nuovo Cantiere"** nella dashboard
2. Compila i dati (nome, budget, scadenza, fase)
3. Vai in **"Giornata"** e genera il tuo primo piano AI

### Importa progetto esistente
1. Clicca **"Importa Cantiere"**
2. Carica i documenti esistenti (PDF, Word, testo)
3. L'AI estrae le informazioni automaticamente
4. Rivedi e conferma

---

## Sviluppato con Claude Code

Questo progetto è stato sviluppato con il supporto di **Claude Code by Anthropic**, che ha accelerato lo sviluppo dalla progettazione dell'architettura fino al codice pronto al deploy.

---

## Licenza

MIT License — libero di usare, modificare e distribuire.

---

*VirtualEngineer — l'intelligenza artificiale al servizio del cantiere*
