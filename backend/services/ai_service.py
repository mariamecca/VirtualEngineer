import json
from datetime import datetime
from typing import List, Dict
import pdfplumber
import io
from groq import Groq

class AIService:
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.client = Groq(api_key=api_key)
        self.model = model

    def _chat(self, prompt: str, max_tokens: int = 2000) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

    def _parse_json(self, text: str) -> Dict:
        # Remove markdown code blocks if present
        text = text.replace('```json', '').replace('```', '').strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start == -1 or end == 0:
            raise ValueError(f"Nessun JSON trovato nella risposta: {text[:200]}")
        return json.loads(text[start:end])

    def _project_context(self, project) -> str:
        return f"""
Cantiere: {project.name}
Luogo: {project.location or 'N/D'}
Cliente: {project.client or 'N/D'}
Budget totale: €{project.budget:,.0f}
Scadenza: {project.deadline or 'N/D'}
Fase attuale: {project.current_phase or 'N/D'}
Avanzamento: {project.progress or 0}%
Descrizione: {project.description or 'N/D'}
Note: {project.notes or 'N/D'}
"""

    async def generate_daily_plan(self, project, date: str) -> Dict:
        day_name = datetime.strptime(date, "%Y-%m-%d").strftime("%A %d %B %Y")
        prompt = f"""Sei un ingegnere edile esperto. Genera un piano giornaliero dettagliato per questo cantiere.

{self._project_context(project)}

Data: {day_name}

Genera una checklist di 5-10 attività specifiche e pratiche per oggi.
Considera la fase attuale, il budget rimasto, e la scadenza.

Rispondi SOLO con JSON valido in questo formato esatto:
{{
  "reasoning": "breve spiegazione delle priorità del giorno",
  "tasks": [
    {{
      "title": "Nome attività",
      "description": "Dettagli operativi",
      "category": "struttura|finitura|impiantistica|sicurezza|amministrazione|altro",
      "priority": "alta|media|bassa"
    }}
  ]
}}"""

        text = self._chat(prompt)
        return self._parse_json(text)

    async def generate_daily_report(self, project, tasks: List, date: str) -> Dict:
        completed = [t for t in tasks if t.completed]
        pending = [t for t in tasks if not t.completed]

        tasks_summary = f"""
Attività completate ({len(completed)}/{len(tasks)}):
{chr(10).join(f'✓ {t.title}' for t in completed) or 'Nessuna'}

Attività non completate:
{chr(10).join(f'✗ {t.title}' for t in pending) or 'Tutte completate!'}
"""
        prompt = f"""Sei un ingegnere edile esperto. Genera un resoconto di fine giornata professionale.

{self._project_context(project)}
Data: {date}

{tasks_summary}

Scrivi un resoconto professionale in italiano che includa:
1. Valutazione dei progressi odierni
2. Impatto sul cronoprogramma e budget
3. Eventuali problemi o rischi identificati
4. Priorità per la giornata di domani

Scrivi solo il testo del resoconto, senza JSON, senza titoli, senza simboli speciali. Solo testo piano in italiano."""

        summary = self._chat(prompt)

        prompt2 = f"""In base a questo resoconto di cantiere, elenca in 2-3 punti brevi le priorità per domani. Solo testo piano, niente JSON.

{summary[:500]}"""

        next_day = self._chat(prompt2, max_tokens=300)

        return {"summary": summary.strip(), "next_day_preview": next_day.strip()}

    async def analyze_documents(self, files: List[Dict]) -> Dict:
        extracted_text = []
        for f in files:
            if 'pdf' in f.get('type', ''):
                try:
                    with pdfplumber.open(io.BytesIO(f['content'])) as pdf:
                        text = '\n'.join(page.extract_text() or '' for page in pdf.pages[:10])
                        extracted_text.append(f"[{f['name']}]\n{text[:3000]}")
                except Exception:
                    extracted_text.append(f"[{f['name']}] - Impossibile estrarre testo")
            elif 'text' in f.get('type', ''):
                extracted_text.append(f"[{f['name']}]\n{f['content'].decode('utf-8', errors='ignore')[:3000]}")
            else:
                extracted_text.append(f"[{f['name']}] - File immagine o formato non testuale")

        prompt = f"""Analizza questi documenti di cantiere ed estrai le informazioni chiave.

DOCUMENTI:
{chr(10).join(extracted_text)}

Estrai e struttura le informazioni in formato JSON valido:
{{
  "summary": "riassunto di 2-3 frasi di cosa hai trovato nei documenti",
  "project_data": {{
    "name": "nome cantiere se trovato",
    "location": "luogo se trovato",
    "client": "cliente se trovato",
    "budget": "importo numerico se trovato (solo numero)",
    "deadline": "data nel formato YYYY-MM-DD se trovata",
    "current_phase": "fase attuale se trovata",
    "description": "descrizione del progetto",
    "notes": "stato attuale dei lavori, cosa è stato fatto"
  }}
}}

Se un campo non è presente nei documenti, omettilo o metti null."""

        text = self._chat(prompt)
        return self._parse_json(text)

    async def get_optimizations(self, project, tasks: List) -> Dict:
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.completed)

        prompt = f"""Sei un consulente esperto in gestione di cantieri edili. Analizza questo cantiere e fornisci suggerimenti di ottimizzazione.

{self._project_context(project)}
Attività totali: {total_tasks}
Attività completate: {completed_tasks}

Fornisci 4-6 suggerimenti concreti per ottimizzare il cantiere dal punto di vista economico e temporale.

Rispondi SOLO con JSON valido:
{{
  "suggestions": [
    {{
      "type": "budget|tempo|sicurezza|qualita",
      "title": "titolo breve",
      "description": "spiegazione dettagliata e pratica",
      "saving": "risparmio stimato (es: 'Risparmio stimato: 2.000-5.000 euro' o '2-3 giorni di lavoro')"
    }}
  ]
}}"""

        text = self._chat(prompt)
        return self._parse_json(text)

    async def generate_wbs_schedule(self, project, wbs_items: List[Dict]) -> Dict:
        wbs_text = ""
        for w in wbs_items:
            checklist_count = len(w.get("checklist", []))
            done_count = sum(1 for c in w.get("checklist", []) if c.get("completed"))
            wbs_text += f"""
- [{w['code']}] {w['title']}
  Budget: €{w.get('budget', 0):,.0f} | Inizio: {w.get('start_date') or 'N/D'} | Fine: {w.get('end_date') or 'N/D'}
  Progresso: {w.get('progress', 0)}% | Checklist: {done_count}/{checklist_count} voci completate
  Descrizione: {w.get('description') or 'N/D'}"""

        prompt = f"""Sei un ingegnere edile esperto in pianificazione di cantieri. Analizza queste WBS (Work Breakdown Structure) e genera una pianificazione giorno per giorno ottimizzata per completarle tutte rispettando budget e scadenze.

{self._project_context(project)}

WBS DEL PROGETTO:
{wbs_text}

Genera un piano di lavoro giornaliero che:
1. Distribuisca le attività in modo logico e sequenziale
2. Rispetti le scadenze di ogni WBS
3. Ottimizzi l'uso del budget disponibile
4. Indichi quali WBS lavorare ogni giorno

Rispondi SOLO con JSON valido:
{{
  "summary": "breve analisi della pianificazione e raccomandazioni principali",
  "total_days": <numero totale giorni stimati>,
  "days": [
    {{
      "day": 1,
      "date_label": "Giorno 1 (es. Settimana 1 - Lunedì)",
      "focus": "titolo breve del focus del giorno",
      "wbs_activities": [
        {{
          "wbs_code": "codice WBS",
          "wbs_title": "titolo WBS",
          "activity": "cosa fare concretamente oggi per questa WBS",
          "hours": <ore stimate>,
          "budget_giornaliero": <budget da allocare oggi in euro>
        }}
      ],
      "note": "note operative del giorno"
    }}
  ]
}}

Genera massimo 30 giorni. Se il progetto dura di più, raggruppa le attività settimanalmente."""

        text = self._chat(prompt, max_tokens=4000)
        return self._parse_json(text)

    async def chat(self, project, message: str, history: List = None) -> Dict:
        history_text = ""
        if history:
            for msg in history:
                role_label = "Capo-cantiere" if msg.role == "user" else "VirtualEngineer"
                history_text += f"{role_label}: {msg.content}\n"

        prompt = f"""Sei VirtualEngineer, un assistente AI specializzato in gestione di cantieri edili.

{self._project_context(project)}
{"Conversazione precedente:" + chr(10) + history_text if history_text else ""}
Capo-cantiere: {message}

Rispondi in modo professionale e pratico, in italiano."""

        text = self._chat(prompt, max_tokens=1000)
        return {"response": text}
