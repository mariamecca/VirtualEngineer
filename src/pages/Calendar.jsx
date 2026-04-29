import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO, isSameDay, isToday } from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { tasksAPI } from '../utils/api'
import { useProjectStore } from '../store/projectStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

export default function Calendar() {
  const { currentProject } = useProjectStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarStats, setCalendarStats] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (currentProject) loadStats()
  }, [currentProject])

  const loadStats = async () => {
    try {
      const res = await tasksAPI.getCalendar(currentProject.id)
      setCalendarStats(res.data)
    } catch {
      toast.error('Errore nel caricamento calendario')
    }
  }

  const statsMap = calendarStats.reduce((acc, s) => {
    acc[s.date] = s
    return acc
  }, {})

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  // Pad start: Monday = 0
  const firstDayOfWeek = (getDay(days[0]) + 6) % 7
  const paddingDays = Array(firstDayOfWeek).fill(null)

  const getDayColor = (dateStr, stats) => {
    if (!stats) return ''
    const pct = stats.total > 0 ? stats.completed / stats.total : 0
    if (pct === 1) return 'bg-green-600/80 text-white'
    if (pct >= 0.5) return 'bg-amber-600/70 text-white'
    if (pct > 0) return 'bg-red-700/60 text-white'
    return 'bg-gray-700 text-gray-300'
  }

  const handleDayClick = (date) => {
    navigate('/daily', { state: { date: format(date, 'yyyy-MM-dd') } })
  }

  const totalDaysWithTasks = calendarStats.length
  const totalCompleted = calendarStats.filter(s => s.total > 0 && s.completed === s.total).length
  const totalTasks = calendarStats.reduce((s, d) => s + d.total, 0)
  const completedTasks = calendarStats.reduce((s, d) => s + d.completed, 0)

  if (!currentProject) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Seleziona un progetto dalla Dashboard per vedere il calendario.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Calendario</h1>
        <p className="text-gray-400 mt-1">{currentProject.name}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Giorni con attività</p>
          <p className="text-2xl font-bold text-white mt-1">{totalDaysWithTasks}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Giorni completati</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{totalCompleted}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Task totali</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{completedTasks}/{totalTasks}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Header navigazione mese */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </h2>
            {format(currentMonth, 'yyyy-MM') !== format(new Date(), 'yyyy-MM') && (
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Oggi
              </button>
            )}
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Intestazioni giorni settimana */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        {/* Griglia giorni */}
        <div className="grid grid-cols-7 gap-1">
          {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const stats = statsMap[dateStr]
            const todayClass = isToday(day) ? 'ring-2 ring-blue-500' : ''
            const colorClass = getDayColor(dateStr, stats)
            const hasData = !!stats

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all hover:scale-105 ${
                  hasData ? colorClass : 'text-gray-600 hover:bg-gray-800 hover:text-gray-400'
                } ${todayClass}`}
              >
                <span className="font-medium">{format(day, 'd')}</span>
                {stats && (
                  <span className="text-xs opacity-80 leading-none mt-0.5">
                    {stats.completed}/{stats.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">Legenda:</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-600/80" />
            <span className="text-xs text-gray-400">Completato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-600/70" />
            <span className="text-xs text-gray-400">Parziale (≥50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-700/60" />
            <span className="text-xs text-gray-400">In corso</span>
          </div>
        </div>
      </div>

      {calendarStats.length === 0 && (
        <div className="text-center py-8 mt-4">
          <CalendarDaysIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Genera il piano giornaliero dalla pagina "Giornata" per popolare il calendario</p>
        </div>
      )}
    </div>
  )
}
