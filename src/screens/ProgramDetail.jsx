import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, IconBadge } from '../components/ui'
import Icon from '../components/Icon'
import CommitDialog from '../components/CommitDialog'
import { CATEGORY_ICON, taskDetailLine } from '../lib/constants'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function ProgramDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { zones, programs, programTasks, deleteProgram, deleteProgramTask, commitProgramTask, commitAllProgramTasks } = useData()
  const [commitTarget, setCommitTarget] = useState(null) // 'all' | task object | null
  const [confirmation, setConfirmation] = useState('')

  const program = programs.find((p) => p.id === id)
  const tasks = useMemo(() => programTasks.filter((t) => t.programId === id), [programTasks, id])

  const tasksByMonth = useMemo(() => {
    const map = {}
    for (let m = 1; m <= 12; m++) map[m] = []
    tasks.forEach((t) => map[t.month]?.push(t))
    return map
  }, [tasks])

  if (!program) {
    return (
      <Page>
        <PageHeader title="Program not found" backTo="/plan/builder" />
      </Page>
    )
  }

  function handleDeleteProgram() {
    if (window.confirm(`Delete "${program.name}"? This removes all ${tasks.length} draft task${tasks.length === 1 ? '' : 's'} in it. Anything already committed to a Seasonal Plan is unaffected.`)) {
      deleteProgram(program.id)
      navigate('/plan/builder')
    }
  }

  function handleDeleteTask(task) {
    if (window.confirm('Remove this draft task?')) deleteProgramTask(task.id)
  }

  function handleCommit({ year, zoneIds }) {
    if (commitTarget === 'all') {
      const count = commitAllProgramTasks(program.id, { year, zoneIds })
      setConfirmation(`Committed ${count} task${count === 1 ? '' : 's'} to ${year}.`)
    } else if (commitTarget) {
      commitProgramTask(commitTarget.id, { year, zoneIds })
      setConfirmation(`Committed "${commitTarget.description}" to ${year}.`)
    }
    setCommitTarget(null)
  }

  return (
    <Page>
      <PageHeader
        title={program.name}
        backTo="/plan/builder"
        right={
          <button className="btn btn--danger" onClick={handleDeleteProgram} aria-label="Delete program">
            <Icon name="trash" size={16} />
          </button>
        }
      />

      {tasks.length > 0 && (
        <button className="btn btn--primary" style={{ width: '100%', marginBottom: 16 }} onClick={() => setCommitTarget('all')}>
          Commit all {tasks.length} task{tasks.length === 1 ? '' : 's'} to a plan
        </button>
      )}

      {confirmation && (
        <div
          style={{
            background: 'var(--status-good-bg)',
            border: '1px solid var(--status-good)',
            color: 'var(--status-good)',
            borderRadius: 12,
            padding: 12,
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>{confirmation}</span>
          <Link to="/plan" style={{ color: 'var(--status-good)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            View plan
          </Link>
        </div>
      )}

      {MONTH_NAMES.map((name, idx) => {
        const month = idx + 1
        const monthTasks = tasksByMonth[month] || []
        if (monthTasks.length === 0) {
          return (
            <div key={month} style={{ margin: '14px 0' }}>
              <Link
                to={`/plan/builder/${id}/task/new?month=${month}`}
                style={{
                  color: 'var(--text-faint)',
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                }}
              >
                {name} <Icon name="plus" size={13} />
              </Link>
            </div>
          )
        }
        return (
          <div key={month} style={{ margin: '18px 0 0' }}>
            <div className="month-label" style={{ margin: 0, marginBottom: 8 }}>
              <span>{name}</span>
              <Link to={`/plan/builder/${id}/task/new?month=${month}`} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                + Add
              </Link>
            </div>
            <Card>
              {monthTasks.map((task) => {
                const meta = CATEGORY_ICON[task.category] || CATEGORY_ICON.Other
                return (
                  <div className="list-row" key={task.id}>
                    <div className="list-row__body">
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{task.description}</div>
                      {taskDetailLine(task) && (
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{taskDetailLine(task)}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                        <IconBadge icon={meta.icon} color={meta.color} size={18} iconSize={11} />
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                          {task.category}
                          {task.timing && ` · ${task.timing}`}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setCommitTarget(task)}
                        aria-label="Commit task"
                        className="btn btn--secondary"
                        style={{ padding: '8px 10px' }}
                      >
                        <Icon name="upload" size={14} />
                      </button>
                      <Link to={`/plan/builder/${id}/task/${task.id}/edit`} className="btn btn--secondary" style={{ padding: '8px 10px' }} aria-label="Edit task">
                        <Icon name="edit" size={14} />
                      </Link>
                      <button
                        onClick={() => handleDeleteTask(task)}
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
            </Card>
          </div>
        )
      })}

      {commitTarget && (
        <CommitDialog
          title={commitTarget === 'all' ? `Commit all ${tasks.length} tasks` : `Commit "${commitTarget.description}"`}
          zones={zones}
          onCommit={handleCommit}
          onCancel={() => setCommitTarget(null)}
        />
      )}
    </Page>
  )
}
