import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CheckIn from './pages/CheckIn'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CheckIn />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
