import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './index.css'
import { getToken } from './lib/api'
import AppShell from './components/common/AppShell'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Reading from './pages/Reading'
import Fitness from './pages/Fitness'
import Dev from './pages/Dev'

function RequireAuth() {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Overview />} />
            <Route path="/reading" element={<Reading />} />
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/dev" element={<Dev />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
