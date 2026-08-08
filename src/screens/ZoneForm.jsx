import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, Button } from '../components/ui'

export default function ZoneForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { zones, addZone, updateZone } = useData()
  const existing = id ? zones.find((z) => z.id === id) : null
  const isEdit = Boolean(existing)

  const [name, setName] = useState(existing?.name ?? '')
  const [sqft, setSqft] = useState(existing?.sqft ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Give this zone a name.')
      return
    }
    const payload = { name: name.trim(), sqft: sqft === '' ? '' : Number(sqft), notes: notes.trim() }
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
              <label htmlFor="zone-notes">Notes</label>
              <textarea
                id="zone-notes"
                rows={4}
                placeholder="Grass type, known issues, history..."
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
