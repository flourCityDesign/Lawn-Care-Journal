import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, IconBadge, EmptyState } from '../components/ui'
import Icon from '../components/Icon'

export default function ProgramBuilder() {
  const navigate = useNavigate()
  const { programs, programTasks, addProgram } = useData()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const programsSorted = [...programs].sort((a, b) => a.name.localeCompare(b.name))

  function submitAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    const record = addProgram({ name: name.trim() })
    setAdding(false)
    setName('')
    navigate(`/plan/builder/${record.id}`)
  }

  return (
    <Page>
      <PageHeader
        title="Program Builder"
        subtitle="Draft tasks, then commit them to a plan"
        backTo="/plan"
        right={
          <button className="btn btn--primary" onClick={() => setAdding(true)} aria-label="New program">
            <Icon name="plus" size={17} />
          </button>
        }
      />

      {adding && (
        <Card style={{ marginBottom: 16 }}>
          <form onSubmit={submitAdd} style={{ padding: 14 }}>
            <div className="field">
              <label htmlFor="program-name">Program name</label>
              <input
                id="program-name"
                type="text"
                placeholder='e.g. "Standard Program" or "Renovation Program"'
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn--primary" style={{ flex: 1 }}>
                Create
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setAdding(false)
                  setName('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {programs.length === 0 && !adding ? (
        <EmptyState
          icon="list"
          title="No programs yet"
          subtitle={
            'Build a reusable set of tasks - like "Standard Program" or "Renovation Program" - then commit them to any yard\'s Seasonal Plan whenever you\'re ready.'
          }
        />
      ) : (
        <Card>
          {programsSorted.map((program) => {
            const count = programTasks.filter((t) => t.programId === program.id).length
            return (
              <Link to={`/plan/builder/${program.id}`} className="link-row" key={program.id}>
                <div className="list-row">
                  <IconBadge icon="list" color="var(--accent-2)" />
                  <div className="list-row__body">
                    <div className="list-row__title">{program.name}</div>
                    <div className="list-row__subtitle">
                      {count} task{count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <Icon name="chevron-right" size={18} style={{ color: 'var(--text-faint)' }} />
                </div>
              </Link>
            )
          })}
        </Card>
      )}
    </Page>
  )
}
