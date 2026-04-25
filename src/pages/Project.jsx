import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { projectsAPI, filesAPI, aiAPI } from '../utils/api'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, PhotoIcon, DocumentIcon, SparklesIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function Project() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [files, setFiles] = useState([])
  const [optimizations, setOptimizations] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    Promise.all([
      projectsAPI.getById(id).then(r => setProject(r.data)),
      filesAPI.getByProject(id).then(r => setFiles(r.data)),
      aiAPI.loadOptimizations(id).then(r => { if (r.data) setOptimizations(r.data) }).catch(() => {})
    ]).catch(() => toast.error('Errore nel caricamento'))
  }, [id])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: async (accepted) => {
      setUploading(true)
      try {
        const formData = new FormData()
        accepted.forEach(f => formData.append('files', f))
        const res = await filesAPI.upload(id, formData)
        setFiles(prev => [...prev, ...res.data])
        toast.success(`${accepted.length} file caricati`)
      } catch { toast.error('Errore nel caricamento') }
      finally { setUploading(false) }
    }
  })

  const getOptimizations = async () => {
    try {
      const res = await aiAPI.getOptimizations(id)
      setOptimizations(res.data)
    } catch { toast.error('Errore AI') }
  }

  if (!project) return <div className="p-8 text-gray-400">Caricamento...</div>

  const tabs = ['overview', 'files', 'ottimizzazioni']

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{project.name}</h1>
        <p className="text-gray-400 mt-1">{project.location} · Cliente: {project.client}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Budget', value: `€${project.budget?.toLocaleString()}`, color: 'text-white' },
          { label: 'Scadenza', value: project.deadline, color: 'text-white' },
          { label: 'Fase attuale', value: project.current_phase || 'N/D', color: 'text-amber-400' },
          { label: 'Completamento', value: `${project.progress || 0}%`, color: 'text-green-400' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="text-gray-400 text-sm">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-white mb-3">Avanzamento lavori</h3>
            <div className="h-2 bg-gray-800 rounded-full mb-2">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${project.progress || 0}%` }} />
            </div>
            <p className="text-gray-400 text-sm">{project.progress || 0}% completato</p>
          </div>
          {project.description && (
            <div className="card">
              <h3 className="font-semibold text-white mb-3">Descrizione</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{project.description}</p>
            </div>
          )}
          {project.notes && (
            <div className="card">
              <h3 className="font-semibold text-white mb-3">Note</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{project.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'files' && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-gray-600 transition-colors"
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Trascina file o clicca per caricare</p>
            {uploading && <p className="text-blue-400 text-sm mt-2">Caricamento...</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {files.map(file => (
              <div key={file.id} className="card flex items-center gap-3">
                {file.type?.startsWith('image') ? (
                  <PhotoIcon className="w-8 h-8 text-blue-400 flex-shrink-0" />
                ) : (
                  <DocumentIcon className="w-8 h-8 text-amber-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{file.uploaded_at}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ottimizzazioni' && (
        <div className="space-y-4">
          {!optimizations ? (
            <div className="text-center py-12">
              <SparklesIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">Ottieni suggerimenti AI per ottimizzare il cantiere</p>
              <button onClick={getOptimizations} className="btn-primary">
                Analizza con AI
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {optimizations.suggestions?.map((s, i) => (
                <div key={i} className={`card border-l-4 ${
                  s.type === 'budget' ? 'border-l-green-500' :
                  s.type === 'tempo' ? 'border-l-blue-500' : 'border-l-amber-500'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded ${
                      s.type === 'budget' ? 'bg-green-900/40 text-green-400' :
                      s.type === 'tempo' ? 'bg-blue-900/40 text-blue-400' : 'bg-amber-900/40 text-amber-400'
                    }`}>{s.type}</span>
                    <span className="text-white font-medium">{s.title}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{s.description}</p>
                  {s.saving && <p className="text-green-400 text-sm mt-2 font-medium">{s.saving}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
