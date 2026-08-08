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

export function filterGroupForCategory(category) {
  if (category === 'Mow') return 'Mow'
  if (category === 'Seed') return 'Seed'
  if (TREATMENT_CATEGORIES.includes(category)) return 'Treatment'
  return 'Notes'
}

export const BENTGRASS_CATEGORY = 'Bentgrass treatment'

export const ALL_ZONES_ID = 'all'
export const ALL_ZONES_LABEL = 'Whole Lawn (All Zones)'

// A Whole Lawn application covers every zone, so it should show up
// whenever viewing a specific zone's history/activity, not just "All".
export function appliesToZone(app, zoneId) {
  return app.zoneId === zoneId || app.zoneId === ALL_ZONES_ID
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
