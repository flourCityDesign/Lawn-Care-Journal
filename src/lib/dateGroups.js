// Groups a date-sorted (any order) list of records into month buckets,
// preserving each bucket's relative order and ordering buckets by their
// first-seen record — so pass records pre-sorted newest-first to get
// newest-month-first sections.
export function groupByMonth(records, dateKey = 'date') {
  const groups = []
  let current = null
  for (const record of records) {
    const d = new Date(record[dateKey])
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!current || current.key !== key) {
      current = { key, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), items: [] }
      groups.push(current)
    }
    current.items.push(record)
  }
  return groups
}
