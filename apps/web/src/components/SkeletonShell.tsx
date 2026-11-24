import type { ReactNode } from 'react'
import { useLocale, useT } from '../lib/i18n'
import { pathFor, type PageId, type RouteMatch } from '../lib/routes'
import { LanguageSwitch } from './LanguageSwitch'
import { Link } from './Link'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import './SkeletonShell.css'

// GEÇİCİ: tasarım onaylanmadan önceki teknik kabuk (rota, dil ve tema çalışıyor mu görmek için). Faz 1'de onaylanan
// tasarımla değiştirilecek — bkz. CLAUDE.md "Tasarım Süreci".

const NAV_PAGES = ['home', 'about', 'projects', 'blog', 'contact'] as const satisfies readonly PageId[]

interface SkeletonShellProps {
  match: RouteMatch | null
  children: ReactNode
}

export function SkeletonShell({ match, children }: SkeletonShellProps) {
  const t = useT()
  const lang = useLocale()
  return (
    <>
      <header className="skeleton-header">
        <Link href={pathFor('home', lang)} className="skeleton-brand">
          <Logo />
          <span>{t('site.name')}</span>
        </Link>
        <nav className="skeleton-nav" aria-label={t('nav.label')}>
          {NAV_PAGES.map((page) => (
            <Link key={page} href={pathFor(page, lang)} aria-current={match?.page === page ? 'page' : undefined}>
              {t(`nav.${page}`)}
            </Link>
          ))}
        </nav>
        <div className="skeleton-actions">
          <LanguageSwitch match={match} className="skeleton-lang" />
          <ThemeToggle />
        </div>
      </header>
      <main className="skeleton-main">{children}</main>
    </>
  )
}
