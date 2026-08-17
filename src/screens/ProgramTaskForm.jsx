import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, Button } from '../components/ui'
import { CATEGORIES, TREATMENT_CATEGORIES, NPK_CATEGORIES, TASK_TIMING_OPTIONS } from '../lib/constants'
import Icon from '../components/Icon'

const CUT_HEIGHT_STEP = 0.25
const CUT_HEIGHT_MIN = 0.25
const DEFAULT_CUT_HEIGHT = 3

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function parseCutHeight(str) {
  const n = parseFloat(str)
  return Number.isFinite(n) ? n : null
}

function formatCutHeight(n) {
  return `${Number(n.toFixed(2))}"`
}

function emptyProduct() {
  return { name: '', amount: '', nPercent: '', pPercent: '', kPercent: '', spreaderSetting: '', ozPerGallon: '' }
}

export default function ProgramTaskForm() {
  const { programId, taskId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { programs, programTasks, productNameHistory, addProgramTask, updateProgramTask } = useData()

  const program = programs.find((p) => p.id === programId)
  const existing = taskId ? programTasks.find((t) => t.id === taskId) : null
  const isEdit = Boolean(existing)

  const [month, setMonth] = useState(existing?.month ?? (Number(searchParams.get('month')) || new Date().getMonth() + 1))
  const [timing, setTiming] = useState(existing?.timing ?? '')
  const [category, setCategory] = useState(existing?.category ?? 'Fertilizer')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [cutHeight, setCutHeight] = useState(parseCutHeight(existing?.cutHeight) ?? DEFAULT_CUT_HEIGHT)
  const [productType, setProductType] = useState(existing?.productType ?? 'granular')
  const [products, setProducts] = useState(() => {
    if (existing?.products?.length) return existing.products.map((p) => ({ ...emptyProduct(), ...p }))
    return [emptyProduct()]
  })
  const [error, setError] = useState('')

  const isMow = category === 'Mow'
  const isTreatment = TREATMENT_CATEGORIES.includes(category)
  const showNPK = NPK_CATEGORIES.includes(category)

  const productSuggestions = useMemo(() => productNameHistory(category), [productNameHistory, category])

  function updateProduct(index, patch) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function addProduct() {
    setProducts((prev) => [...prev, emptyProduct()])
  }

  function removeProduct(index) {
    setProducts((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) {
      setError('Enter a task description.')
      return
    }
    const payload = {
      programId,
      month,
      timing,
      category,
      description: description.trim(),
      cutHeight: isMow ? formatCutHeight(cutHeight) : '',
      productType: isTreatment ? productType : null,
      products: isTreatment
        ? products
            .filter((p) => p.name.trim() || p.amount)
            .map((p) => ({
              name: p.name.trim(),
              amount: p.amount,
              nPercent: showNPK && p.nPercent !== '' ? Number(p.nPercent) : null,
              pPercent: showNPK && p.pPercent !== '' ? Number(p.pPercent) : null,
              kPercent: showNPK && p.kPercent !== '' ? Number(p.kPercent) : null,
              spreaderSetting: productType === 'granular' ? p.spreaderSetting.trim() : '',
              ozPerGallon: productType === 'liquid' ? p.ozPerGallon.trim() : '',
            }))
        : null,
    }
    if (isEdit) {
      updateProgramTask(existing.id, payload)
    } else {
      addProgramTask(payload)
    }
    navigate(`/plan/builder/${programId}`)
  }

  if (!program) {
    return (
      <Page>
        <PageHeader title="Program not found" backTo="/plan/builder" />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader title={isEdit ? 'Edit Task' : 'New Task'} subtitle={program.name} backTo={`/plan/builder/${programId}`} />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="task-month">Month</label>
                <select id="task-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Timing (optional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TASK_TIMING_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={'pill' + (timing === t ? ' pill--active' : '')}
                    style={{ flex: 1 }}
                    onClick={() => setTiming((prev) => (prev === t ? '' : t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="task-category">Category</label>
              <select id="task-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="task-description">Description</label>
              <input
                id="task-description"
                type="text"
                placeholder="e.g. Spring pre-emergent application"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </div>

            <datalist id="program-product-suggestions">
              {productSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            {isMow && (
              <div className="field">
                <label htmlFor="task-cut-height">Cut Height (optional)</label>
                <div className="stepper" id="task-cut-height">
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
            )}

            {isTreatment && (
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
                  <label>Products (optional)</label>
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
                          list="program-product-suggestions"
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
                      {showNPK && (
                        <div className="icon-field">
                          <Icon name="leaf" size={16} className="icon-field__icon" />
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            placeholder="N%"
                            value={p.nPercent}
                            onChange={(e) => updateProduct(i, { nPercent: e.target.value })}
                          />
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            placeholder="P%"
                            value={p.pPercent}
                            onChange={(e) => updateProduct(i, { pPercent: e.target.value })}
                          />
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            placeholder="K%"
                            value={p.kPercent}
                            onChange={(e) => updateProduct(i, { kPercent: e.target.value })}
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
            )}

            {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <Button type="submit" block>
              {isEdit ? 'Save Changes' : 'Add Task'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </Page>
  )
}
