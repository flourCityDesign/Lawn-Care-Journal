import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './screens/Home'
import Weather from './screens/Weather'
import SoilTempHistory from './screens/SoilTempHistory'
import Log from './screens/Log'
import LogEntryForm from './screens/LogEntryForm'
import LogEntryDetail from './screens/LogEntryDetail'
import Zones from './screens/Zones'
import ZoneForm from './screens/ZoneForm'
import ZoneDetail from './screens/ZoneDetail'
import Plan from './screens/Plan'
import ProgramBuilder from './screens/ProgramBuilder'
import ProgramDetail from './screens/ProgramDetail'
import ProgramTaskForm from './screens/ProgramTaskForm'
import Settings from './screens/Settings'

export default function App() {
  const location = useLocation()
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/weather/soil-temp" element={<SoilTempHistory />} />
        <Route path="/log" element={<Log />} />
        {/* Both routes render LogEntryForm; without a per-path key React Router
            reuses the same instance across them and leaves stale form state
            (e.g. navigating straight from editing one entry to a new one). */}
        <Route path="/log/new" element={<LogEntryForm key={location.pathname} />} />
        <Route path="/log/:id" element={<LogEntryDetail />} />
        <Route path="/log/:id/edit" element={<LogEntryForm key={location.pathname} />} />
        <Route path="/yards" element={<Zones />} />
        <Route path="/yards/new" element={<ZoneForm />} />
        <Route path="/yards/:id" element={<ZoneDetail />} />
        <Route path="/yards/:id/edit" element={<ZoneForm />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/plan/builder" element={<ProgramBuilder />} />
        <Route path="/plan/builder/:id" element={<ProgramDetail />} />
        <Route path="/plan/builder/:programId/task/new" element={<ProgramTaskForm key={location.pathname + location.search} />} />
        <Route path="/plan/builder/:programId/task/:taskId/edit" element={<ProgramTaskForm key={location.pathname} />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <BottomNav />
    </>
  )
}
