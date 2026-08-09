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

// Categories whose products can carry an N% (some herbicides, pre-emergents,
// and soil amendments are "weed-and-feed" style and do carry nitrogen).
// Bentgrass treatment is intentionally excluded.
export const N_TRACKED_CATEGORIES = ['Fertilizer', 'Herbicide', 'Pre-emergent', 'Soil Amendments']

export function filterGroupForCategory(category) {
  if (category === 'Mow') return 'Mow'
  if (category === 'Seed') return 'Seed'
  if (TREATMENT_CATEGORIES.includes(category)) return 'Treatment'
  return 'Notes'
}

export const BENTGRASS_CATEGORY = 'Bentgrass treatment'

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
