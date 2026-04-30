import { Link } from 'react-router-dom'
import { PlusIcon, FolderOpenIcon, ArrowUpTrayIcon, ExclamationTriangleIcon, CheckBadgeIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useProjectStore } from '../store/projectStore'
import { useEffect, useState } from 'react'
import { projectsAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function Home() {
  const { projects, setCurrentProject, currentProject } = useProjectStore()
  const [serverProjects, setServerProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const deleteProject = async (e, id) => {
    e.stopPropagation()
    try {
      await projectsAPI.delete(id)
      setServerProjects(prev => prev.filter(p => p.id !== id))
      if (currentProject?.id === id) setCurrentProject(null)
      toast.success('Cantiere eliminato')
    } catch {
      toast.error('Errore nell\'eliminazione')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  useEffect(() => {
    projectsAPI.getAll()
      .then(res => setServerProjects(res.data))
      .catch(() => toast.error('Backend non raggiungibile'))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const filteredProjects = search.trim()
    ? serverProjects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.location || '').toLowerCase().includes(search.toLowerCase())
      )
    : serverProjects
  const avgProgress = serverProjects.length
    ? Math.round(serverProjects.reduce((s, p) => s + (p.progress || 0), 0) / serverProjects.length)
    : 0
  const overdueProjects = serverProjects.filter(p => p.deadline && p.deadline < today && (p.progress || 0) < 100)
  const completedProjects = serverProjects.filter(p => (p.progress || 0) === 100)
  const totalBudget = serverProjects.reduce((s, p) => s + (p.budget || 0), 0)

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Gestisci i tuoi cantieri con l'aiuto dell'intelligenza artificiale</p>
        </div>

        {/* Stats row */}
        {serverProjects.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="card text-center py-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Cantieri</p>
              <p className="text-2xl font-bold text-white mt-1">{serverProjects.length}</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Avanz. medio</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{avgProgress}%</p>
            </div>
            <div className="card text-center py-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Budget totale</p>
              <p className="text-xl font-bold text-amber-400 mt-1">€{totalBudget.toLocaleString()}</p>
            </div>
            <div className={`card text-center py-3 ${overdueProjects.length > 0 ? 'border-red-800' : ''}`}>
              <p className="text-gray-400 text-xs uppercase tracking-wide">In ritardo</p>
              <p className={`text-2xl font-bold mt-1 ${overdueProjects.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {overdueProjects.length}
              </p>
            </div>
          </div>
        )}

        {overdueProjects.length > 0 && (
          <div className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-800 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium text-sm">
                {overdueProjects.length} {overdueProjects.length === 1 ? 'cantiere è in ritardo' : 'cantieri sono in ritardo'}
              </p>
              <p className="text-red-400/70 text-xs mt-0.5">
                {overdueProjects.map(p => p.name).join(' · ')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/onboarding" className="card hover:border-blue-500 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
              <PlusIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Nuovo Cantiere</h3>
            <p className="text-gray-400 text-sm">Crea un nuovo progetto dall'inizio</p>
          </Link>

          <Link to="/onboarding?mode=import" className="card hover:border-amber-500 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600/30 transition-colors">
              <ArrowUpTrayIcon className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Importa Cantiere</h3>
            <p className="text-gray-400 text-sm">Carica documenti esistenti per l'analisi AI</p>
          </Link>

          <div className="card hover:border-green-500 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600/30 transition-colors">
              <FolderOpenIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Cantieri Attivi</h3>
            <p className="text-gray-400 text-sm">{serverProjects.length} cantieri in corso</p>
          </div>
        </div>

        {serverProjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-xl font-semibold text-white">I tuoi cantieri</h2>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-9 py-1.5 text-sm w-56"
                  placeholder="Cerca per nome o luogo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            {filteredProjects.length === 0 && (
              <p className="text-gray-500 text-sm py-6 text-center">Nessun cantiere trovato per "{search}"</p>
            )}
            <div className="grid gap-4">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => setCurrentProject(project)}
                  className={`card cursor-pointer hover:border-blue-500 transition-colors ${
                    currentProject?.id === project.id ? 'border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{project.location}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Completamento</div>
                        <div className="text-2xl font-bold text-blue-400">{project.progress || 0}%</div>
                      </div>
                      {confirmDeleteId === project.id ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <span className="text-xs text-gray-400">Sicuro?</span>
                          <button
                            onClick={e => deleteProject(e, project.id)}
                            className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded"
                          >Sì</button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(null) }}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                          >No</button>
                        </div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDeleteId(project.id) }}
                          className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-4 text-sm flex-wrap items-center">
                    <span className="text-gray-400">Budget: <span className="text-white">€{project.budget?.toLocaleString()}</span></span>
                    <span className="text-gray-400">Scadenza: <span className={`${project.deadline && project.deadline < today && (project.progress || 0) < 100 ? 'text-red-400' : 'text-white'}`}>{project.deadline || '—'}</span></span>
                    {(project.progress || 0) === 100 && (
                      <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckBadgeIcon className="w-3.5 h-3.5" /> Completato
                      </span>
                    )}
                    {project.deadline && project.deadline < today && (project.progress || 0) < 100 && (
                      <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Scaduto
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
