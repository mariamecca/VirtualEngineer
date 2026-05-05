import { useState, useEffect } from 'react'
import { format, addDays, subDays, parseISO, eachDayOfInterval } from 'date-fns'
import { it } from 'date-fns/locale'
import { SparklesIcon, CheckCircleIcon, PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, FunnelIcon, ClipboardDocumentIcon, TrophyIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { tasksAPI, aiAPI, reportsAPI, projectsAPI } from '../utils/api'
import { useProjectStore } from '../store/projectStore'
import toast from 'react-hot-toast'

export default function Daily() {
  const { currentProject } = useProjectStore()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const today = format(new Date(), 'yyyy-MM-dd')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('media')
  const [addingTask, setAddingTask] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState('tutte')
  const [weekStats, setWeekStats] = useState([])
  const [sortByPriority, setSortByPriority] = useState(false)
  const [noteText, setNoteText] = useState('')

  const noteKey = currentProject ? `note_${currentProject.id}_${selectedDate}` : null

  useEffect(() => {
    if (noteKey) setNoteText(localStorage.getItem(noteKey) || '')
  }, [noteKey])

  const saveNote = (val) => {
    setNoteText(val)
    if (noteKey) localStorage.setItem(noteKey, val)
  }

  useEffect(() => {
    if (currentProject) {
      loadTasks()
      loadReport()
    }
  }, [currentProject, selectedDate])

  useEffect(() => {
    if (currentProject) {
      tasksAPI.getCalendar(currentProject.id)
        .then(res => setWeekStats(res.data))
        .catch(() => {})
    }
  }, [currentProject])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await tasksAPI.getDaily(currentProject.id, selectedDate)
      setTasks(res.data)
    } catch { toast.error('Errore nel caricamento attività') } finally { setLoading(false) }
  }

  const loadReport = async () => {
    try {
      const res = await reportsAPI.getDaily(currentProject.id, selectedDate)
      if (res.data) setReport(res.data)
      else setReport(null)
    } catch { setReport(null) }
  }

  const updateProjectProgress = async (updatedTasks) => {
    if (!currentProject) return
    const total = updatedTasks.length
    if (total === 0) return
    const completed = updatedTasks.filter(t => t.completed).length
    const newProgress = Math.round((completed / total) * 100)
    try {
      await projectsAPI.update(currentProject.id, { progress: newProgress })
      await reportsAPI.saveSnapshot(currentProject.id, selectedDate, newProgress)
    } catch { }
  }

  const generatePlan = async () => {
    if (!currentProject) return toast.error('Seleziona un cantiere')
    setGenerating(true)
    try {
      const res = await aiAPI.generateDailyPlan(currentProject.id, selectedDate)
      setTasks(res.data.tasks)
      toast.success('Piano giornaliero generato!')
    } catch { toast.error('Errore nella generazione del piano') }
    finally { setGenerating(false) }
  }

  const toggleTask = async (task) => {
    try {
      await tasksAPI.updateTask(task.id, { completed: !task.completed })
      const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t)
      setTasks(updatedTasks)
      updateProjectProgress(updatedTasks)
    } catch { toast.error('Errore nell\'aggiornamento') }
  }

  const deleteTask = async (e, taskId) => {
    e.stopPropagation()
    try {
      await tasksAPI.deleteTask(taskId)
      const updatedTasks = tasks.filter(t => t.id !== taskId)
      setTasks(updatedTasks)
      updateProjectProgress(updatedTasks)
      toast.success('Attività eliminata')
    } catch { toast.error('Errore nell\'eliminazione') }
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    try {
      const res = await tasksAPI.addTask({
        project_id: currentProject.id,
        title: newTaskTitle.trim(),
        date: selectedDate,
        priority: newTaskPriority
      })
      setTasks(prev => [...prev, res.data])
      setNewTaskTitle('')
      setNewTaskPriority('media')
      setShowAddForm(false)
      toast.success('Attività aggiunta')
    } catch { toast.error('Errore nell\'aggiunta') }
    finally { setAddingTask(false) }
  }

  const generateReport = async () => {
    setReportLoading(true)
    try {
      const res = await aiAPI.getDailyReport(currentProject.id, selectedDate)
      setReport(res.data)
    } catch { toast.error('Errore nel report') }
    finally { setReportLoading(false) }
  }

  const copyTaskList = () => {
    const dateLabel = format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })
    const lines = [`Attività del ${dateLabel} — ${currentProject.name}`, '']
    tasks.forEach(t => {
      const check = t.completed ? '✓' : '○'
      const prio = t.priority === 'alta' ? ' [ALTA]' : ''
      lines.push(`${check} ${t.title}${prio}`)
    })
    lines.push('', `Completate: ${completedCount}/${tasks.length} (${progress}%)`)
    navigator.clipboard.writeText(lines.join('\n'))
    toast.success('Lista copiata negli appunti')
  }

  const exportReport = () => {
    const dateLabel = format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })
    const completedTasks = tasks.filter(t => t.completed)
    const pendingTasks = tasks.filter(t => !t.completed)
    let text = `RESOCONTO GIORNALIERO — ${dateLabel}\n`
    text += `Cantiere: ${currentProject.name}\n`
    text += `${'='.repeat(50)}\n\n`
    text += `AVANZAMENTO: ${completedTasks.length}/${tasks.length} attività completate (${progress}%)\n\n`
    if (completedTasks.length) {
      text += `COMPLETATE:\n`
      completedTasks.forEach(t => { text += `  ✓ ${t.title}\n` })
      text += '\n'
    }
    if (pendingTasks.length) {
      text += `IN SOSPESO:\n`
      pendingTasks.forEach(t => { text += `  ○ ${t.title}\n` })
      text += '\n'
    }
    if (report?.summary) {
      text += `ANALISI AI:\n${report.summary}\n\n`
    }
    if (report?.next_day_preview) {
      text += `PRIORITÀ DOMANI:\n${report.next_day_preview}\n`
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resoconto_${selectedDate}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const goToPrevDay = () => setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))
  const goToNextDay = () => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))
  const goToToday = () => setSelectedDate(today)

  const isToday = selectedDate === today
  const completedCount = tasks.filter(t => t.completed).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const FILTERS = [
    { key: 'tutte', label: 'Tutte' },
    { key: 'da_fare', label: 'Da fare' },
    { key: 'completate', label: 'Completate' },
    { key: 'alta', label: 'Alta priorità' },
  ]

  const PRIORITY_ORDER = { alta: 0, media: 1, bassa: 2 }

  const filteredTasks = tasks
    .filter(t => {
      if (filter === 'da_fare') return !t.completed
      if (filter === 'completate') return t.completed
      if (filter === 'alta') return t.priority === 'alta'
      return true
    })
    .sort((a, b) => {
      if (!sortByPriority) return 0
      return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
    })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header con navigazione date */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={goToPrevDay} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">
              {format(parseISO(selectedDate), "EEEE d MMMM yyyy", { locale: it })}
            </h1>
            <p className="text-gray-400 mt-0.5 text-sm">
              {currentProject ? currentProject.name : 'Seleziona un cantiere dalla dashboard'}
            </p>
          </div>
          <button onClick={goToNextDay} disabled={isToday} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={goToToday} className="text-xs text-blue-400 hover:text-blue-300 underline">
              Oggi
            </button>
          )}
        </div>

        <button
          onClick={generatePlan}
          disabled={generating || !currentProject || !isToday}
          className="btn-primary flex items-center gap-2"
          title={!isToday ? 'Puoi generare il piano solo per oggi' : ''}
        >
          {generating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <SparklesIcon className="w-5 h-5" />
          )}
          {tasks.length ? 'Rigenera piano AI' : 'Genera piano AI'}
        </button>
      </div>

      {weekStats.length > 0 && currentProject && (() => {
        const statsMap = weekStats.reduce((acc, s) => { acc[s.date] = s; return acc }, {})
        const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })
        return (
          <div className="flex items-center gap-1.5 mb-6">
            <span className="text-xs text-gray-600 mr-1">7 giorni:</span>
            {last7.map(d => {
              const ds = format(d, 'yyyy-MM-dd')
              const s = statsMap[ds]
              const isSelected = ds === selectedDate
              const dot = s
                ? s.completed === s.total ? 'bg-green-500' : s.completed > 0 ? 'bg-amber-500' : 'bg-red-600'
                : 'bg-gray-700'
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  title={s ? `${s.completed}/${s.total}` : format(d, 'd MMM', { locale: it })}
                  className={`w-5 h-5 rounded-full transition-all ${dot} ${isSelected ? 'ring-2 ring-white scale-125' : 'hover:scale-110'}`}
                />
              )
            })}
          </div>
        )
      })()}

      {tasks.length > 0 && progress === 100 && (
        <div className="mb-6 p-4 rounded-xl bg-green-950/50 border border-green-700 flex items-center gap-3">
          <TrophyIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-semibold">Giornata completata!</p>
            <p className="text-green-500 text-sm mt-0.5">Tutti i task del giorno sono stati completati.</p>
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <>
          {/* Filtri + ordinamento */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filter === f.key
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                {f.label}
                {f.key === 'tutte' && ` (${tasks.length})`}
                {f.key === 'da_fare' && ` (${tasks.filter(t => !t.completed).length})`}
                {f.key === 'completate' && ` (${tasks.filter(t => t.completed).length})`}
                {f.key === 'alta' && ` (${tasks.filter(t => t.priority === 'alta').length})`}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={() => setSortByPriority(v => !v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  sortByPriority
                    ? 'bg-amber-700/40 border-amber-600 text-amber-300'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                Ordina per priorità
              </button>
            </div>
          </div>

          {/* Barra progresso */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Progresso giornaliero</span>
              <span className="text-white font-bold">{completedCount}/{tasks.length} completati</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Lista task */}
          <div className="space-y-3 mb-4">
            {filteredTasks.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Nessuna attività per questo filtro</p>
            )}
            {filteredTasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task)}
                className={`card cursor-pointer transition-all hover:border-gray-600 ${
                  task.completed ? 'opacity-60 border-green-800' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {task.completed
                    ? <CheckCircleSolid className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    : <CheckCircleIcon className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                    )}
                    <div className="flex gap-3 mt-2">
                      {task.category && (
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                          {task.category}
                        </span>
                      )}
                      {task.priority && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'alta' ? 'bg-red-900/40 text-red-400' :
                          task.priority === 'media' ? 'bg-amber-900/40 text-amber-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteTask(e, task.id)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors flex-shrink-0"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Aggiungi task manuale */}
      {currentProject && (
        <div className="mb-8">
          {showAddForm ? (
            <div className="card border-blue-800">
              <div className="space-y-3">
                <input
                  className="input w-full"
                  placeholder="Descrivi l'attività..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Priorità:</span>
                  {['bassa', 'media', 'alta'].map(p => (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                        newTaskPriority === p
                          ? p === 'alta' ? 'bg-red-900/60 border-red-600 text-red-300'
                            : p === 'media' ? 'bg-amber-900/60 border-amber-600 text-amber-300'
                            : 'bg-gray-700 border-gray-500 text-gray-300'
                          : 'border-gray-700 text-gray-500 hover:border-gray-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button onClick={addTask} disabled={addingTask} className="btn-primary text-sm">
                    {addingTask ? '...' : 'Aggiungi'}
                  </button>
                  <button onClick={() => { setShowAddForm(false); setNewTaskTitle(''); setNewTaskPriority('media') }} className="btn-secondary text-sm">
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Aggiungi attività manualmente
            </button>
          )}
        </div>
      )}

      {!tasks.length && !loading && (
        <div className="text-center py-16">
          <SparklesIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-gray-400 font-medium">Nessuna attività per questo giorno</h3>
          {isToday && <p className="text-gray-600 text-sm mt-1">Clicca "Genera piano AI" per iniziare</p>}
        </div>
      )}

      {/* Nota rapida */}
      {currentProject && (
        <div className="mb-6">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">
            Nota del giorno
          </label>
          <textarea
            className="input w-full text-sm resize-none"
            rows={3}
            placeholder="Annotazioni, osservazioni, problemi riscontrati..."
            value={noteText}
            onChange={e => saveNote(e.target.value)}
          />
        </div>
      )}

      {/* Resoconto */}
      {tasks.length > 0 && (
        <div className="flex justify-end gap-2 mb-6">
          <button onClick={copyTaskList} className="btn-secondary flex items-center gap-2">
            <ClipboardDocumentIcon className="w-4 h-4" />
            Copia lista
          </button>
          {(report || tasks.length > 0) && (
            <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Esporta .txt
            </button>
          )}
          <button
            onClick={generateReport}
            disabled={reportLoading}
            className="btn-primary flex items-center gap-2"
          >
            {reportLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
            Genera resoconto di fine giornata
          </button>
        </div>
      )}

      {report && (
        <div className="card border-blue-800">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-blue-400" />
            Resoconto AI - {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: it })}
          </h3>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {report.summary}
          </div>
          {report.next_day_preview && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-gray-400 text-sm font-medium mb-2">Priorità per domani:</p>
              <p className="text-gray-300 text-sm">{report.next_day_preview}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
