import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { projectsAPI, aiAPI } from '../utils/api'
import { useProjectStore } from '../store/projectStore'
import toast from 'react-hot-toast'

export default function Onboarding() {
  const [searchParams] = useSearchParams()
  const isImport = searchParams.get('mode') === 'import'
  const [step, setStep] = useState(isImport ? 'upload' : 'form')
  const [files, setFiles] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [form, setForm] = useState({
    name: '', location: '', description: '', budget: '', deadline: '',
    client: '', current_phase: '', notes: ''
  })
  const navigate = useNavigate()
  const { addProject, setCurrentProject } = useProjectStore()

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'text/plain': ['.txt']
    },
    onDrop: (accepted) => setFiles(prev => [...prev, ...accepted])
  })

  const analyzeDocuments = async () => {
    if (!files.length) return toast.error('Carica almeno un documento')
    setAnalyzing(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      const res = await aiAPI.analyzeDocuments(formData)
      setAiSuggestion(res.data)
      setForm(prev => ({ ...prev, ...res.data.project_data }))
      setStep('review')
    } catch (e) {
      toast.error('Errore nell\'analisi AI')
    } finally {
      setAnalyzing(false)
    }
  }

  const createProject = async () => {
    try {
      const res = await projectsAPI.create({ ...form, budget: parseFloat(form.budget) || 0 })
      addProject(res.data)
      setCurrentProject(res.data)
      toast.success('Cantiere creato!')
      navigate(`/project/${res.data.id}`)
    } catch (e) {
      toast.error('Errore nella creazione del progetto')
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">
        {isImport ? 'Importa cantiere esistente' : 'Nuovo cantiere'}
      </h1>
      <p className="text-gray-400 mb-8">
        {isImport ? "Carica i documenti del cantiere e l'AI estrarrà le informazioni automaticamente" : 'Inserisci i dettagli del tuo cantiere'}
      </p>

      {step === 'upload' && (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300 font-medium">Trascina i documenti qui</p>
            <p className="text-gray-500 text-sm mt-1">PDF, Word, immagini, file di testo</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <div className="w-8 h-8 bg-blue-600/20 rounded flex items-center justify-center text-xs text-blue-400 font-bold">
                    {f.name.split('.').pop().toUpperCase()}
                  </div>
                  <span className="text-gray-300 text-sm flex-1">{f.name}</span>
                  <span className="text-gray-500 text-xs">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('form')} className="btn-secondary">
              Inserimento manuale
            </button>
            <button
              onClick={analyzeDocuments}
              disabled={analyzing || !files.length}
              className="btn-primary flex items-center gap-2 flex-1 justify-center"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analisi in corso...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Analizza con AI
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {(step === 'form' || step === 'review') && (
        <div className="space-y-6">
          {step === 'review' && aiSuggestion && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-medium">Analisi AI completata</span>
              </div>
              <p className="text-gray-300 text-sm">{aiSuggestion.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome cantiere *</label>
              <input className="input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Es. Costruzione Villa Rossi" />
            </div>
            <div>
              <label className="label">Luogo</label>
              <input className="input" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="Città, Indirizzo" />
            </div>
            <div>
              <label className="label">Cliente</label>
              <input className="input" value={form.client} onChange={e => setForm(p => ({...p, client: e.target.value}))} placeholder="Nome cliente" />
            </div>
            <div>
              <label className="label">Budget totale (€) *</label>
              <input className="input" type="number" value={form.budget} onChange={e => setForm(p => ({...p, budget: e.target.value}))} placeholder="150000" />
            </div>
            <div>
              <label className="label">Data di completamento *</label>
              <input className="input" type="date" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} />
            </div>
            <div>
              <label className="label">Fase attuale</label>
              <input className="input" value={form.current_phase} onChange={e => setForm(p => ({...p, current_phase: e.target.value}))} placeholder="Es. Fondamenta, Struttura..." />
            </div>
            <div className="col-span-2">
              <label className="label">Descrizione progetto</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Descrivi il progetto..." />
            </div>
            <div className="col-span-2">
              <label className="label">Note aggiuntive / Stato attuale</label>
              <textarea className="input" rows={3} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Cosa è già stato fatto, problemi aperti..." />
            </div>
          </div>

          <div className="flex gap-3">
            {isImport && <button onClick={() => setStep('upload')} className="btn-secondary">Indietro</button>}
            <button onClick={createProject} className="btn-primary flex-1">
              Crea cantiere
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
