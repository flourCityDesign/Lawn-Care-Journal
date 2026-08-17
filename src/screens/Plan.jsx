import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, IconBadge, ProgressBar, PillRow } from '../components/ui'
import Icon from '../components/Icon'
import { CATEGORIES, CATEGORY_ICON, ALL_ZONES_ID, planTaskAppliesToZone, getPlanTaskZoneIds } from '../lib/constants'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function Plan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { zones, planTasks, ensureYearPlan, resetYearPlan, addPlanTask, updatePlanTask, deletePlanTask } = useData()
  const [year, setYear] = useState(new Date().getFullYear())
  const [zoneFilter, setZoneFilter] = useState(() => {
    const zoneId = searchParams.get('zone')
    return zones.find((z) => z.id === zoneId)?.name ?? 'All'
  })
  const [addingMonth, setAddingMonth] = useState(null)
  const [newCategory, setNewCategory] = useState('Other')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    ensureYearPlan(year)
  }, [ensureYearPlan, year])

  const zoneOptions = useMemo(() => ['All', ...zones.map((z) => z.name)], [zones])
  const filterZone = zones.find((z) => z.name === zoneFilter)

  const yearTasks = useMemo(() => {
    return planTasks
      .filter((t) => t.year === year)
      .filter((t) => zoneFilter === 'All' || (filterZone && planTaskAppliesToZone(t, filterZone.id)))
  }, [planTasks, year, zoneFilter, filterZone])

  const tasksByMonth = useMemo(() => {
    const map = {}
    for (let m = 1; m <= 12; m++) map[m] = []
    yearTasks.forEach((t) => map[t.month]?.push(t))
    return map
  }, [yearTasks])

  const doneCount = yearTasks.filter((t) => t.completed).length
  const planPct = yearTasks.length ? Math.round((doneCount / yearTasks.length) * 100) : 0

  function logTask(task) {
    navigate('/log/new', {
      state: { category: task.category, notes: task.description, linkedTaskId: task.id },
    })
  }

  function startAdd(month) {
    setAddingMonth(month)
    setNewCategory('Other')
    setNewDescription('')
  }

  function submitAdd(e, month) {
    e.preventDefault()
    if (!newDescription.trim()) return
    addPlanTask({
      year,
      month,
      category: newCategory,
      description: newDescription.trim(),
      zoneIds: filterZone ? [filterZone.id] : [ALL_ZONES_ID],
    })
    setAddingMonth(null)
  }

  function handleReset() {
    if (window.confirm(`Reset ${year} to the default plan? This removes all ${year} tasks, including custom ones and progress.`)) {
      resetYearPlan(year)
    }
  }

  return (
    <Page>
      <PageHeader title="Seasonal Plan" backTo="/" />

      <Link to="/plan/builder" className="link-row">
        <Card>
          <div className="list-row">
            <IconBadge icon="list" color="var(--accent-2)" />
            <div className="list-row__body">
              <div className="list-row__title">Program Builder</div>
              <div className="list-row__subtitle">Draft tasks, then commit them to this plan</div>
            </div>
            <Icon name="chevron-right" size={18} style={{ color: 'var(--text-faint)' }} />
          </div>
        </Card>
      </Link>

      <div style={{ height: 14 }} />
      <PillRow options={zoneOptions} value={zoneFilter} onChange={setZoneFilter} />
      <div style={{ height: 14 }} />

      <Card>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn--secondary" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
            <Icon name="chevron-left" size={16} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{year}</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              {doneCount} of {yearTasks.length} done · {planPct}%
            </div>
          </div>
          <button className="btn btn--secondary" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <ProgressBar pct={planPct} color="var(--accent-2)" />
        </div>
        <div style={{ padding: '0 16px 16px', textAlign: 'center' }}>
          <button
            onClick={handleReset}
            style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 12, textDecoration: 'underline', padding: 0 }}
          >
            Reset {year} to default plan
          </button>
        </div>
      </Card>

      {MONTH_NAMES.map((name, idx) => {
        const month = idx + 1
        const tasks = tasksByMonth[month] || []
        if (tasks.length === 0 && addingMonth !== month) {
          return (
            <div key={month} style={{ margin: '14px 0' }}>
              <button
                onClick={() => startAdd(month)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-faint)',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                }}
              >
                {name} <Icon name="plus" size={13} />
              </button>
            </div>
          )
        }
        return (
          <div key={month} style={{ margin: '18px 0 0' }}>
            <div className="month-label" style={{ margin: 0, marginBottom: 8 }}>
              <span>{name}</span>
              <button
                onClick={() => startAdd(month)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, padding: 0 }}
              >
                + Add
              </button>
            </div>
            <Card>
              {tasks.map((task) => {
                const meta = CATEGORY_ICON[task.category] || CATEGORY_ICON.Other
                const taskZoneIds = getPlanTaskZoneIds(task)
                const taskZoneLabel = taskZoneIds.includes(ALL_ZONES_ID)
                  ? 'Whole Lawn'
                  : taskZoneIds.map((id) => zones.find((z) => z.id === id)?.name || 'Deleted zone').join(', ')
                return (
                  <div className="list-row" key={task.id}>
                    <button
                      onClick={() => updatePlanTask(task.id, { completed: !task.completed })}
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        border: `2px solid ${task.completed ? 'var(--accent)' : 'var(--card-border)'}`,
                        background: task.completed ? 'var(--accent)' : 'transparent',
                        color: '#0a0e0a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {task.completed && <Icon name="check" size={14} strokeWidth={3} />}
                    </button>
                    <div className="list-row__body">
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'var(--text-dim)' : 'var(--text)',
                        }}
                      >
                        {task.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                        <IconBadge icon={meta.icon} color={meta.color} size={18} iconSize={11} />
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                          {task.category}
                          {zoneFilter === 'All' && ` · ${taskZoneLabel}`}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => logTask(task)}
                        aria-label="Log this task"
                        className="btn btn--secondary"
                        style={{ padding: '8px 10px' }}
                      >
                        <Icon name="plus" size={14} />
                      </button>
                      <button
                        onClick={() => window.confirm('Remove this task?') && deletePlanTask(task.id)}
                        aria-label="Delete task"
                        className="btn btn--danger"
                        style={{ padding: '8px 10px' }}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {addingMonth === month && (
                <form onSubmit={(e) => submitAdd(e, month)} style={{ padding: 14 }}>
                  <div className="field-row">
                    <div className="field" style={{ flex: 1 }}>
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <input
                      type="text"
                      placeholder="Task description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" className="btn btn--primary" style={{ flex: 1 }}>
                      Add
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={() => setAddingMonth(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )
      })}
    </Page>
  )
}
