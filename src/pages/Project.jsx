import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { projectsAPI, filesAPI, aiAPI } from '../utils/api'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, PhotoIcon, DocumentIcon, SparklesIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Project() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [files, setFiles] = useState([])
  const [optimizations, setOptimizations] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState('overview')
  const [editForm, setEditForm] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    Promise.all([
      projectsAPI.getById(id).then(r => {
        setProject(r.data)
        setEditForm(r.data)
      }),
      filesAPI.getByProject(id).then(r => setFiles(r.data)),
      aiAPI.loadOptimizations(id).then(r => { if (r.data) setOptimizations(r.data) }).catch(() => {}),
      aiAPI.getChatHistory(id).then(r => { if (r.data) setChatMessages(r.data) }).catch(() => {})
    ]).catch(() => toast.error('Errore nel caricamento'))
  }, [id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

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

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await aiAPI.chat(id, userMsg.content)
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch {
      toast.error('Errore nella risposta AI')
      setChatMessages(prev => prev.slice(0, -1))
    } finally {
      setChatLoading(false)
    }
  }

  const getOptimizations = async () => {
    try {
      const res = await aiAPI.getOptimizations(id)
      setOptimizations(res.data)
    } catch { toast.error('Errore AI') }
  }

  const saveEdit = async () => {
    setSavingEdit(true)
    try {
      const res = await projectsAPI.update(id, {
        name: editForm.name,
        location: editForm.location,
        client: editForm.client,
        budget: parseFloat(editForm.budget) || 0,
        deadline: editForm.deadline,
        current_phase: editForm.current_phase,
        description: editForm.description,
        notes: editForm.notes
      })
      setProject(res.data)
      setEditing(false)
      toast.success('Cantiere aggiornato')
    } catch { toast.error('Errore nel salvataggio') }
    finally { setSavingEdit(false) }
  }

  if (!project) return <div className="p-8 text-gray-400">Caricamento...</div>

  const tabs = ['overview', 'modifica', 'files', 'ottimizzazioni', 'chat AI']

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{project.name}</h1>
        <p className="text-gray-400 mt-1">{project.location} · Cliente: {project.client}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Budget', value: `€${project.budget?.toLocaleString()}`, color: 'text-white' },
          { label: 'Scadenza', value: project.deadline || 'N/D', color: 'text-white' },
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Avanzamento lavori</h3>
              <span className="text-green-400 font-bold text-lg">{project.progress || 0}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${project.progress || 0}%` }} />
            </div>
            <p className="text-gray-500 text-xs mt-2">Aggiornato automaticamente in base alle attività completate</p>
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

      {tab === 'modifica' && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Modifica dati cantiere</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome cantiere</label>
              <input className="input" value={editForm.name || ''} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} />
            </div>
            <div>
              <label className="label">Luogo</label>
              <input className="input" value={editForm.location || ''} onChange={e => setEditForm(p => ({...p, location: e.target.value}))} />
            </div>
            <div>
              <label className="label">Cliente</label>
              <input className="input" value={editForm.client || ''} onChange={e => setEditForm(p => ({...p, client: e.target.value}))} />
            </div>
            <div>
              <label className="label">Budget (€)</label>
              <input className="input" type="number" value={editForm.budget || ''} onChange={e => setEditForm(p => ({...p, budget: e.target.value}))} />
            </div>
            <div>
              <label className="label">Scadenza</label>
              <input className="input" type="date" value={editForm.deadline || ''} onChange={e => setEditForm(p => ({...p, deadline: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="label">Fase attuale</label>
              <input className="input" value={editForm.current_phase || ''} onChange={e => setEditForm(p => ({...p, current_phase: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="label">Descrizione</label>
              <textarea className="input" rows={3} value={editForm.description || ''} onChange={e => setEditForm(p => ({...p, description: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="label">Note</label>
              <textarea className="input" rows={3} value={editForm.notes || ''} onChange={e => setEditForm(p => ({...p, notes: e.target.value}))} />
            </div>
          </div>
          <button onClick={saveEdit} disabled={savingEdit} className="btn-primary">
            {savingEdit ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
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

      {tab === 'chat AI' && (
        <div className="flex flex-col h-[600px]">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
            {chatMessages.length === 0 && (
              <div className="text-center py-16">
                <SparklesIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Chiedimi qualcosa sul cantiere</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-400">
                  <span className="animate-pulse">VirtualEngineer sta scrivendo...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Chiedi qualcosa al tuo ingegnere virtuale..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              disabled={chatLoading}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="btn-primary flex items-center gap-2 px-4"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
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
              <div className="flex justify-end">
                <button onClick={getOptimizations} className="btn-secondary text-sm">
                  Rigenera suggerimenti
                </button>
              </div>
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
