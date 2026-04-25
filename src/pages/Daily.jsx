import { useState, useEffect } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { SparklesIcon, CheckCircleIcon, PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { tasksAPI, aiAPI } from '../utils/api'
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
  const [addingTask, setAddingTask] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (currentProject) loadTasks()
  }, [currentProject, selectedDate])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await tasksAPI.getDaily(currentProject.id, selectedDate)
      setTasks(res.data)
    } catch { toast.error('Errore nel caricamento attività') } finally { setLoading(false) }
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
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    } catch { toast.error('Errore nell\'aggiornamento') }
  }

  const deleteTask = async (e, taskId) => {
    e.stopPropagation()
    try {
      await tasksAPI.deleteTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
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
        priority: 'media'
      })
      setTasks(prev => [...prev, res.data])
      setNewTaskTitle('')
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

  const goToPrevDay = () => setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))
  const goToNextDay = () => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))
  const goToToday = () => setSelectedDate(today)

  const isToday = selectedDate === today
  const completedCount = tasks.filter(t => t.completed).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

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

      {tasks.length > 0 && (
        <>
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
            {tasks.map(task => (
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
              <div className="flex gap-3">
                <input
                  className="input flex-1"
                  placeholder="Descrivi l'attività..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  autoFocus
                />
                <button onClick={addTask} disabled={addingTask} className="btn-primary">
                  {addingTask ? '...' : 'Aggiungi'}
                </button>
                <button onClick={() => { setShowAddForm(false); setNewTaskTitle('') }} className="btn-secondary">
                  Annulla
                </button>
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

      {/* Resoconto */}
      {tasks.length > 0 && (
        <div className="flex justify-end mb-6">
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
