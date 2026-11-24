import { describe, expect, it } from 'vitest'
import { LOCALES } from './i18n'
import { PAGE_PATTERNS, alternatePath, isPrivatePage, localeFromPath, matchRoute, pathFor, type PageId, type RouteParams } from './routes'

describe('matchRoute', () => {
  it('dil önekli sabit ve parametreli yolları eşler', () => {
    expect(matchRoute('/tr/')).toEqual({ lang: 'tr', page: 'home', params: {} })
    expect(matchRoute('/en')).toEqual({ lang: 'en', page: 'home', params: {} })
    expect(matchRoute('/tr/about')).toEqual({ lang: 'tr', page: 'about', params: {} })
    expect(matchRoute('/en/projects/rope-connect')).toEqual({ lang: 'en', page: 'project', params: { slug: 'rope-connect' } })
    expect(matchRoute('/tr/private/projects/nda-1')).toEqual({ lang: 'tr', page: 'privateProject', params: { slug: 'nda-1' } })
  })

  it('sondaki / önemsenmez', () => {
    expect(matchRoute('/tr/blog/')).toEqual(matchRoute('/tr/blog'))
  })

  it('dil öneki yoksa, dil bilinmiyorsa ya da yol bilinmiyorsa null', () => {
    expect(matchRoute('/')).toBeNull()
    expect(matchRoute('/about')).toBeNull()
    expect(matchRoute('/de/about')).toBeNull()
    expect(matchRoute('/tr/unknown')).toBeNull()
    expect(matchRoute('/tr/projects/a/b')).toBeNull()
  })

  it('geçersiz slug eşleşmez (büyük harf, boşluk, çift tire, kaçış)', () => {
    for (const slug of ['Rope', 'a%20b', 'a--b', '-a', '..']) expect(matchRoute(`/tr/projects/${slug}`), slug).toBeNull()
  })
})

describe('pathFor', () => {
  it('kanonik yol üretir', () => {
    expect(pathFor('home', 'tr')).toBe('/tr/')
    expect(pathFor('contact', 'en')).toBe('/en/contact')
    expect(pathFor('post', 'tr', { slug: 'ilk-yazi' })).toBe('/tr/blog/ilk-yazi')
  })

  it('eksik ya da geçersiz parametre hata fırlatır', () => {
    expect(() => pathFor('project', 'tr')).toThrow()
    expect(() => pathFor('project', 'tr', { slug: '../admin' })).toThrow()
  })

  it('her sayfa × her dil için matchRoute(pathFor(...)) gidiş-dönüşü', () => {
    for (const page of Object.keys(PAGE_PATTERNS) as PageId[]) {
      const params: RouteParams = PAGE_PATTERNS[page].includes(':slug') ? { slug: 'ornek-1' } : {}
      for (const lang of LOCALES) expect(matchRoute(pathFor(page, lang, params)), `${lang} ${page}`).toEqual({ lang, page, params })
    }
  })
})

describe('yardımcılar', () => {
  it('alternatePath aynı sayfanın diğer dil yolunu verir', () => {
    expect(alternatePath(matchRoute('/tr/projects/foo')!, 'en')).toBe('/en/projects/foo')
  })

  it('localeFromPath', () => {
    expect(localeFromPath('/en/whatever/else')).toBe('en')
    expect(localeFromPath('/xx/about')).toBeNull()
  })

  it('özel alan sayfaları işaretli', () => {
    expect(isPrivatePage('private')).toBe(true)
    expect(isPrivatePage('privateDownloads')).toBe(true)
    expect(isPrivatePage('projects')).toBe(false)
  })
})
