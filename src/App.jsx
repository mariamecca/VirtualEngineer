import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Project from './pages/Project'
import Daily from './pages/Daily'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import WBS from './pages/WBS'
import { useProjectStore } from './store/projectStore'

export default function App() {
  const { currentProject } = useProjectStore()

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }} />
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/project/:id" element={<Project />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/wbs" element={<WBS />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
