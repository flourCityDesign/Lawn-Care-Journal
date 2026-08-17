import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { readKey, writeKey, STORAGE_KEYS } from './storage'
import { makeId } from './id'
import { DEFAULT_SETTINGS, ALL_ZONES_ID } from './constants'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [zones, setZones] = useState(() => readKey(STORAGE_KEYS.zones, []))
  const [applications, setApplications] = useState(() => readKey(STORAGE_KEYS.applications, []))
  const [photos, setPhotos] = useState(() => readKey(STORAGE_KEYS.photos, []))
  const [planTasks, setPlanTasks] = useState(() => readKey(STORAGE_KEYS.planTasks, []))
  const [programs, setPrograms] = useState(() => readKey(STORAGE_KEYS.programs, []))
  const [programTasks, setProgramTasks] = useState(() => readKey(STORAGE_KEYS.programTasks, []))
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...readKey(STORAGE_KEYS.settings, {}) }))
  const [weatherCache, setWeatherCache] = useState(() => readKey(STORAGE_KEYS.weatherCache, null))

  useEffect(() => writeKey(STORAGE_KEYS.zones, zones), [zones])
  useEffect(() => writeKey(STORAGE_KEYS.applications, applications), [applications])
  useEffect(() => writeKey(STORAGE_KEYS.photos, photos), [photos])
  useEffect(() => writeKey(STORAGE_KEYS.planTasks, planTasks), [planTasks])
  useEffect(() => writeKey(STORAGE_KEYS.programs, programs), [programs])
  useEffect(() => writeKey(STORAGE_KEYS.programTasks, programTasks), [programTasks])
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
      zoneIds: [ALL_ZONES_ID],
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
        .flatMap((a) => (a.products?.length ? a.products.map((p) => p.name) : [a.productName]))
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
  const addPlanTask = useCallback((task) => {
    const record = {
      id: makeId(),
      year: new Date().getFullYear(),
      month: 1,
      timing: '',
      category: 'Other',
      description: '',
      cutHeight: '',
      productType: null,
      products: null,
      completed: false,
      zoneIds: [ALL_ZONES_ID],
      ...task,
    }
    setPlanTasks((prev) => [...prev, record])
    return record
  }, [])
  const updatePlanTask = useCallback((id, patch) => {
    setPlanTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])
  const deletePlanTask = useCallback((id) => {
    setPlanTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])
  const deletePlanTasks = useCallback((ids) => {
    setPlanTasks((prev) => prev.filter((t) => !ids.includes(t.id)))
  }, [])

  // ---- Programs (Program Builder drafts) ----
  const addProgram = useCallback((program) => {
    const record = { id: makeId(), name: '', createdAt: new Date().toISOString(), ...program }
    setPrograms((prev) => [...prev, record])
    return record
  }, [])
  const updateProgram = useCallback((id, patch) => {
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])
  const deleteProgram = useCallback((id) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id))
    setProgramTasks((prev) => prev.filter((t) => t.programId !== id))
  }, [])

  const addProgramTask = useCallback((task) => {
    const record = {
      id: makeId(),
      programId: null,
      month: 1,
      timing: '',
      category: 'Other',
      description: '',
      cutHeight: '',
      productType: null,
      products: null,
      ...task,
    }
    setProgramTasks((prev) => [...prev, record])
    return record
  }, [])
  const updateProgramTask = useCallback((id, patch) => {
    setProgramTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])
  const deleteProgramTask = useCallback((id) => {
    setProgramTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Commits a draft program task into a real plan task for the given year
  // and zone scope. The draft stays put in the program - Program Builder is
  // a reusable template, not a one-time staging list, so a task can be
  // committed again next year (or to another yard) without redrafting it.
  const commitProgramTask = useCallback(
    (programTaskId, { year, zoneIds }) => {
      const task = programTasks.find((t) => t.id === programTaskId)
      if (!task) return null
      return addPlanTask({
        year,
        month: task.month,
        timing: task.timing,
        category: task.category,
        description: task.description,
        cutHeight: task.cutHeight,
        productType: task.productType,
        products: task.products,
        zoneIds,
      })
    },
    [programTasks, addPlanTask]
  )

  const commitAllProgramTasks = useCallback(
    (programId, { year, zoneIds }) => {
      const tasks = programTasks.filter((t) => t.programId === programId)
      tasks.forEach((task) => {
        addPlanTask({
          year,
          month: task.month,
          timing: task.timing,
          category: task.category,
          description: task.description,
          cutHeight: task.cutHeight,
          productType: task.productType,
          products: task.products,
          zoneIds,
        })
      })
      return tasks.length
    },
    [programTasks, addPlanTask]
  )

  // ---- Settings ----
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  // ---- Backup ----
  const exportAll = useCallback(() => {
    return {
      zones,
      applications,
      photos,
      planTasks,
      programs,
      programTasks,
      settings,
      exportedAt: new Date().toISOString(),
      version: 1,
    }
  }, [zones, applications, photos, planTasks, programs, programTasks, settings])

  const importAll = useCallback((data) => {
    if (!data || typeof data !== 'object') throw new Error('Invalid backup file')
    if (Array.isArray(data.zones)) setZones(data.zones)
    if (Array.isArray(data.applications)) setApplications(data.applications)
    if (Array.isArray(data.photos)) setPhotos(data.photos)
    if (Array.isArray(data.planTasks)) setPlanTasks(data.planTasks)
    if (Array.isArray(data.programs)) setPrograms(data.programs)
    if (Array.isArray(data.programTasks)) setProgramTasks(data.programTasks)
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
      addPlanTask,
      updatePlanTask,
      deletePlanTask,
      deletePlanTasks,
      programs,
      addProgram,
      updateProgram,
      deleteProgram,
      programTasks,
      addProgramTask,
      updateProgramTask,
      deleteProgramTask,
      commitProgramTask,
      commitAllProgramTasks,
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
      addPlanTask,
      updatePlanTask,
      deletePlanTask,
      deletePlanTasks,
      programs,
      addProgram,
      updateProgram,
      deleteProgram,
      programTasks,
      addProgramTask,
      updateProgramTask,
      deleteProgramTask,
      commitProgramTask,
      commitAllProgramTasks,
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
