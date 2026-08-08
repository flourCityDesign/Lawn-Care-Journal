import { makeId } from './id'

// Personal TTTF renovation program with a bentgrass control component.
// Fully editable per year after creation (add/edit/delete on the Plan tab).
const TEMPLATE = [
  {
    month: 3,
    category: 'Pre-emergent',
    description:
      'Prodiamine 65 WDG — spring pre-emergent as soil temps approach ~50-55°F. Rate per annual prodiamine budget/label. Water in. Targets crabgrass/summer annual weeds.',
  },
  {
    month: 4,
    category: 'Fertilizer',
    description:
      'High-N, low-K fertilizer (favor ~30-0-0 or 32-0-4, soil K already high) — target 0.5 lb N/1,000 sqft (~2.5 lb total). Support spring growth without overdoing it.',
  },
  {
    month: 4,
    category: 'Other',
    description:
      'RGS (3 oz/1,000, 15 oz total) + Humic12 (3-6 oz/1,000, 15-30 oz total), tank mixed. Water into soil afterward.',
  },
  {
    month: 5,
    category: 'Herbicide',
    description: 'Broadleaf weed control — spot spray only as needed, avoid unnecessary blanket applications.',
  },
  {
    month: 5,
    category: 'Fertilizer',
    description:
      'Milorganite — ~1/2 label rate, light slow-release early-summer feeding. Calibrate spreader to actual product, not just a dial setting.',
  },
  {
    month: 6,
    category: 'Other',
    description: 'GrubEx at label rate, water in thoroughly. One preventative application for the season.',
  },
  {
    month: 6,
    category: 'Other',
    description: 'RGS (3 oz/1,000) + Humic12 (3-6 oz/1,000) — optional second soil-conditioning application.',
  },
  {
    month: 7,
    category: 'Other',
    description:
      'Summer maintenance: minimal fertilizer/herbicide inputs, mow TTTF high (~4"), deep infrequent irrigation. Watch for disease, drought stress, Poa die-off, and bentgrass.',
  },
  {
    month: 7,
    category: 'Fertilizer',
    description: 'Milorganite — ~1/2 label rate, optional gentle summer feeding if turf isn\'t severely heat/drought stressed.',
  },
  {
    month: 8,
    category: 'Bentgrass treatment',
    description: 'Mesotrione/Torocity App #1 — blanket application to identify and suppress scattered bentgrass.',
  },
  {
    month: 8,
    category: 'Bentgrass treatment',
    description:
      'Mesotrione/Torocity App #2 (~10-14 days after App #1) — spot treat whitened/confirmed bentgrass. Use Southern Ag surfactant per label.',
  },
  {
    month: 8,
    category: 'Bentgrass treatment',
    description:
      'Mesotrione/Torocity App #3 (~10-14 days after App #2, if needed and label allows) — spot treat remaining bentgrass. Once largely eliminated in future years, switch to spot-treat only.',
  },
  {
    month: 8,
    category: 'Mow',
    description: 'Mow to ~3" and bag clippings — opens the canopy ahead of topdressing.',
  },
  {
    month: 8,
    category: 'Other',
    description:
      'Spot leveling with Vermi-Green Topsoil/Compost Blend — correct meaningful low spots and winter-heave depressions. Don\'t bury existing TTTF crowns.',
  },
  {
    month: 8,
    category: 'Other',
    description:
      'Vermi-Green Organic Compost topdress, ~1/4" (~4 cu yd for 5,000 sqft). Spread evenly, work in with leveling rake/drag.',
  },
  {
    month: 8,
    category: 'Pre-emergent',
    description:
      'Prodiamine 65 WDG — critical fall app for Poa annua prevention as soil temps fall. Check rate against spring application to stay under the annual prodiamine max. Water in — prioritize timing over the exact compost date.',
  },
  {
    month: 9,
    category: 'Fertilizer',
    description:
      'High-N, low-K fertilizer — target 0.5-0.75 lb N/1,000 sqft (~2.5-3.75 lb total) for fall recovery and TTTF tillering/density.',
  },
  {
    month: 9,
    category: 'Fertilizer',
    description:
      'High-N, low-K fertilizer — second major fall feeding, target 0.5-0.75 lb N/1,000 sqft (~2.5-3.75 lb total).',
  },
  {
    month: 10,
    category: 'Other',
    description: 'RGS (3 oz/1,000) + Humic12 (3-6 oz/1,000) — optional final application of the year.',
  },
  {
    month: 10,
    category: 'Fertilizer',
    description:
      'Late-fall nitrogen — up to ~0.5 lb N/1,000 sqft with high-N/low-K fertilizer, if appropriate based on prior fall apps and turf growth.',
  },
  {
    month: 10,
    category: 'Mow',
    description: 'Final mowing — gradually lower from 4" toward ~2.5-3" for winter. Don\'t scalp. Keep fallen leaves from matting on turf.',
  },
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
