import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: '홈' },
  { to: '/reading', label: '독서' },
  { to: '/fitness', label: '운동' },
  { to: '/dev', label: '개발' },
]

export default function AppShell() {
  return (
    <div className="shell">
      <header className="shell-header">
        <NavLink to="/" className="brand">
          gowoobro
        </NavLink>
        <nav className="nav">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
