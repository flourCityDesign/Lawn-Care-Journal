import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './screens/Home'
import Weather from './screens/Weather'
import Log from './screens/Log'
import LogEntryForm from './screens/LogEntryForm'
import LogEntryDetail from './screens/LogEntryDetail'
import Zones from './screens/Zones'
import ZoneForm from './screens/ZoneForm'
import ZoneDetail from './screens/ZoneDetail'
import Plan from './screens/Plan'
import Settings from './screens/Settings'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/log" element={<Log />} />
        <Route path="/log/new" element={<LogEntryForm />} />
        <Route path="/log/:id" element={<LogEntryDetail />} />
        <Route path="/log/:id/edit" element={<LogEntryForm />} />
        <Route path="/yards" element={<Zones />} />
        <Route path="/yards/new" element={<ZoneForm />} />
        <Route path="/yards/:id" element={<ZoneDetail />} />
        <Route path="/yards/:id/edit" element={<ZoneForm />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <BottomNav />
    </>
  )
}
