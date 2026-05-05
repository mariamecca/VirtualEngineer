import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { SparklesIcon, ChevronDownIcon, ChevronRightIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline'
import { reportsAPI } from '../utils/api'
import { useProjectStore } from '../store/projectStore'
import toast from 'react-hot-toast'

export default function Reports() {
  const { currentProject } = useProjectStore()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (currentProject) loadReports()
  }, [currentProject])

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await reportsAPI.getAll(currentProject.id)
      setReports(res.data)
    } catch {
      toast.error('Errore nel caricamento dei resoconti')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const deleteReport = async (e, id) => {
    e.stopPropagation()
    try {
      await reportsAPI.delete(id)
      setReports(prev => prev.filter(r => r.id !== id))
      toast.success('Resoconto eliminato')
    } catch {
      toast.error('Errore nell\'eliminazione')
    }
  }

  const groupByMonth = (reports) => {
    const groups = {}
    for (const r of reports) {
      const month = r.date.slice(0, 7)
      if (!groups[month]) groups[month] = []
      groups[month].push(r)
    }
    return groups
  }

  if (!currentProject) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Seleziona un progetto dalla Dashboard per vedere i resoconti.</p>
      </div>
    )
  }

  const grouped = groupByMonth(reports)
  const monthCount = Object.keys(grouped).length
  const busiestMonth = monthCount > 0
    ? Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)[0]
    : null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Storico Resoconti</h1>
        <p className="text-gray-400 mt-1">{currentProject.name}</p>
      </div>

      {reports.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Resoconti totali</p>
            <p className="text-2xl font-bold text-white mt-1">{reports.length}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Mesi coperti</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{monthCount}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Mese più attivo</p>
            <p className="text-lg font-bold text-amber-400 mt-1 capitalize">
              {busiestMonth
                ? format(parseISO(busiestMonth[0] + '-01'), 'MMM yyyy', { locale: it })
                : '—'}
            </p>
            {busiestMonth && (
              <p className="text-gray-500 text-xs mt-0.5">{busiestMonth[1].length} resoconti</p>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-gray-500">Caricamento...</div>
      )}

      {!loading && reports.length === 0 && (
        <div className="text-center py-16">
          <DocumentTextIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-gray-400 font-medium">Nessun resoconto ancora</h3>
          <p className="text-gray-600 text-sm mt-1">
            Genera i resoconti giornalieri dalla pagina "Giornata"
          </p>
        </div>
      )}

      {!loading && Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([month, items]) => (
        <div key={month} className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
            {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: it })}
          </h2>
          <div className="space-y-3">
            {items.map(report => (
              <div key={report.id} className="card">
                <button
                  onClick={() => toggle(report.id)}
                  className="w-full flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <SparklesIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-white font-medium capitalize">
                        {format(parseISO(report.date), "EEEE d MMMM yyyy", { locale: it })}
                      </p>
                      {!expanded[report.id] && report.summary && (
                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">
                          {report.summary.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {expanded[report.id]
                      ? <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      : <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                    }
                    <button
                      onClick={e => deleteReport(e, report.id)}
                      className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </button>

                {expanded[report.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Analisi giornata</p>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{report.summary}</p>
                    </div>
                    {report.next_day_preview && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Priorità giorno successivo</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{report.next_day_preview}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
