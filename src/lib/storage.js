const PREFIX = 'lcj:'

export function readKey(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch (err) {
    console.error(`Failed to read ${key} from storage`, err)
    return fallback
  }
}

export function writeKey(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (err) {
    console.error(`Failed to write ${key} to storage`, err)
    throw err
  }
}

export const STORAGE_KEYS = {
  zones: 'zones',
  applications: 'applications',
  photos: 'photos',
  planTasks: 'planTasks',
  programs: 'programs',
  programTasks: 'programTasks',
  settings: 'settings',
  weatherCache: 'weatherCache',
}
