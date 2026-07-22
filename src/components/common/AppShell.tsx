import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { getTheme, nextTheme, setTheme, THEME_ICONS, THEME_LABELS, type ThemeMode } from '../../lib/theme'

const tabs = [
  { to: '/', label: '홈' },
  { to: '/reading', label: '독서' },
  { to: '/fitness', label: '운동' },
  { to: '/dev', label: '개발' },
]

export default function AppShell() {
  const [theme, setThemeState] = useState<ThemeMode>(getTheme)

  function cycleTheme() {
    const next = nextTheme(theme)
    setTheme(next)
    setThemeState(next)
  }

  return (
    <div className="shell">
      <header className="shell-header">
        <NavLink to="/" className="brand">
          gowoobro
        </NavLink>
        <div className="header-right">
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
          <button
            className="theme-toggle"
            onClick={cycleTheme}
            title={`테마: ${THEME_LABELS[theme]} (클릭해서 변경)`}
            aria-label={`테마: ${THEME_LABELS[theme]}`}
          >
            {THEME_ICONS[theme]}
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
