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
> chmod +x install.sh start.sh "Avvia VirtualEngineer.command"
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

## Configurazione macOS 🍎

### Metodo più semplice — Doppio clic da Finder

Il file **`Avvia VirtualEngineer.command`** permette di avviare l'app con un doppio clic, senza aprire il Terminale manualmente.

**Prima configurazione (una sola volta):**

1. Apri il Terminale e dai i permessi di esecuzione:
   ```bash
   cd ~/Desktop/Projects/VirtualEngineer
   chmod +x install.sh start.sh "Avvia VirtualEngineer.command"
   ```

2. Fai doppio clic su **`Avvia VirtualEngineer.command`** dalla cartella del progetto (o spostalo sul Desktop).

> **macOS blocca il file?** Vai in **Impostazioni di Sistema → Privacy e sicurezza** e clicca "Apri comunque", oppure:
> ```bash
> xattr -d com.apple.quarantine "Avvia VirtualEngineer.command"
> ```

---

### Installazione prerequisiti su macOS con Homebrew

[Homebrew](https://brew.sh) è il modo più semplice per installare Node.js e Python su Mac.

```bash
# Installa Homebrew (se non ce l'hai)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installa Node.js e Python
brew install node python
```

Verifica l'installazione:
```bash
node -v    # deve mostrare v18 o superiore
python3 -v # deve mostrare 3.9 o superiore
```

---

### Problemi comuni su macOS

| Problema | Soluzione |
|---------|-----------|
| `zsh: permission denied: ./start.sh` | `chmod +x install.sh start.sh` |
| `python3: command not found` | Installa Python da [python.org](https://python.org) o con `brew install python` |
| `node: command not found` | Installa Node.js da [nodejs.org](https://nodejs.org) o con `brew install node` |
| `Address already in use` porta 8000 o 5173 | `lsof -ti:8000,5173 \| xargs kill -9` |
| Il file `.command` viene bloccato da Gatekeeper | `xattr -d com.apple.quarantine "Avvia VirtualEngineer.command"` |
| `npm error enoent: package.json not found` | Stai eseguendo il comando dalla cartella sbagliata. Esegui prima `cd ~/Desktop/Projects/VirtualEngineer` |

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
