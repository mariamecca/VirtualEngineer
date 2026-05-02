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

  useEffect(() => {
    axios.get('http://localhost:8000/api/settings').then(r => {
      if (r.data.api_key_set) setApiKey('••••••••••••••••••••••••')
      if (r.data.groq_model) setModel(r.data.groq_model)
    }).catch(() => {})
  }, [])

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
        <button onClick={save} className="btn-primary">
          {saved ? 'Salvato!' : 'Salva impostazioni'}
        </button>
      </div>
    </div>
  )
}
