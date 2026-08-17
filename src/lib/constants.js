export const CATEGORIES = [
  'Fertilizer',
  'Herbicide',
  'Pre-emergent',
  'Bentgrass treatment',
  'Soil Amendments',
  'Seed',
  'Mow',
  'Other',
]

// Groupings used for the Log screen's pill filters
export const LOG_FILTERS = ['All', 'Mow', 'Treatment', 'Seed', 'Notes']

export const TREATMENT_CATEGORIES = ['Fertilizer', 'Herbicide', 'Pre-emergent', 'Bentgrass treatment', 'Soil Amendments']

// Categories that show N-P-K fields on products. Many granular
// pre-emergents (e.g. prodiamine blends) do carry an NPK value, so
// Pre-emergent gets the fields too, just optional rather than required.
// Herbicide and Soil Amendments products that carry nitrogen should just be
// logged as Fertilizer instead, where N is fully tracked.
export const NPK_CATEGORIES = ['Fertilizer', 'Pre-emergent']
export const NPK_REQUIRED_CATEGORIES = ['Fertilizer']

// N from any NPK-tracked category counts toward the annual nitrogen budget.
export const N_TRACKED_CATEGORIES = NPK_CATEGORIES

export function filterGroupForCategory(category) {
  if (category === 'Mow') return 'Mow'
  if (category === 'Seed') return 'Seed'
  if (TREATMENT_CATEGORIES.includes(category)) return 'Treatment'
  return 'Notes'
}

export const BENTGRASS_CATEGORY = 'Bentgrass treatment'

// Optional rough timing within a task's chosen month - a Program Builder
// task is never given an exact date, just "sometime early/mid/late April".
export const TASK_TIMING_OPTIONS = ['Early', 'Mid', 'Late']

export const ALL_ZONES_ID = 'all'
export const ALL_ZONES_LABEL = 'Whole Lawn (All Zones)'

// Entries store zoneIds as an array (possibly [ALL_ZONES_ID] for Whole Lawn).
// Older entries only have a singular zoneId string - normalize those here so
// every other helper can treat all entries the same way.
export function getZoneIds(app) {
  if (Array.isArray(app.zoneIds)) return app.zoneIds
  return app.zoneId != null ? [app.zoneId] : []
}

// A Whole Lawn application covers every zone, so it should show up
// whenever viewing a specific zone's history/activity, not just "All".
export function appliesToZone(app, zoneId) {
  const ids = getZoneIds(app)
  return ids.includes(zoneId) || ids.includes(ALL_ZONES_ID)
}

export function zoneLabelForApp(app, zones) {
  const ids = getZoneIds(app)
  if (ids.includes(ALL_ZONES_ID)) return ALL_ZONES_LABEL
  const names = ids.map((id) => zones.find((z) => z.id === id)?.name || 'Deleted zone')
  return names.join(', ') || 'Deleted zone'
}

// Plan tasks predate zoneIds - treat any task missing it as Whole Lawn so
// existing tasks don't vanish from every zone-specific view.
export function getPlanTaskZoneIds(task) {
  return Array.isArray(task.zoneIds) && task.zoneIds.length > 0 ? task.zoneIds : [ALL_ZONES_ID]
}

export function planTaskAppliesToZone(task, zoneId) {
  const ids = getPlanTaskZoneIds(task)
  return ids.includes(zoneId) || ids.includes(ALL_ZONES_ID)
}

// A one-line summary of a task's structured detail (product/amount/N-P-K,
// cut height). Works for both committed plan tasks and Program Builder
// draft tasks - they share the same shape for these fields.
export function taskDetailLine(task) {
  const parts = []
  if (task.category === 'Mow' && task.cutHeight) parts.push(`Cut height: ${task.cutHeight}`)
  if (task.products?.length) {
    const unit = task.productType === 'liquid' ? 'oz' : 'lbs'
    task.products.forEach((p) => {
      const bits = [p.name].filter(Boolean)
      if (p.amount) bits.push(`${p.amount} ${unit}`)
      if (NPK_CATEGORIES.includes(task.category) && (p.nPercent || p.pPercent || p.kPercent)) {
        bits.push(`${p.nPercent || 0}-${p.pPercent || 0}-${p.kPercent || 0}`)
      } else if (p.nPercent) {
        bits.push(`${p.nPercent}% N`)
      }
      if (bits.length) parts.push(bits.join(' · '))
    })
  }
  return parts.join(' · ')
}

export const CATEGORY_ICON = {
  Mow: { icon: 'scissors', color: '#7FFF3D' },
  Fertilizer: { icon: 'flask', color: '#D4E157' },
  Herbicide: { icon: 'flask', color: '#F2A65A' },
  'Pre-emergent': { icon: 'flask', color: '#F2A65A' },
  'Bentgrass treatment': { icon: 'flask', color: '#FF6B6B' },
  'Soil Amendments': { icon: 'leaf', color: '#B08968' },
  Seed: { icon: 'seed', color: '#7FFF3D' },
  Other: { icon: 'note', color: '#9AA5A0' },
}

export const DEFAULT_SETTINGS = {
  locationLabel: '',
  lat: null,
  lon: null,
  bentgrassSeasonCap: 3,
  bentgrassRetreatDays: 21,
  nitrogenAnnualCap: 4,
  onboarded: false,
}
