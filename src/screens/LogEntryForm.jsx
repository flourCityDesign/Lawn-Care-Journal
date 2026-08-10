import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, Button, formatDate } from '../components/ui'
import { CATEGORIES, TREATMENT_CATEGORIES, N_TRACKED_CATEGORIES, ALL_ZONES_ID, ALL_ZONES_LABEL, BENTGRASS_CATEGORY, getZoneIds } from '../lib/constants'
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

function emptyProduct() {
  return { name: '', amount: '', nPercent: '', spreaderSetting: '', ozPerGallon: '' }
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
  // A duplicated entry prefills every field like an edit would, except the
  // date (defaults to today) and photos (not carried over) - and it isn't
  // saved until Save Entry is pressed, same as any other new entry.
  const source = existing ?? prefill.duplicateFrom ?? null

  const lastMow = [...applications]
    .filter((a) => a.category === 'Mow' && a.id !== existing?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  const initialCutHeight = parseCutHeight(source?.cutHeight) ?? parseCutHeight(lastMow?.cutHeight) ?? DEFAULT_CUT_HEIGHT

  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState(source?.category ?? prefill.category ?? 'Mow')
  const [productName, setProductName] = useState(source?.productName ?? prefill.productName ?? '')
  const [rate, setRate] = useState(source?.rate ?? prefill.rate ?? '')
  const [cutHeight, setCutHeight] = useState(initialCutHeight)
  const [productType, setProductType] = useState(source?.productType ?? 'granular')
  const [products, setProducts] = useState(() => {
    if (source?.products?.length) return source.products
    if (source?.productName) {
      // Older entries recorded amountLbs directly on Fertilizer entries -
      // that's the same "total amount applied" a product row wants, so it
      // carries over as-is. Other legacy categories only ever had a
      // freeform rate string (e.g. "32 oz/5000 sqft"), which isn't a clean
      // number to carry over, so those just start blank for re-entry.
      const amount = source.category === 'Fertilizer' && source.amountLbs ? String(source.amountLbs) : ''
      return [{ ...emptyProduct(), name: source.productName, amount, nPercent: source.nPercent ?? '' }]
    }
    return [emptyProduct()]
  })
  const [zoneIds, setZoneIds] = useState(() => (source ? getZoneIds(source) : [ALL_ZONES_ID]))
  const [notes, setNotes] = useState(source?.notes ?? prefill.notes ?? '')
  const [photoIds, setPhotoIds] = useState(existing?.photoIds ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const isMow = category === 'Mow'
  const isTreatment = TREATMENT_CATEGORIES.includes(category)
  const showNPercent = N_TRACKED_CATEGORIES.includes(category)
  const isBentgrass = category === BENTGRASS_CATEGORY

  const productSuggestions = useMemo(() => productNameHistory(category), [productNameHistory, category])
  const existingPhotos = photoIds.map((pid) => photos.find((p) => p.id === pid)).filter(Boolean)

  const bStatus = useMemo(() => {
    if (!isBentgrass) return null
    const excludeCurrentYear = parseLocalDate(date).getFullYear()
    const others = applications.filter((a) => a.id !== existing?.id)
    return bentgrassStatus(others, settings.bentgrassSeasonCap, settings.bentgrassRetreatDays, excludeCurrentYear)
  }, [isBentgrass, applications, existing, settings, date])

  function toggleZone(id) {
    setZoneIds((prev) => {
      if (id === ALL_ZONES_ID) return prev.includes(ALL_ZONES_ID) ? [] : [ALL_ZONES_ID]
      const withoutAll = prev.filter((z) => z !== ALL_ZONES_ID)
      return withoutAll.includes(id) ? withoutAll.filter((z) => z !== id) : [...withoutAll, id]
    })
  }

  function updateProduct(index, patch) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function addProduct() {
    setProducts((prev) => [...prev, emptyProduct()])
  }

  function removeProduct(index) {
    setProducts((prev) => prev.filter((_, i) => i !== index))
  }

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const newIds = []
      const photoZoneId = zoneIds.length === 1 && zoneIds[0] !== ALL_ZONES_ID ? zoneIds[0] : null
      for (const file of files) {
        const dataUrl = await resizeImageFile(file)
        const record = addPhoto({ dataUrl, date, zoneId: photoZoneId })
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
    if (zoneIds.length === 0) {
      setError('Pick at least one area treated.')
      return
    }
    const payload = {
      date,
      category,
      cutHeight: isMow ? formatCutHeight(cutHeight) : '',
      zoneIds,
      notes: notes.trim(),
      photoIds,
      ...(isTreatment
        ? {
            productType,
            products: products
              .filter((p) => p.name.trim() || p.amount)
              .map((p) => ({
                name: p.name.trim(),
                amount: p.amount,
                nPercent: showNPercent && p.nPercent !== '' ? Number(p.nPercent) : null,
                spreaderSetting: productType === 'granular' ? p.spreaderSetting.trim() : '',
                ozPerGallon: productType === 'liquid' ? p.ozPerGallon.trim() : '',
              })),
            productName: '',
            rate: '',
            nPercent: null,
            amountLbs: null,
          }
        : {
            productName: !isMow ? productName.trim() : '',
            rate: !isMow ? rate.trim() : '',
            nPercent: null,
            amountLbs: null,
            products: null,
            productType: null,
          }),
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

            <datalist id="product-suggestions">
              {productSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

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
            ) : isTreatment ? (
              <>
                <div className="field">
                  <label>Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className={'pill' + (productType === 'granular' ? ' pill--active' : '')}
                      style={{ flex: 1 }}
                      onClick={() => setProductType('granular')}
                    >
                      Granular
                    </button>
                    <button
                      type="button"
                      className={'pill' + (productType === 'liquid' ? ' pill--active' : '')}
                      style={{ flex: 1 }}
                      onClick={() => setProductType('liquid')}
                    >
                      Liquid
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label>Products</label>
                  {products.map((p, i) => (
                    <div className="product-card" key={i}>
                      <div className="product-card__header">
                        <span className="product-card__label">Product {i + 1}</span>
                        {products.length > 1 && (
                          <button
                            type="button"
                            className="product-card__remove"
                            onClick={() => removeProduct(i)}
                            aria-label={`Remove product ${i + 1}`}
                          >
                            <Icon name="x" size={16} />
                          </button>
                        )}
                      </div>
                      <div className="icon-field">
                        <Icon name="flask" size={16} className="icon-field__icon" />
                        <input
                          type="text"
                          list="product-suggestions"
                          placeholder="Product name"
                          value={p.name}
                          onChange={(e) => updateProduct(i, { name: e.target.value })}
                        />
                      </div>
                      <div className="icon-field">
                        <Icon name="bar-chart" size={16} className="icon-field__icon" />
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Amount applied"
                          value={p.amount}
                          onChange={(e) => updateProduct(i, { amount: e.target.value })}
                        />
                        <span className="icon-field__suffix">{productType === 'liquid' ? 'oz' : 'lbs'}</span>
                      </div>
                      {showNPercent && (
                        <div className="icon-field">
                          <Icon name="leaf" size={16} className="icon-field__icon" />
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            placeholder="N% (optional)"
                            value={p.nPercent}
                            onChange={(e) => updateProduct(i, { nPercent: e.target.value })}
                          />
                        </div>
                      )}
                      {productType === 'granular' ? (
                        <div className="icon-field">
                          <Icon name="settings" size={16} className="icon-field__icon" />
                          <input
                            type="text"
                            placeholder="Spreader setting (optional)"
                            value={p.spreaderSetting}
                            onChange={(e) => updateProduct(i, { spreaderSetting: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div className="icon-field">
                          <Icon name="droplet" size={16} className="icon-field__icon" />
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="oz per gallon (optional)"
                            value={p.ozPerGallon}
                            onChange={(e) => updateProduct(i, { ozPerGallon: e.target.value })}
                          />
                          <span className="icon-field__suffix">oz / gal</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-product-btn" onClick={addProduct}>
                    <Icon name="plus" size={16} /> Add Product
                  </button>
                </div>
              </>
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
              <label>Area Treated</label>
              <div className="pill-row pill-row--wrap">
                <button
                  type="button"
                  className={'pill' + (zoneIds.includes(ALL_ZONES_ID) ? ' pill--active' : '')}
                  onClick={() => toggleZone(ALL_ZONES_ID)}
                >
                  {ALL_ZONES_LABEL}
                </button>
                {zones.map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    className={'pill' + (zoneIds.includes(z.id) ? ' pill--active' : '')}
                    onClick={() => toggleZone(z.id)}
                  >
                    {z.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="photo">Photos</label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  clip: 'rect(0 0 0 0)',
                }}
              />
              <label
                htmlFor="photo"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '32px 16px',
                  border: '2px dashed var(--card-border)',
                  borderRadius: 14,
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  textTransform: 'none',
                  letterSpacing: 'normal',
                  fontWeight: 500,
                }}
              >
                <Icon name="camera" size={28} />
                <span style={{ fontSize: 15 }}>Add Photo</span>
              </label>
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
