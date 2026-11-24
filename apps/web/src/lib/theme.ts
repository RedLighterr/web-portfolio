// Tema tercihinin localStorage anahtarı — tek kaynak. `public/theme-init.js` (ilk boyamadan önce temayı uygular,
// modül sistemi dışında olduğu için import edemez) aynı değeri yazar; theme.test.ts ikisinin aynı olduğunu denetler.
export const THEME_STORAGE_KEY = 'theme'

export type Theme = 'light' | 'dark'

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private mode / blocked storage — theme just won't persist.
  }
}
