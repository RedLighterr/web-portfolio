import { describe, expect, it } from 'vitest'
import en from '../i18n/en.json'
import tr from '../i18n/tr.json'
import { DEFAULT_LOCALE, preferredLocale, translate } from './i18n'

const isAdminKey = (key: string) => key.startsWith('admin.')

describe('çeviri sözlükleri', () => {
  it('tr ve en aynı anahtarları taşır (yalnızca TR olan admin.* hariç)', () => {
    const trKeys = Object.keys(tr).filter((k) => !isAdminKey(k)).sort()
    const enKeys = Object.keys(en).filter((k) => !isAdminKey(k)).sort()
    expect(enKeys).toEqual(trKeys)
  })

  it('en.json tr.json’da olmayan anahtar taşımaz', () => {
    expect(Object.keys(en).filter((k) => !(k in tr))).toEqual([])
  })

  it('boş çeviri yok', () => {
    for (const [locale, dict] of Object.entries({ tr, en })) {
      for (const [key, value] of Object.entries(dict)) expect(value.trim(), `${locale}: ${key}`).not.toBe('')
    }
  })

  it('iki dilde aynı yer tutucular kullanılır', () => {
    const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const [key, value] of Object.entries(en)) {
      expect(placeholders(value), key).toEqual(placeholders(tr[key as keyof typeof tr]))
    }
  })
})

describe('translate', () => {
  it('dile göre metin döner ve yer tutucuları doldurur', () => {
    expect(translate('tr', 'nav.about')).toBe('Hakkımda')
    expect(translate('en', 'nav.about')).toBe('About')
    expect(translate('en', 'page.project', { slug: 'rope-connect' })).toBe('Project: rope-connect')
  })

  it('verilmeyen yer tutucu görünür kalır', () => {
    expect(translate('tr', 'page.project', {})).toBe('Proje: {slug}')
  })
})

describe('preferredLocale (`/` yönlendirmesi; nginx map ile aynı mantık)', () => {
  it('önce lang cookie’si', () => {
    expect(preferredLocale('a=1; lang=tr; b=2', ['en-US'])).toBe('tr')
    expect(preferredLocale('lang=en', ['tr-TR'])).toBe('en')
  })

  it('geçersiz cookie yok sayılır, tarayıcının ilk dili Türkçeyse tr', () => {
    expect(preferredLocale('lang=de', ['tr-TR', 'en'])).toBe('tr')
    expect(preferredLocale('', ['TR'])).toBe('tr')
  })

  it('aksi halde varsayılan (en)', () => {
    expect(DEFAULT_LOCALE).toBe('en')
    expect(preferredLocale('', ['de-DE', 'tr'])).toBe('en')
    expect(preferredLocale('', [])).toBe('en')
  })
})
