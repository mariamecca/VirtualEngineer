import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  CalendarIcon,
  FolderIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  RectangleGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useProjectStore } from '../store/projectStore'
import { useEffect, useState } from 'react'
import { projectsAPI } from '../utils/api'

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Dashboard' },
  { to: '/daily', icon: CalendarIcon, label: 'Giornata' },
  { to: '/settings', icon: Cog6ToothIcon, label: 'Impostazioni' }
]

export default function Sidebar() {
  const { currentProject } = useProjectStore()
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    projectsAPI.getAll()
      .then(res => {
        const count = res.data.filter(p => p.deadline && p.deadline < today && (p.progress || 0) < 100).length
        setOverdueCount(count)
      })
      .catch(() => {})
  }, [])

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">Virtual</h1>
            <p className="text-blue-400 text-sm font-medium -mt-1">Engineer</p>
          </div>
        </div>
      </div>

      {currentProject && (
        <div className="px-4 py-3 mx-4 mt-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Cantiere attivo</p>
          <p className="text-white font-medium text-sm mt-0.5 truncate">{currentProject.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${currentProject.progress || 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{currentProject.progress || 0}%</span>
          </div>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1">{label}</span>
            {to === '/' && overdueCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {overdueCount}
              </span>
            )}
          </NavLink>
        ))}

        {currentProject && (
          <NavLink
            to={`/project/${currentProject.id}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <FolderIcon className="w-5 h-5" />
            Progetto
          </NavLink>
        )}

        {currentProject && (
          <NavLink
            to="/wbs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <RectangleGroupIcon className="w-5 h-5" />
            WBS
          </NavLink>
        )}

        {currentProject && (
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <ChartBarIcon className="w-5 h-5" />
            Calendario
          </NavLink>
        )}

        {currentProject && (
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <DocumentTextIcon className="w-5 h-5" />
            Resoconti
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">VirtualEngineer v1.1.0</p>
      </div>
    </aside>
  )
}
