import { useEffect, useState } from 'react'
import { useT } from '../lib/i18n'
import { getStoredTheme, getSystemTheme, storeTheme, type Theme } from '../lib/theme'
import './ThemeToggle.css'

/**
 * Icon-only light/dark switch. Sets document.documentElement.dataset.theme,
 * which theme.css's [data-theme] overrides already key off — see THEME.md.
 */
export function ThemeToggle() {
  const t = useT()
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    storeTheme(theme)
  }, [theme])

  const toggle = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="12" y1="1.5" x2="12" y2="4.5" />
            <line x1="12" y1="19.5" x2="12" y2="22.5" />
            <line x1="1.5" y1="12" x2="4.5" y2="12" />
            <line x1="19.5" y1="12" x2="22.5" y2="12" />
            <line x1="4.4" y1="4.4" x2="6.5" y2="6.5" />
            <line x1="17.5" y1="17.5" x2="19.6" y2="19.6" />
            <line x1="4.4" y1="19.6" x2="6.5" y2="17.5" />
            <line x1="17.5" y1="6.5" x2="19.6" y2="4.4" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M20.5 14.6a8.5 8.5 0 0 1-11-11 8.5 8.5 0 1 0 11 11Z" />
        </svg>
      )}
    </button>
  )
}
