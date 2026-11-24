import { isLocale, type Locale } from './i18n'

// Sayfa kimliği ↔ URL kalıbı (bkz. docs/MIMARI.md §3, §8). Kalıp, dil önekinden SONRAKİ kısımdır; `:ad` bir
// parametre segmentidir. Saf fonksiyonlar — DOM'a dokunmaz; prerender'da (sunucuda) da aynen çalışır.
export const PAGE_PATTERNS = {
  home: '',
  about: 'about',
  projects: 'projects',
  project: 'projects/:slug',
  blog: 'blog',
  post: 'blog/:slug',
  contact: 'contact',
  private: 'private',
  privateProject: 'private/projects/:slug',
  privateDownloads: 'private/downloads',
} as const

export type PageId = keyof typeof PAGE_PATTERNS
export type RouteParams = Record<string, string>

export interface RouteMatch {
  lang: Locale
  page: PageId
  params: RouteParams
}

/** Özel alan sayfaları: giriş ister, prerender edilmez (bkz. CLAUDE.md Erişim Kuralı). */
export const PRIVATE_PAGES = ['private', 'privateProject', 'privateDownloads'] as const satisfies readonly PageId[]

export function isPrivatePage(page: PageId): boolean {
  return (PRIVATE_PAGES as readonly PageId[]).includes(page)
}

/** Slug: küçük harf, rakam ve tek tire (`unity-puzzle-2`). Büyük harfli yol eşleşmez → 404 (tek kanonik URL). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function segments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

/** `/tr/projects/foo` → `{ lang: 'tr', page: 'project', params: { slug: 'foo' } }`; bilinmeyen yol → `null`. */
export function matchRoute(pathname: string): RouteMatch | null {
  const [lang, ...rest] = segments(pathname)
  if (!isLocale(lang)) return null
  for (const [page, pattern] of Object.entries(PAGE_PATTERNS) as [PageId, string][]) {
    const parts = segments(pattern)
    if (parts.length !== rest.length) continue
    const params: RouteParams = {}
    const matches = parts.every((part, i) => {
      if (!part.startsWith(':')) return part === rest[i]
      if (!SLUG_PATTERN.test(rest[i])) return false
      params[part.slice(1)] = rest[i]
      return true
    })
    if (matches) return { lang, page, params }
  }
  return null
}

/** Kanonik yol: ana sayfa `/{lang}/`, diğerleri sonda `/` olmadan. Eksik/geçersiz parametre programlama hatasıdır. */
export function pathFor(page: PageId, lang: Locale, params: RouteParams = {}): string {
  const path = segments(PAGE_PATTERNS[page])
    .map((part) => {
      if (!part.startsWith(':')) return part
      const value = params[part.slice(1)]
      if (!value || !SLUG_PATTERN.test(value)) throw new Error(`pathFor(${page}): geçersiz '${part.slice(1)}' parametresi`)
      return value
    })
    .join('/')
  return path ? `/${lang}/${path}` : `/${lang}/`
}

/** Aynı sayfanın başka dildeki yolu (dil seçici). */
export function alternatePath(match: RouteMatch, lang: Locale): string {
  return pathFor(match.page, lang, match.params)
}

/** Yolun başındaki dil (404 sayfası da doğru dilde çizilsin); yoksa `null`. */
export function localeFromPath(pathname: string): Locale | null {
  const first = segments(pathname)[0]
  return isLocale(first) ? first : null
}
