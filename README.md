# VirtualEngineer 🏗️

> AI-powered construction site management platform

VirtualEngineer is an intelligent platform that acts as a virtual site manager for construction projects. It generates daily task plans, tracks progress, optimizes budget and timelines, and produces end-of-day reports — all powered by AI.

**Currently being tested on a real active road construction site.**

---

## Features

- 📋 **AI Daily Planning** — generates a daily checklist of tasks based on project phase, budget, and deadlines
- ✅ **Checklist Management** — site managers can check off tasks and modify the plan
- 📊 **End-of-day Reports** — AI summarizes daily progress and previews next day priorities
- 📁 **Document & Photo Upload** — upload site documents and photos for monitoring
- 🔍 **Smart Onboarding** — import an existing project by uploading documents; AI extracts all information automatically
- 💡 **Optimization Suggestions** — AI recommends budget and time-saving actions
- 🗓️ **Project Calendar** — full timeline tracking from kickoff to completion

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Tailwind CSS + Vite |
| Desktop | Electron.js |
| Backend | Python FastAPI |
| Database | SQLite (local) |
| AI | Groq API (Llama 3.3 70B) |

---

## Getting Started

### Prerequisites
- Node.js (nodejs.org)
- Python 3.x

### Installation

```bash
# Clone the repository
git clone https://github.com/mariamecca/VirtualEngineer.git
cd VirtualEngineer

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip3 install -r requirements.txt
```

### Running the app

```bash
# Terminal 1 — Start backend
cd backend
python3 main.py

# Terminal 2 — Start frontend
npm run dev:web
```

Open `http://localhost:5173` in your browser.

### Configuration

1. Go to **Settings** in the app
2. Enter your **Groq API key** (free at console.groq.com)
3. Save and start using the AI features

---

## Usage

### New project
1. Click **"Nuovo Cantiere"** on the dashboard
2. Fill in project details (name, budget, deadline, phase)
3. Go to **"Giornata"** and generate your first AI daily plan

### Import existing project
1. Click **"Importa Cantiere"**
2. Upload existing documents (PDF, Word, text files)
3. AI extracts project information automatically
4. Review and confirm

---

## Built with Claude Code

This project was built with the assistance of **Claude Code by Anthropic**, which accelerated development from architecture design to deployment-ready code.

---

## License

MIT License — free to use, modify, and distribute.

---

*VirtualEngineer — bringing AI to the construction site*
