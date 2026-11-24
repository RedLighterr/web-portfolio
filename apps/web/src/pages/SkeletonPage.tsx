import { useEffect } from 'react'
import { useT } from '../lib/i18n'
import { isPrivatePage, type RouteMatch } from '../lib/routes'

// GEÇİCİ: her rota için yer tutucu. Gerçek sayfalar Faz 2'de (tasarım onayından sonra) bunun yerini alır.
// Özel alan rotalarında içerik yok — yalnızca giriş gerektiği bilgisi (CLAUDE.md Erişim Kuralı).
export function SkeletonPage({ match }: { match: RouteMatch }) {
  const t = useT()
  const title = t(`page.${match.page}`, match.params)

  useEffect(() => {
    document.title = `${title} · ${t('site.name')}`
  }, [title, t])

  return (
    <>
      <h1>{title}</h1>
      <p>{isPrivatePage(match.page) ? t('private.loginRequired') : t('skeleton.notice')}</p>
    </>
  )
}
