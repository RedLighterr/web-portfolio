import { useEffect } from 'react'
import { SkeletonShell } from './components/SkeletonShell'
import { DEFAULT_LOCALE, LocaleContext, preferredLocale } from './lib/i18n'
import { navigateTo, useLocation } from './lib/location'
import { localeFromPath, matchRoute, pathFor } from './lib/routes'
import { NotFoundPage } from './pages/NotFoundPage'
import { SkeletonPage } from './pages/SkeletonPage'

function App() {
  const { pathname } = useLocation()
  const match = matchRoute(pathname)
  const isRoot = pathname === '/'
  const lang = match?.lang ?? localeFromPath(pathname) ?? DEFAULT_LOCALE

  // `/` → tercih edilen dil. Prod'da bunu nginx yapar (istek sunucuya gelmeden); dev sunucusunda burada.
  useEffect(() => {
    if (isRoot) navigateTo(pathFor('home', preferredLocale(document.cookie, navigator.languages)), true)
  }, [isRoot])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  if (isRoot) return null

  return (
    <LocaleContext value={lang}>
      <SkeletonShell match={match}>{match ? <SkeletonPage match={match} /> : <NotFoundPage />}</SkeletonShell>
    </LocaleContext>
  )
}

export default App
