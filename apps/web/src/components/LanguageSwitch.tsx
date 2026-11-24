import { rememberLocale, useLocale, useT } from '../lib/i18n'
import { alternatePath, pathFor, type RouteMatch } from '../lib/routes'
import { Link } from './Link'

interface LanguageSwitchProps {
  /** Geçerli rota; yoksa (404) diğer dilin ana sayfasına gider. */
  match: RouteMatch | null
  className?: string
}

/** Aynı sayfanın diğer dildeki sürümüne geçer ve seçimi `lang` cookie'sine yazar (`/` yönlendirmesi okur). */
export function LanguageSwitch({ match, className }: LanguageSwitchProps) {
  const t = useT()
  const other = useLocale() === 'tr' ? 'en' : 'tr'
  const href = match ? alternatePath(match, other) : pathFor('home', other)
  return (
    <Link href={href} hrefLang={other} lang={other} className={className} aria-label={t('lang.switchLabel')} onClick={() => rememberLocale(other)}>
      {t('lang.other')}
    </Link>
  )
}
