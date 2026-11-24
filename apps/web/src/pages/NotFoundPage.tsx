import { useEffect } from 'react'
import { Link } from '../components/Link'
import { useLocale, useT } from '../lib/i18n'
import { pathFor } from '../lib/routes'

export function NotFoundPage() {
  const t = useT()
  const lang = useLocale()

  useEffect(() => {
    document.title = `${t('notFound.title')} · ${t('site.name')}`
  }, [t])

  return (
    <>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <p>
        <Link href={pathFor('home', lang)}>{t('notFound.home')}</Link>
      </p>
    </>
  )
}
