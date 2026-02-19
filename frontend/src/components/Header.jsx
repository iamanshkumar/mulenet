import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Activity, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useAnalysis } from '../context/AnalysisContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/analyze', label: 'Analyze' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/rings', label: 'Rings' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/history', label: 'History' },
  { to: '/how-it-works', label: 'How It Works' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { result } = useAnalysis()
  const { dark, toggle } = useTheme()
  const location = useLocation()

  if (location.pathname === '/') return null

  return (
    <header className="sticky top-0 z-50 header-bg">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #e63946, #b91c1c)' }}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary">MuleNet</h1>
            <p className="text-[10px] font-medium tracking-widest uppercase text-muted">Financial Forensics</p>
          </div>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-3">
          {result ? (
            <span className="badge-green text-xs">
              <span className="w-2 h-2 rounded-full inline-block mr-1.5 animate-pulse" style={{ background: 'var(--color-success)' }} />
              Analysis Active
            </span>
          ) : (
            <span className="badge-blue text-xs">Ready</span>
          )}

          {/* Theme Toggle */}
          <button onClick={toggle}
            className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
            style={{ background: 'var(--color-panel-hover)', border: '1px solid var(--color-panel-border)' }}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? (
              <Sun className="w-4 h-4 transition-transform duration-300" style={{ color: '#fbbf24' }} />
            ) : (
              <Moon className="w-4 h-4 transition-transform duration-300" style={{ color: '#6366f1' }} />
            )}
          </button>
        </div>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggle} className="p-2 rounded-md"
            style={{ color: 'var(--color-text-secondary)' }}>
            {dark ? <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} /> : <Moon className="w-4 h-4" style={{ color: '#6366f1' }} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-md"
            style={{ color: 'var(--color-text-secondary)' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-6 py-4 space-y-1" style={{ background: 'var(--color-panel)', borderTop: '1px solid var(--color-panel-border)' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block py-2 px-3 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-[var(--color-accent)] bg-[rgba(230,57,70,0.1)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`
              }>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}