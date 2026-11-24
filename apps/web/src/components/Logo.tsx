import { useT } from '../lib/i18n'
import './Logo.css'

interface LogoProps {
  className?: string
}

/**
 * Theme-adaptive brand mark. Source swaps via the --logo-src token in
 * theme.css (light/dark artwork, not a CSS filter) — see docs/THEME.md.
 * Artwork is a provisional monogram until the design phase.
 */
export function Logo({ className }: LogoProps) {
  const t = useT()
  return <span className={className ? `logo ${className}` : 'logo'} role="img" aria-label={t('site.name')} />
}
