import { Link } from 'react-router-dom'
import { PlusIcon, FolderOpenIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useProjectStore } from '../store/projectStore'
import { useEffect, useState } from 'react'
import { projectsAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function Home() {
  const { projects, setCurrentProject, currentProject } = useProjectStore()
  const [serverProjects, setServerProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsAPI.getAll()
      .then(res => setServerProjects(res.data))
      .catch(() => toast.error('Backend non raggiungibile'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Gestisci i tuoi cantieri con l'aiuto dell'intelligenza artificiale</p>
        </div>

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
            <h2 className="text-xl font-semibold text-white mb-4">I tuoi cantieri</h2>
            <div className="grid gap-4">
              {serverProjects.map(project => (
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
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Completamento</div>
                      <div className="text-2xl font-bold text-blue-400">{project.progress || 0}%</div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-4 text-sm">
                    <span className="text-gray-400">Budget: <span className="text-white">€{project.budget?.toLocaleString()}</span></span>
                    <span className="text-gray-400">Scadenza: <span className="text-white">{project.deadline}</span></span>
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
