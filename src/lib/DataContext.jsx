import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { readKey, writeKey, STORAGE_KEYS } from './storage'
import { makeId } from './id'
import { DEFAULT_SETTINGS, ALL_ZONES_ID } from './constants'
import { buildDefaultPlanTasks } from './planDefaults'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [zones, setZones] = useState(() => readKey(STORAGE_KEYS.zones, []))
  const [applications, setApplications] = useState(() => readKey(STORAGE_KEYS.applications, []))
  const [photos, setPhotos] = useState(() => readKey(STORAGE_KEYS.photos, []))
  const [planTasks, setPlanTasks] = useState(() => readKey(STORAGE_KEYS.planTasks, []))
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...readKey(STORAGE_KEYS.settings, {}) }))
  const [weatherCache, setWeatherCache] = useState(() => readKey(STORAGE_KEYS.weatherCache, null))

  useEffect(() => writeKey(STORAGE_KEYS.zones, zones), [zones])
  useEffect(() => writeKey(STORAGE_KEYS.applications, applications), [applications])
  useEffect(() => writeKey(STORAGE_KEYS.photos, photos), [photos])
  useEffect(() => writeKey(STORAGE_KEYS.planTasks, planTasks), [planTasks])
  useEffect(() => writeKey(STORAGE_KEYS.settings, settings), [settings])
  useEffect(() => {
    if (weatherCache) writeKey(STORAGE_KEYS.weatherCache, weatherCache)
  }, [weatherCache])

  // ---- Zones ----
  const addZone = useCallback((zone) => {
    const record = { id: makeId(), name: '', sqft: '', notes: '', createdAt: new Date().toISOString(), ...zone }
    setZones((prev) => [...prev, record])
    return record
  }, [])
  const updateZone = useCallback((id, patch) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)))
  }, [])
  const deleteZone = useCallback((id) => {
    setZones((prev) => prev.filter((z) => z.id !== id))
  }, [])

  // ---- Applications ----
  const addApplication = useCallback((app) => {
    const record = {
      id: makeId(),
      date: new Date().toISOString().slice(0, 10),
      category: 'Mow',
      productName: '',
      rate: '',
      zoneId: ALL_ZONES_ID,
      notes: '',
      photoIds: [],
      createdAt: new Date().toISOString(),
      ...app,
    }
    setApplications((prev) => [record, ...prev])
    return record
  }, [])
  const updateApplication = useCallback((id, patch) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)))
  }, [])
  const deleteApplication = useCallback((id) => {
    setApplications((prev) => prev.filter((a) => a.id !== id))
    setPhotos((prev) => prev.filter((p) => p.applicationId !== id))
  }, [])

  const productNameHistory = useCallback(
    (category) => {
      const names = applications
        .filter((a) => (category ? a.category === category : true))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((a) => a.productName)
        .filter(Boolean)
      return Array.from(new Set(names))
    },
    [applications]
  )

  // ---- Photos ----
  const addPhoto = useCallback((photo) => {
    const record = { id: makeId(), dataUrl: '', date: new Date().toISOString().slice(0, 10), zoneId: null, applicationId: null, caption: '', ...photo }
    setPhotos((prev) => [record, ...prev])
    return record
  }, [])
  const deletePhoto = useCallback((id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // ---- Plan tasks ----
  const ensureYearPlan = useCallback(
    (year) => {
      setPlanTasks((prev) => {
        if (prev.some((t) => t.year === year)) return prev
        return [...prev, ...buildDefaultPlanTasks(year)]
      })
    },
    []
  )
  const resetYearPlan = useCallback((year) => {
    setPlanTasks((prev) => [...prev.filter((t) => t.year !== year), ...buildDefaultPlanTasks(year)])
  }, [])
  const addPlanTask = useCallback((task) => {
    const record = { id: makeId(), year: new Date().getFullYear(), month: 1, category: 'Other', description: '', completed: false, ...task }
    setPlanTasks((prev) => [...prev, record])
    return record
  }, [])
  const updatePlanTask = useCallback((id, patch) => {
    setPlanTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])
  const deletePlanTask = useCallback((id) => {
    setPlanTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ---- Settings ----
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  // ---- Backup ----
  const exportAll = useCallback(() => {
    return { zones, applications, photos, planTasks, settings, exportedAt: new Date().toISOString(), version: 1 }
  }, [zones, applications, photos, planTasks, settings])

  const importAll = useCallback((data) => {
    if (!data || typeof data !== 'object') throw new Error('Invalid backup file')
    if (Array.isArray(data.zones)) setZones(data.zones)
    if (Array.isArray(data.applications)) setApplications(data.applications)
    if (Array.isArray(data.photos)) setPhotos(data.photos)
    if (Array.isArray(data.planTasks)) setPlanTasks(data.planTasks)
    if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }))
  }, [])

  const value = useMemo(
    () => ({
      zones,
      addZone,
      updateZone,
      deleteZone,
      applications,
      addApplication,
      updateApplication,
      deleteApplication,
      productNameHistory,
      photos,
      addPhoto,
      deletePhoto,
      planTasks,
      ensureYearPlan,
      resetYearPlan,
      addPlanTask,
      updatePlanTask,
      deletePlanTask,
      settings,
      updateSettings,
      weatherCache,
      setWeatherCache,
      exportAll,
      importAll,
    }),
    [
      zones,
      addZone,
      updateZone,
      deleteZone,
      applications,
      addApplication,
      updateApplication,
      deleteApplication,
      productNameHistory,
      photos,
      addPhoto,
      deletePhoto,
      planTasks,
      ensureYearPlan,
      resetYearPlan,
      addPlanTask,
      updatePlanTask,
      deletePlanTask,
      settings,
      updateSettings,
      weatherCache,
      exportAll,
      importAll,
    ]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
