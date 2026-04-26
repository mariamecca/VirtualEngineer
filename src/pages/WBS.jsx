import { useState, useEffect } from 'react'
import { wbsAPI, aiAPI } from '../utils/api'
import { useProjectStore } from '../store/projectStore'
import {
  PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon,
  SparklesIcon, CheckCircleIcon, CalendarDaysIcon, CurrencyEuroIcon,
  PencilIcon, CheckIcon, XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CATEGORY_COLORS = [
  'border-l-blue-500', 'border-l-emerald-500', 'border-l-amber-500',
  'border-l-purple-500', 'border-l-rose-500', 'border-l-cyan-500',
]

export default function WBS() {
  const { currentProject } = useProjectStore()
  const [items, setItems] = useState([])
  const [schedule, setSchedule] = useState(null)
  const [tab, setTab] = useState('wbs')
  const [expanded, setExpanded] = useState({})
  const [schedulingLoading, setSchedulingLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newChecklistInputs, setNewChecklistInputs] = useState({})
  const [form, setForm] = useState({
    code: '', title: '', description: '', budget: '', start_date: '', end_date: '', parent_id: ''
  })
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    if (currentProject) load()
  }, [currentProject])

  const load = async () => {
    try {
      const res = await wbsAPI.getByProject(currentProject.id)
      setItems(res.data)
    } catch { toast.error('Errore nel caricamento WBS') }
  }

  const addWBS = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      toast.error('Codice e titolo sono obbligatori')
      return
    }
    try {
      const res = await wbsAPI.create({
        project_id: currentProject.id,
        parent_id: form.parent_id ? parseInt(form.parent_id) : null,
        code: form.code,
        title: form.title,
        description: form.description,
        budget: parseFloat(form.budget) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      })
      setItems(prev => [...prev, res.data])
      setForm({ code: '', title: '', description: '', budget: '', start_date: '', end_date: '', parent_id: '' })
      setShowAddForm(false)
      toast.success('WBS aggiunta')
    } catch { toast.error('Errore') }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({
      code: item.code, title: item.title, description: item.description || '',
      budget: item.budget || '', start_date: item.start_date || '', end_date: item.end_date || ''
    })
  }

  const saveEdit = async (id) => {
    try {
      const res = await wbsAPI.update(id, {
        code: editForm.code, title: editForm.title, description: editForm.description,
        budget: parseFloat(editForm.budget) || 0,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
      })
      setItems(prev => prev.map(i => i.id === id ? res.data : i))
      setEditingId(null)
      toast.success('Salvato')
    } catch { toast.error('Errore') }
  }

  const deleteWBS = async (id) => {
    try {
      await wbsAPI.delete(id)
      setItems(prev => prev.filter(i => i.id !== id && i.parent_id !== id))
      toast.success('WBS eliminata')
    } catch { toast.error('Errore') }
  }

  const toggleChecklist = async (wbsId, checklistId, completed) => {
    try {
      await wbsAPI.updateChecklist(checklistId, { completed: completed ? 1 : 0 })
      await load()
    } catch { toast.error('Errore') }
  }

  const addChecklistItem = async (wbsId) => {
    const title = (newChecklistInputs[wbsId] || '').trim()
    if (!title) return
    try {
      await wbsAPI.addChecklist(wbsId, { title })
      setNewChecklistInputs(prev => ({ ...prev, [wbsId]: '' }))
      await load()
    } catch { toast.error('Errore') }
  }

  const deleteChecklistItem = async (checklistId) => {
    try {
      await wbsAPI.deleteChecklist(checklistId)
      await load()
    } catch { toast.error('Errore') }
  }

  const generateSchedule = async () => {
    setSchedulingLoading(true)
    try {
      const res = await aiAPI.generateWBSSchedule(currentProject.id)
      setSchedule(res.data)
      setTab('pianificazione')
      toast.success('Pianificazione generata')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Errore nella generazione')
    } finally {
      setSchedulingLoading(false)
    }
  }

  const rootItems = items.filter(i => !i.parent_id)
  const childrenOf = (id) => items.filter(i => i.parent_id === id)
  const totalBudget = items.filter(i => !i.parent_id).reduce((s, i) => s + (i.budget || 0), 0)
  const avgProgress = items.length ? Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length) : 0

  if (!currentProject) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Seleziona un progetto dalla Dashboard per gestire le WBS.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">WBS — Work Breakdown Structure</h1>
          <p className="text-gray-400 mt-1">{currentProject.name}</p>
        </div>
        <button
          onClick={generateSchedule}
          disabled={schedulingLoading || items.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" />
          {schedulingLoading ? 'Generazione...' : 'Pianifica con AI'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-gray-400 text-sm">Totale WBS</p>
          <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm">Budget totale</p>
          <p className="text-2xl font-bold text-white mt-1">€{totalBudget.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-sm">Avanzamento medio</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{avgProgress}%</p>
          <div className="h-1.5 bg-gray-800 rounded-full mt-2">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 w-fit">
        {['wbs', 'pianificazione'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t === 'wbs' ? 'Struttura WBS' : 'Pianificazione AI'}
          </button>
        ))}
      </div>

      {/* WBS Tab */}
      {tab === 'wbs' && (
        <div className="space-y-3">
          <button onClick={() => setShowAddForm(v => !v)} className="btn-secondary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Aggiungi WBS
          </button>

          {showAddForm && (
            <div className="card space-y-3 border border-blue-700">
              <h3 className="font-semibold text-white text-sm">Nuova voce WBS</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Codice *</label>
                  <input className="input" placeholder="es. 1.2.3" value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Titolo *</label>
                  <input className="input" placeholder="es. Fondazioni" value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Descrizione</label>
                  <input className="input" value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Budget (€)</label>
                  <input className="input" type="number" value={form.budget}
                    onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
                </div>
                <div>
                  <label className="label">WBS padre (ID, opzionale)</label>
                  <select className="input" value={form.parent_id}
                    onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))}>
                    <option value="">— Nessuno (radice) —</option>
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.code} — {i.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Data inizio</label>
                  <input className="input" type="date" value={form.start_date}
                    onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Data fine</label>
                  <input className="input" type="date" value={form.end_date}
                    onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addWBS} className="btn-primary text-sm">Aggiungi</button>
                <button onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">Annulla</button>
              </div>
            </div>
          )}

          {rootItems.length === 0 && !showAddForm && (
            <div className="text-center py-16">
              <p className="text-gray-500">Nessuna WBS aggiunta. Clicca "Aggiungi WBS" per iniziare.</p>
            </div>
          )}

          {rootItems.map((item, idx) => (
            <WBSItem
              key={item.id}
              item={item}
              children={childrenOf(item.id)}
              allItems={items}
              colorClass={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
              expanded={expanded}
              setExpanded={setExpanded}
              editingId={editingId}
              editForm={editForm}
              setEditForm={setEditForm}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
              onDelete={deleteWBS}
              onToggleChecklist={toggleChecklist}
              onAddChecklist={addChecklistItem}
              onDeleteChecklist={deleteChecklistItem}
              newChecklistInputs={newChecklistInputs}
              setNewChecklistInputs={setNewChecklistInputs}
            />
          ))}
        </div>
      )}

      {/* Pianificazione Tab */}
      {tab === 'pianificazione' && (
        <div className="space-y-4">
          {!schedule ? (
            <div className="text-center py-16">
              <SparklesIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">
                {items.length === 0
                  ? 'Aggiungi prima le WBS del progetto, poi genera la pianificazione AI.'
                  : 'Clicca "Pianifica con AI" per generare il calendario giornaliero.'}
              </p>
              {items.length > 0 && (
                <button onClick={generateSchedule} disabled={schedulingLoading} className="btn-primary flex items-center gap-2 mx-auto">
                  <SparklesIcon className="w-4 h-4" />
                  {schedulingLoading ? 'Generazione...' : 'Genera pianificazione'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card border border-blue-800">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm mb-1">Analisi AI — {schedule.total_days} giorni stimati</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{schedule.summary}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={generateSchedule} disabled={schedulingLoading} className="btn-secondary text-sm flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Rigenera
                </button>
              </div>

              {schedule.days?.map((day, i) => (
                <div key={i} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-blue-400">
                        {day.date_label}
                      </span>
                      <h3 className="text-white font-semibold mt-0.5">{day.focus}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Budget giorno</p>
                      <p className="text-amber-400 font-medium text-sm">
                        €{(day.wbs_activities?.reduce((s, a) => s + (a.budget_giornaliero || 0), 0) || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {day.wbs_activities?.map((act, j) => (
                      <div key={j} className="bg-gray-900 rounded-lg p-3 flex items-start gap-3">
                        <span className="text-xs font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                          {act.wbs_code}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{act.wbs_title}</p>
                          <p className="text-gray-400 text-sm mt-0.5">{act.activity}</p>
                          <div className="flex gap-3 mt-1.5">
                            {act.hours && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <CalendarDaysIcon className="w-3 h-3" />
                                {act.hours}h
                              </span>
                            )}
                            {act.budget_giornaliero > 0 && (
                              <span className="text-xs text-amber-500 flex items-center gap-1">
                                <CurrencyEuroIcon className="w-3 h-3" />
                                €{act.budget_giornaliero.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {day.note && (
                    <p className="text-gray-500 text-xs italic border-t border-gray-800 pt-2">{day.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


function WBSItem({
  item, children, allItems, colorClass, expanded, setExpanded,
  editingId, editForm, setEditForm, onStartEdit, onSaveEdit, onCancelEdit,
  onDelete, onToggleChecklist, onAddChecklist, onDeleteChecklist,
  newChecklistInputs, setNewChecklistInputs
}) {
  const isExpanded = expanded[item.id]
  const isEditing = editingId === item.id
  const hasChildren = children.length > 0
  const checkDone = item.checklist?.filter(c => c.completed).length || 0
  const checkTotal = item.checklist?.length || 0

  return (
    <div className={`card border-l-4 ${colorClass} space-y-3`}>
      {/* Header */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Codice</label>
              <input className="input" value={editForm.code} onChange={e => setEditForm(p => ({ ...p, code: e.target.value }))} />
            </div>
            <div>
              <label className="label">Titolo</label>
              <input className="input" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Descrizione</label>
              <input className="input" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="label">Budget (€)</label>
              <input className="input" type="number" value={editForm.budget} onChange={e => setEditForm(p => ({ ...p, budget: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Inizio</label>
                <input className="input" type="date" value={editForm.start_date} onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Fine</label>
                <input className="input" type="date" value={editForm.end_date} onChange={e => setEditForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onSaveEdit(item.id)} className="btn-primary text-sm flex items-center gap-1">
              <CheckIcon className="w-3.5 h-3.5" /> Salva
            </button>
            <button onClick={onCancelEdit} className="btn-secondary text-sm flex items-center gap-1">
              <XMarkIcon className="w-3.5 h-3.5" /> Annulla
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button onClick={() => setExpanded(p => ({ ...p, [item.id]: !p[item.id] }))}
              className="text-gray-400 hover:text-white mt-0.5 flex-shrink-0">
              {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded">{item.code}</span>
                <span className="text-white font-medium">{item.title}</span>
                {checkTotal > 0 && (
                  <span className="text-xs text-gray-500">{checkDone}/{checkTotal} voci</span>
                )}
              </div>
              {item.description && (
                <p className="text-gray-400 text-sm mt-1">{item.description}</p>
              )}
              <div className="flex gap-4 mt-2 flex-wrap">
                {item.budget > 0 && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <CurrencyEuroIcon className="w-3 h-3" />
                    €{item.budget.toLocaleString()}
                  </span>
                )}
                {(item.start_date || item.end_date) && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <CalendarDaysIcon className="w-3 h-3" />
                    {item.start_date || '?'} → {item.end_date || '?'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <span className="text-sm font-bold text-green-400">{item.progress}%</span>
              <div className="w-16 h-1.5 bg-gray-800 rounded-full mt-1">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
            <button onClick={() => onStartEdit(item)} className="text-gray-500 hover:text-blue-400 p-1">
              <PencilIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(item.id)} className="text-gray-500 hover:text-red-400 p-1">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded: checklist + children */}
      {isExpanded && !isEditing && (
        <div className="pl-7 space-y-4 border-t border-gray-800 pt-3">
          {/* Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5" /> Checklist
            </p>
            {item.checklist?.map(c => (
              <div key={c.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => onToggleChecklist(item.id, c.id, !c.completed)}
                  className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    c.completed ? 'bg-green-600 border-green-600' : 'border-gray-600 hover:border-green-500'
                  }`}
                >
                  {c.completed && <CheckIcon className="w-3 h-3 text-white" />}
                </button>
                <span className={`text-sm flex-1 ${c.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                  {c.title}
                </span>
                {c.due_date && <span className="text-xs text-gray-600">{c.due_date}</span>}
                <button onClick={() => onDeleteChecklist(c.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-opacity">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                className="input text-sm py-1.5 flex-1"
                placeholder="Nuova voce checklist..."
                value={newChecklistInputs[item.id] || ''}
                onChange={e => setNewChecklistInputs(p => ({ ...p, [item.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && onAddChecklist(item.id)}
              />
              <button onClick={() => onAddChecklist(item.id)}
                className="btn-secondary text-sm px-3 flex items-center gap-1">
                <PlusIcon className="w-3.5 h-3.5" /> Aggiungi
              </button>
            </div>
          </div>

          {/* Children WBS */}
          {hasChildren && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sotto-WBS</p>
              {children.map(child => (
                <WBSItem
                  key={child.id}
                  item={child}
                  children={[]}
                  allItems={allItems}
                  colorClass="border-l-gray-600"
                  expanded={expanded}
                  setExpanded={setExpanded}
                  editingId={editingId}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onStartEdit={onStartEdit}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  onDelete={onDelete}
                  onToggleChecklist={onToggleChecklist}
                  onAddChecklist={onAddChecklist}
                  onDeleteChecklist={onDeleteChecklist}
                  newChecklistInputs={newChecklistInputs}
                  setNewChecklistInputs={setNewChecklistInputs}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
