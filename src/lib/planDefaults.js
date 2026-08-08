import { makeId } from './id'

// A reasonable starting-point calendar for a cool-season (tall fescue) lawn
// with a bentgrass renovation in progress. Fully editable per year after creation.
const TEMPLATE = [
  { month: 3, category: 'Pre-emergent', description: 'Apply crabgrass pre-emergent (soil temp trending toward 50°F)' },
  { month: 4, category: 'Fertilizer', description: 'Light spring fertilizer application' },
  { month: 4, category: 'Bentgrass treatment', description: 'Begin mesotrione applications on bentgrass-affected zones' },
  { month: 5, category: 'Herbicide', description: 'Spot-treat broadleaf weeds' },
  { month: 5, category: 'Bentgrass treatment', description: 'Follow-up mesotrione application (per label spacing)' },
  { month: 6, category: 'Other', description: 'Raise mowing height for summer heat' },
  { month: 7, category: 'Other', description: 'Deep, infrequent watering — 1-1.5" per week' },
  { month: 8, category: 'Other', description: 'Soil test and plan fall renovation' },
  { month: 9, category: 'Seed', description: 'Core aerate and overseed thin/bare areas' },
  { month: 9, category: 'Fertilizer', description: 'Fall starter fertilizer application' },
  { month: 10, category: 'Fertilizer', description: 'Fall fertilizer round 2' },
  { month: 11, category: 'Fertilizer', description: 'Apply winterizer fertilizer' },
  { month: 11, category: 'Other', description: 'Final mow of the season' },
]

export function buildDefaultPlanTasks(year) {
  return TEMPLATE.map((t) => ({
    id: makeId(),
    year,
    month: t.month,
    category: t.category,
    description: t.description,
    completed: false,
    linkedApplicationId: null,
  }))
}
