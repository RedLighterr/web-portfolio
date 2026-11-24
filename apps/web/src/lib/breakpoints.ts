import { useSyncExternalStore } from 'react'

/**
 * Tek kaynak: kırılma noktaları. CSS `@media` içinde değişken kullanılamadığından aynı sayılar CSS'te de
 * yazılır; `breakpoints.test.ts` tüm .css dosyalarını tarayıp izin verilen setin dışında genişlik eşiği bırakmaz.
 * Başlangıç seti — tasarımda kesinleşir (docs/THEME.md "Breakpoints").
 *
 *   telefon    0 – 639
 *   tablet     640 – 1024
 *   masaüstü   ≥ 1025
 */
export const BREAKPOINTS = {
  PHONE_MAX: 639,
  TABLET_MIN: 640,
  TABLET_MAX: 1024,
  DESKTOP_MIN: 1025,
} as const

/** CSS'te kullanılmasına izin verilen genişlik eşikleri (px). */
export const ALLOWED_MEDIA_WIDTHS: readonly number[] = Object.values(BREAKPOINTS)

export type Breakpoint = 'phone' | 'tablet' | 'desktop'

export const MEDIA = {
  phone: `(max-width: ${BREAKPOINTS.PHONE_MAX}px)`,
  tablet: `(min-width: ${BREAKPOINTS.TABLET_MIN}px) and (max-width: ${BREAKPOINTS.TABLET_MAX}px)`,
  desktop: `(min-width: ${BREAKPOINTS.DESKTOP_MIN}px)`,
} as const

export function breakpointFor(width: number): Breakpoint {
  if (width <= BREAKPOINTS.PHONE_MAX) return 'phone'
  if (width <= BREAKPOINTS.TABLET_MAX) return 'tablet'
  return 'desktop'
}

function currentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop'
  if (window.matchMedia(MEDIA.phone).matches) return 'phone'
  if (window.matchMedia(MEDIA.tablet).matches) return 'tablet'
  return 'desktop'
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const lists = [window.matchMedia(MEDIA.phone), window.matchMedia(MEDIA.tablet)]
  lists.forEach((l) => l.addEventListener('change', onChange))
  return () => lists.forEach((l) => l.removeEventListener('change', onChange))
}

/** Geçerli bölge; CSS ile aynı eşikleri okur, pencere yeniden boyutlanınca güncellenir. */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, currentBreakpoint, () => 'desktop')
}
