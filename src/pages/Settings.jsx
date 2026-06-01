import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (consigliato)' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (più veloce)' },
  { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
]

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('llama-3.3-70b-versatile')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    axios.get('http://localhost:8000/api/settings').then(r => {
      if (r.data.api_key_set) setApiKey('••••••••••••••••••••••••')
      if (r.data.groq_model) setModel(r.data.groq_model)
    }).catch(() => {})
  }, [])

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const r = await axios.get('http://localhost:8000/api/settings/test')
      setTestResult(r.data)
    } catch {
      setTestResult({ ok: false, error: 'Impossibile contattare il backend' })
    } finally {
      setTesting(false)
    }
  }

  const [clearConfirm, setClearConfirm] = useState(false)

  const clearLocalData = () => {
    localStorage.clear()
    setClearConfirm(false)
    toast.success('Dati locali eliminati')
  }

  const save = async () => {
    try {
      await axios.post('http://localhost:8000/api/settings', { groq_api_key: apiKey, groq_model: model })
      toast.success('Impostazioni salvate')
      setSaved(true)
    } catch { toast.error('Errore nel salvataggio') }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Impostazioni</h1>

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Configurazione AI</h2>
        <div>
          <label className="label">Groq API Key (gratuita)</label>
          <input
            className="input"
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setSaved(false) }}
            placeholder="gsk_..."
          />
          <p className="text-gray-500 text-xs mt-1">
            Ottieni la tua API key gratuita su console.groq.com
          </p>
        </div>
        <div>
          <label className="label">Modello AI</label>
          <select
            className="input"
            value={model}
            onChange={e => { setModel(e.target.value); setSaved(false) }}
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <p className="text-gray-500 text-xs mt-1">
            Il modello 70B offre risposte più accurate; l'8B è più rapido.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={save} className="btn-primary">
            {saved ? 'Salvato!' : 'Salva impostazioni'}
          </button>
          <button onClick={testConnection} disabled={testing} className="btn-secondary flex items-center gap-2">
            {testing && <div className="w-3 h-3 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />}
            {testing ? 'Test in corso...' : 'Testa connessione'}
          </button>
        </div>
        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${testResult.ok ? 'bg-green-900/30 border border-green-700 text-green-300' : 'bg-red-900/30 border border-red-700 text-red-300'}`}>
            {testResult.ok
              ? `Connessione riuscita — modello: ${testResult.model}`
              : `Errore: ${testResult.error}`}
          </div>
        )}
      </div>
      <div className="card space-y-3 mt-6">
        <h2 className="font-semibold text-white">Informazioni app</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Versione</p>
            <p className="text-white font-medium mt-1">v1.1.0</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Stack</p>
            <p className="text-white font-medium mt-1">React + FastAPI + Electron</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">AI Provider</p>
            <p className="text-white font-medium mt-1">Groq Cloud</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Database</p>
            <p className="text-white font-medium mt-1">SQLite (locale)</p>
          </div>
        </div>
        <p className="text-gray-600 text-xs border-t border-gray-800 pt-3">
          VirtualEngineer — Gestione intelligente dei cantieri edili con AI integrata.
        </p>
      </div>

      <div className="card space-y-3 mt-6">
        <h2 className="font-semibold text-white">Scorciatoie da tastiera</h2>
        <div className="space-y-2 text-sm">
          {[
            { keys: ['A'], desc: 'Apri form nuova attività (pagina Giornata)' },
            { keys: ['N'], desc: 'Apri form nuovo elemento (pagina WBS)' },
            { keys: ['Esc'], desc: 'Chiudi form / annulla modifica' },
            { keys: ['Enter'], desc: 'Conferma modifica inline (WBS, attività)' },
            { keys: ['←', '→'], desc: 'Naviga tra giorni (Giornata) o mesi (Calendario)' },
          ].map(({ keys, desc }) => (
            <div key={desc} className="flex items-center gap-3">
              <div className="flex items-center gap-1 flex-shrink-0">
                {keys.map(k => (
                  <kbd key={k} className="px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 font-mono">{k}</kbd>
                ))}
              </div>
              <span className="text-gray-400">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-3 mt-6 border-red-900/40">
        <h2 className="font-semibold text-white">Dati locali</h2>
        <p className="text-gray-400 text-sm">
          Elimina note, appunti veloci e preferenze salvati nel browser. I dati del database rimangono intatti.
        </p>
        {clearConfirm ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-400">Sicuro? L'operazione è irreversibile.</span>
            <button onClick={clearLocalData} className="text-sm px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors">
              Conferma
            </button>
            <button onClick={() => setClearConfirm(false)} className="btn-secondary text-sm">
              Annulla
            </button>
          </div>
        ) : (
          <button onClick={() => setClearConfirm(true)} className="btn-secondary text-sm text-red-400 border-red-900 hover:border-red-700">
            Cancella dati locali
          </button>
        )}
      </div>
    </div>
  )
}
