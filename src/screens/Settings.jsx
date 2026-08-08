import { useRef, useState } from 'react'
import { useData } from '../lib/DataContext'
import { Page, PageHeader, Card, CardBody, SectionLabel, Button } from '../components/ui'
import { geocodeZip } from '../lib/weather'

export default function Settings() {
  const { settings, updateSettings, setWeatherCache, exportAll, importAll } = useData()

  const [locationMode, setLocationMode] = useState('zip')
  const [zip, setZip] = useState('')
  const [latInput, setLatInput] = useState(settings.lat ?? '')
  const [lonInput, setLonInput] = useState(settings.lon ?? '')
  const [labelInput, setLabelInput] = useState(settings.locationLabel ?? '')
  const [locationStatus, setLocationStatus] = useState('')
  const [locationSaving, setLocationSaving] = useState(false)

  const [bentgrassCap, setBentgrassCap] = useState(settings.bentgrassSeasonCap)
  const [bentgrassRetreat, setBentgrassRetreat] = useState(settings.bentgrassRetreatDays)
  const [nCap, setNCap] = useState(settings.nitrogenAnnualCap)

  const [importStatus, setImportStatus] = useState('')
  const fileRef = useRef(null)

  async function saveZip(e) {
    e.preventDefault()
    setLocationStatus('')
    setLocationSaving(true)
    try {
      const { lat, lon, label } = await geocodeZip(zip.trim())
      updateSettings({ lat, lon, locationLabel: label, onboarded: true })
      setWeatherCache(null)
      setLocationStatus(`Location set to ${label}.`)
    } catch (err) {
      setLocationStatus(err.message || 'Could not find that zip code.')
    } finally {
      setLocationSaving(false)
    }
  }

  function saveLatLon(e) {
    e.preventDefault()
    const lat = Number(latInput)
    const lon = Number(lonInput)
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setLocationStatus('Enter valid numeric coordinates.')
      return
    }
    updateSettings({ lat, lon, locationLabel: labelInput.trim() || `${lat}, ${lon}`, onboarded: true })
    setWeatherCache(null)
    setLocationStatus('Location saved.')
  }

  function saveThresholds(e) {
    e.preventDefault()
    updateSettings({
      bentgrassSeasonCap: Number(bentgrassCap) || 3,
      bentgrassRetreatDays: Number(bentgrassRetreat) || 21,
      nitrogenAnnualCap: Number(nCap) || 4,
    })
  }

  function handleExport() {
    const data = exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lawn-journal-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        importAll(data)
        setImportStatus('Backup imported successfully.')
      } catch (err) {
        console.error(err)
        setImportStatus('Could not read that file — is it a Lawn Journal backup?')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <Page>
      <PageHeader title="Settings" backTo="/" />

      <SectionLabel icon="map">Location</SectionLabel>
      <Card>
        <CardBody>
          {settings.locationLabel && (
            <div style={{ marginBottom: 12, fontSize: 14 }}>
              Currently set to <strong>{settings.locationLabel}</strong>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              className={`pill${locationMode === 'zip' ? ' pill--active' : ''}`}
              onClick={() => setLocationMode('zip')}
            >
              Zip Code
            </button>
            <button
              type="button"
              className={`pill${locationMode === 'latlon' ? ' pill--active' : ''}`}
              onClick={() => setLocationMode('latlon')}
            >
              Lat / Long
            </button>
          </div>

          {locationMode === 'zip' ? (
            <form onSubmit={saveZip}>
              <div className="field">
                <label htmlFor="zip">US Zip Code</label>
                <input
                  id="zip"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 14618"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </div>
              <Button type="submit" block disabled={locationSaving || !zip.trim()}>
                {locationSaving ? 'Looking up...' : 'Save Location'}
              </Button>
            </form>
          ) : (
            <form onSubmit={saveLatLon}>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="lat">Latitude</label>
                  <input id="lat" type="number" step="any" value={latInput} onChange={(e) => setLatInput(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="lon">Longitude</label>
                  <input id="lon" type="number" step="any" value={lonInput} onChange={(e) => setLonInput(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="label">Label (optional)</label>
                <input id="label" type="text" placeholder="e.g. Home" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} />
              </div>
              <Button type="submit" block>
                Save Location
              </Button>
            </form>
          )}
          {locationStatus && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-dim)' }}>{locationStatus}</div>}
        </CardBody>
      </Card>

      <SectionLabel icon="flask">Treatment Thresholds</SectionLabel>
      <Card>
        <CardBody>
          <form onSubmit={saveThresholds}>
            <div className="field">
              <label htmlFor="bcap">Bentgrass max applications / season</label>
              <input id="bcap" type="number" min="1" value={bentgrassCap} onChange={(e) => setBentgrassCap(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="bretreat">Days before safe to re-treat</label>
              <input id="bretreat" type="number" min="1" value={bentgrassRetreat} onChange={(e) => setBentgrassRetreat(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ncap">Nitrogen annual cap (lbs actual N / 1,000 sqft)</label>
              <input id="ncap" type="number" min="0" step="0.5" value={nCap} onChange={(e) => setNCap(e.target.value)} />
            </div>
            <Button type="submit" block variant="secondary">
              Save Thresholds
            </Button>
          </form>
        </CardBody>
      </Card>

      <SectionLabel icon="download">Backup</SectionLabel>
      <Card>
        <CardBody>
          <div style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 14 }}>
            All data lives only on this device. Export a JSON backup periodically, or before clearing browser data.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" icon="download" onClick={handleExport}>
              Export
            </Button>
            <Button variant="secondary" icon="upload" onClick={() => fileRef.current?.click()}>
              Import
            </Button>
            <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />
          </div>
          {importStatus && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-dim)' }}>{importStatus}</div>}
        </CardBody>
      </Card>
    </Page>
  )
}
