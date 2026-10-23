import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, Button } from '../components/ui'
import { GRASS_TYPES } from '../lib/constants'

export default function ZoneForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { zones, addZone, updateZone } = useData()
  const existing = id ? zones.find((z) => z.id === id) : null
  const isEdit = Boolean(existing)

  const [name, setName] = useState(existing?.name ?? '')
  const [sqft, setSqft] = useState(existing?.sqft ?? '')
  const [grassTypes, setGrassTypes] = useState(
    () => (existing?.grassTypes ?? []).filter((t) => GRASS_TYPES.includes(t))
  )
  const [otherGrassTypes, setOtherGrassTypes] = useState(
    () => (existing?.grassTypes ?? []).filter((t) => !GRASS_TYPES.includes(t)).join(', ')
  )
  const [showOtherGrass, setShowOtherGrass] = useState(() => Boolean(otherGrassTypes))
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [error, setError] = useState('')

  function toggleGrassType(type) {
    setGrassTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  function toggleOtherGrass() {
    setShowOtherGrass((prev) => {
      if (prev) setOtherGrassTypes('')
      return !prev
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Give this zone a name.')
      return
    }
    const otherTypes = showOtherGrass
      ? otherGrassTypes
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []
    const payload = {
      name: name.trim(),
      sqft: sqft === '' ? '' : Number(sqft),
      grassTypes: [...grassTypes, ...otherTypes],
      notes: notes.trim(),
    }
    if (isEdit) {
      updateZone(existing.id, payload)
      navigate(`/yards/${existing.id}`)
    } else {
      const record = addZone(payload)
      navigate(`/yards/${record.id}`)
    }
  }

  return (
    <Page>
      <PageHeader title={isEdit ? 'Edit Zone' : 'New Zone'} backTo={isEdit ? `/yards/${existing.id}` : '/yards'} />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="zone-name">Name</label>
              <input
                id="zone-name"
                type="text"
                placeholder="e.g. Near house (snow mold area)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="zone-sqft">Square footage</label>
              <input
                id="zone-sqft"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="e.g. 2500"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Grass Type</label>
              <div className="pill-row pill-row--wrap">
                {GRASS_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={'pill' + (grassTypes.includes(type) ? ' pill--active' : '')}
                    onClick={() => toggleGrassType(type)}
                  >
                    {type}
                  </button>
                ))}
                <button
                  type="button"
                  className={'pill' + (showOtherGrass ? ' pill--active' : '')}
                  onClick={toggleOtherGrass}
                >
                  Other
                </button>
              </div>
              {showOtherGrass && (
                <input
                  type="text"
                  placeholder="e.g. Buffalo Grass"
                  value={otherGrassTypes}
                  onChange={(e) => setOtherGrassTypes(e.target.value)}
                  style={{ marginTop: 10 }}
                  autoFocus
                />
              )}
            </div>
            <div className="field">
              <label htmlFor="zone-notes">Notes</label>
              <textarea
                id="zone-notes"
                rows={4}
                placeholder="Known issues, history..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <Button type="submit" block>
              {isEdit ? 'Save Changes' : 'Add Zone'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </Page>
  )
}
