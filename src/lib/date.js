// Parses a "YYYY-MM-DD" calendar-date string as local midnight. Passing
// such a string straight to `new Date()` parses it as UTC midnight, which
// in any negative-UTC-offset timezone (all of the Americas) displays as
// the previous calendar day — an entry logged "today" would show as
// "Yesterday". Numeric y/m/d args to the Date constructor are local time,
// which is what every date-only field in this app actually means.
export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
