import { createContext, useCallback, useContext } from 'react'
import en from '../i18n/en.json'
import tr from '../i18n/tr.json'

// Arayüz metinleri (bkz. docs/MIMARI.md §5). Dil rota önekinden gelir; component'ler metni `useT()` ile okur,
// sabit metin yazmaz. Anahtar seti tr.json'dan türetilir: olmayan anahtar derleme hatası.

export const LOCALES = ['tr', 'en'] as const
export type Locale = (typeof LOCALES)[number]
/** Dil bilgisi olmayan ziyaretçi ve botlar için — nginx'teki `/` yönlendirmesiyle aynı (docs/MIMARI.md §3). */
export const DEFAULT_LOCALE: Locale = 'en'
/** Dil seçicinin yazdığı, `/` yönlendirmesinin (nginx; dev'de App) okuduğu cookie. Sır değil. */
export const LANG_COOKIE = 'lang'

export type MessageKey = keyof typeof tr
export type MessageVars = Record<string, string | number>

// en.json, tr.json'daki her anahtarı taşımak zorunda (yalnızca TR olan admin arayüzü `admin.*` hariç):
// eksik anahtar burada derleme hatası verir, fazlası i18n.test.ts'te yakalanır.
type RequiredKey = Exclude<MessageKey, `admin.${string}`>
const enMessages: Record<RequiredKey, string> & Partial<Record<MessageKey, string>> = en

const dictionaries: Record<Locale, Partial<Record<MessageKey, string>>> = { tr, en: enMessages }

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value)
}

/** `{ad}` yer tutucularını doldurur; verilmeyen yer tutucu olduğu gibi kalır (eksik veri görünür olsun). */
export function translate(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  const message = dictionaries[locale][key] ?? tr[key]
  if (!vars) return message
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) => (name in vars ? String(vars[name]) : placeholder))
}

/** `/` için dil tercihi: önce `lang` cookie'si, sonra tarayıcının ilk dili (Türkçe → tr), yoksa varsayılan. */
export function preferredLocale(cookie: string, languages: readonly string[]): Locale {
  const fromCookie = new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=([^;]*)`).exec(cookie)?.[1]
  if (isLocale(fromCookie)) return fromCookie
  return languages[0]?.toLowerCase().startsWith('tr') ? 'tr' : DEFAULT_LOCALE
}

export function rememberLocale(locale: Locale) {
  document.cookie = `${LANG_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

export function useT() {
  const locale = useLocale()
  return useCallback((key: MessageKey, vars?: MessageVars) => translate(locale, key, vars), [locale])
}
