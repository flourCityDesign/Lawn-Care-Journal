import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, Button, formatDate } from '../components/ui'
import { CATEGORIES, ALL_ZONES_ID, ALL_ZONES_LABEL, BENTGRASS_CATEGORY } from '../lib/constants'
import { resizeImageFile } from '../lib/image'
import { bentgrassStatus } from '../lib/bentgrass'
import { parseLocalDate } from '../lib/date'
import Icon from '../components/Icon'

const CUT_HEIGHT_STEP = 0.25
const CUT_HEIGHT_MIN = 0.25
const DEFAULT_CUT_HEIGHT = 3

function parseCutHeight(str) {
  const n = parseFloat(str)
  return Number.isFinite(n) ? n : null
}

function formatCutHeight(n) {
  return `${Number(n.toFixed(2))}"`
}

export default function LogEntryForm() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { applications, zones, addApplication, updateApplication, productNameHistory, addPhoto, photos, deletePhoto, settings, updatePlanTask } =
    useData()

  const existing = id ? applications.find((a) => a.id === id) : null
  const isEdit = Boolean(existing)
  const prefill = location.state || {}

  const lastMow = [...applications]
    .filter((a) => a.category === 'Mow' && a.id !== existing?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  const initialCutHeight = parseCutHeight(existing?.cutHeight) ?? parseCutHeight(lastMow?.cutHeight) ?? DEFAULT_CUT_HEIGHT

  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(existing?.category ?? prefill.category ?? 'Mow')
  const [productName, setProductName] = useState(existing?.productName ?? prefill.productName ?? '')
  const [rate, setRate] = useState(existing?.rate ?? prefill.rate ?? '')
  const [cutHeight, setCutHeight] = useState(initialCutHeight)
  const [nPercent, setNPercent] = useState(existing?.nPercent ?? '')
  const [amountLbs, setAmountLbs] = useState(existing?.amountLbs ?? '')
  const [zoneId, setZoneId] = useState(existing?.zoneId ?? ALL_ZONES_ID)
  const [notes, setNotes] = useState(existing?.notes ?? prefill.notes ?? '')
  const [photoIds, setPhotoIds] = useState(existing?.photoIds ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const isMow = category === 'Mow'
  const isFertilizer = category === 'Fertilizer'
  const isBentgrass = category === BENTGRASS_CATEGORY

  const productSuggestions = useMemo(() => productNameHistory(category), [productNameHistory, category])
  const existingPhotos = photoIds.map((pid) => photos.find((p) => p.id === pid)).filter(Boolean)

  const bStatus = useMemo(() => {
    if (!isBentgrass) return null
    const excludeCurrentYear = parseLocalDate(date).getFullYear()
    const others = applications.filter((a) => a.id !== existing?.id)
    return bentgrassStatus(others, settings.bentgrassSeasonCap, settings.bentgrassRetreatDays, excludeCurrentYear)
  }, [isBentgrass, applications, existing, settings, date])

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const newIds = []
      for (const file of files) {
        const dataUrl = await resizeImageFile(file)
        const record = addPhoto({ dataUrl, date, zoneId: zoneId === ALL_ZONES_ID ? null : zoneId })
        newIds.push(record.id)
      }
      setPhotoIds((prev) => [...prev, ...newIds])
    } catch (err) {
      setError('Could not process that photo.')
      console.error(err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removePhoto(pid) {
    setPhotoIds((prev) => prev.filter((x) => x !== pid))
    deletePhoto(pid)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!date) {
      setError('Pick a date.')
      return
    }
    const payload = {
      date,
      category,
      productName: isMow ? '' : productName.trim(),
      rate: isMow ? '' : rate.trim(),
      cutHeight: isMow ? formatCutHeight(cutHeight) : '',
      nPercent: isFertilizer && nPercent !== '' ? Number(nPercent) : null,
      amountLbs: isFertilizer && amountLbs !== '' ? Number(amountLbs) : null,
      zoneId,
      notes: notes.trim(),
      photoIds,
    }

    let record
    if (isEdit) {
      updateApplication(existing.id, payload)
      record = { ...existing, ...payload }
    } else {
      record = addApplication(payload)
      if (prefill.linkedTaskId) {
        updatePlanTask(prefill.linkedTaskId, { completed: true, linkedApplicationId: record.id })
      }
    }
    navigate(`/log/${record.id}`)
  }

  return (
    <Page>
      <PageHeader title={isEdit ? 'Edit Entry' : 'Log Entry'} backTo={isEdit ? `/log/${existing.id}` : '/log'} />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="entry-date">Date</label>
              <div className="date-field">
                <Icon name="calendar" size={18} className="date-field__icon" />
                <span className="date-field__text">{formatDate(date)}</span>
                <Icon name="chevron-down" size={16} className="date-field__chevron" />
                <input
                  id="entry-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="date-field__input"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="entry-category">Category</label>
              <select id="entry-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {isMow ? (
              <div className="field">
                <label htmlFor="cut-height">Cut Height</label>
                <div className="stepper" id="cut-height">
                  <button
                    type="button"
                    className="stepper__btn"
                    disabled={cutHeight <= CUT_HEIGHT_MIN}
                    onClick={() => setCutHeight((h) => Math.max(CUT_HEIGHT_MIN, +(h - CUT_HEIGHT_STEP).toFixed(2)))}
                    aria-label="Decrease cut height"
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <div className="stepper__value">{formatCutHeight(cutHeight)}</div>
                  <button
                    type="button"
                    className="stepper__btn"
                    onClick={() => setCutHeight((h) => +(h + CUT_HEIGHT_STEP).toFixed(2))}
                    aria-label="Increase cut height"
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="product-name">Product Name</label>
                  <input
                    id="product-name"
                    type="text"
                    list="product-suggestions"
                    placeholder="e.g. Tenacity, Scotts Turf Builder"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                  <datalist id="product-suggestions">
                    {productSuggestions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
                <div className="field">
                  <label htmlFor="rate">Rate / Amount Applied</label>
                  <input
                    id="rate"
                    type="text"
                    placeholder='e.g. "10 lbs" or "32 oz/5000 sqft"'
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </div>
              </>
            )}

            {isFertilizer && (
              <div className="field-row">
                <div className="field">
                  <label htmlFor="n-percent">N% (first N-P-K number)</label>
                  <input
                    id="n-percent"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    placeholder="e.g. 24"
                    value={nPercent}
                    onChange={(e) => setNPercent(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="amount-lbs">Amount Applied (lbs)</label>
                  <input
                    id="amount-lbs"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder="e.g. 10"
                    value={amountLbs}
                    onChange={(e) => setAmountLbs(e.target.value)}
                  />
                </div>
              </div>
            )}

            {isBentgrass && bStatus && (
              <div
                className="field"
                style={{
                  background: bStatus.atCap ? 'var(--status-bad-bg)' : 'var(--status-caution-bg)',
                  border: `1px solid ${bStatus.atCap ? 'var(--danger)' : 'var(--status-caution)'}`,
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <Icon
                  name="alert"
                  size={18}
                  style={{ color: bStatus.atCap ? 'var(--danger)' : 'var(--status-caution)', flexShrink: 0, marginTop: 1 }}
                />
                <div style={{ fontSize: 13, color: bStatus.atCap ? 'var(--danger)' : 'var(--status-caution)' }}>
                  {bStatus.atCap
                    ? `This would exceed your season cap of ${bStatus.cap} bentgrass application${bStatus.cap === 1 ? '' : 's'} (${bStatus.count} already logged).`
                    : `${bStatus.count} of ${bStatus.cap} max bentgrass applications used this season.`}
                  {bStatus.safeAfter && (
                    <div style={{ marginTop: 4 }}>
                      Last treated {parseLocalDate(bStatus.lastApp.date).toLocaleDateString()} — safe to re-treat on or after{' '}
                      {bStatus.safeAfter.toLocaleDateString()}.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="field">
              <label htmlFor="zone">Area Treated</label>
              <select id="zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                <option value={ALL_ZONES_ID}>{ALL_ZONES_LABEL}</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="photo">Photos</label>
              <input id="photo" type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoChange} />
              {uploading && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>Processing photo...</div>}
              {existingPhotos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {existingPhotos.map((p) => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      <img
                        src={p.dataUrl}
                        alt=""
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10 }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        aria-label="Remove photo"
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'var(--danger)',
                          color: '#fff',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <Button type="submit" block disabled={uploading}>
              {isEdit ? 'Save Changes' : 'Save Entry'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </Page>
  )
}
