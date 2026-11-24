/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ALLOWED_MEDIA_WIDTHS, BREAKPOINTS, MEDIA, breakpointFor } from './breakpoints'

// Vitest `?raw` ile CSS'i boş döndürür (CSS eklentisi yutar) — bu yüzden diskten okunur.
const srcDir = fileURLToPath(new URL('..', import.meta.url))
const cssFiles: Record<string, string> = {}
for (const rel of readdirSync(srcDir, { recursive: true }) as string[]) {
  const path = String(rel).replaceAll('\\', '/')
  if (path.endsWith('.css')) cssFiles[path] = readFileSync(join(srcDir, path), 'utf8')
}

/** Bir CSS metnindeki her `@media` koşulundan (min|max)-width değerlerini (px) çıkarır. */
function mediaWidths(css: string): number[] {
  const out: number[] = []
  for (const cond of css.matchAll(/@media([^{]*)\{/g)) {
    for (const w of cond[1].matchAll(/(?:min|max)-width\s*:\s*(\d+(?:\.\d+)?)px/g)) out.push(Number(w[1]))
  }
  return out
}

describe('breakpoints', () => {
  it('bölgeler 0..∞ aralığını boşluksuz ve çakışmasız böler', () => {
    expect(BREAKPOINTS.TABLET_MIN).toBe(BREAKPOINTS.PHONE_MAX + 1)
    expect(BREAKPOINTS.DESKTOP_MIN).toBe(BREAKPOINTS.TABLET_MAX + 1)
    const edges: [number, string][] = [
      [0, 'phone'],
      [BREAKPOINTS.PHONE_MAX, 'phone'],
      [BREAKPOINTS.TABLET_MIN, 'tablet'],
      [BREAKPOINTS.TABLET_MAX, 'tablet'],
      [BREAKPOINTS.DESKTOP_MIN, 'desktop'],
      [1920, 'desktop'],
    ]
    for (const [w, zone] of edges) expect(breakpointFor(w), `${w}px`).toBe(zone)
  })

  it('MEDIA sorguları aynı sayılardan üretilir', () => {
    expect(MEDIA.phone).toBe('(max-width: 639px)')
    expect(MEDIA.tablet).toBe('(min-width: 640px) and (max-width: 1024px)')
    expect(MEDIA.desktop).toBe('(min-width: 1025px)')
  })

  it('CSS dosyaları bulundu ve en az bir @media eşiği taranıyor (tarama boş metinle geçmesin)', () => {
    expect(Object.keys(cssFiles).some((p) => p.endsWith('theme.css'))).toBe(true)
    for (const [file, css] of Object.entries(cssFiles)) expect(css.length, file).toBeGreaterThan(0)
    const total = Object.values(cssFiles).reduce((n, css) => n + mediaWidths(css).length, 0)
    expect(total).toBeGreaterThan(0)
  })

  it('hiçbir .css izin verilen set dışında genişlik eşiği kullanmaz', () => {
    const offenders: string[] = []
    for (const [file, css] of Object.entries(cssFiles)) {
      for (const w of mediaWidths(css)) {
        if (!ALLOWED_MEDIA_WIDTHS.includes(w)) offenders.push(`${file}: ${w}px`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('yeni (örn. 760) eşik eklenirse test bunu yakalar', () => {
    expect(mediaWidths('@media (max-width: 760px) { a {} }')).toEqual([760])
    expect(ALLOWED_MEDIA_WIDTHS.includes(760)).toBe(false)
    expect(mediaWidths('@media (pointer: coarse) and (max-width: 639px) { a {} }')).toEqual([639])
  })
})

describe("theme.css dokunmatik token'ları", () => {
  const theme = cssFiles['styles/theme.css'] ?? ''

  it('--tap-min = 44px', () => {
    expect(theme).toMatch(/--tap-min:\s*44px/)
  })

  it('bileşenler dokunmatik boyutu token ile okur (44 sabit yazılmamış)', () => {
    for (const [file, css] of Object.entries(cssFiles)) {
      if (file.endsWith('theme.css')) continue
      const blocks = css.match(/@media \(pointer: coarse\)[^{]*\{[\s\S]*?\n\}/g) ?? []
      for (const b of blocks) expect(b, file).not.toMatch(/\b44px\b/)
    }
  })

  it('dvh yedeği: 100vh yazan her kuralın hemen ardından 100dvh gelir', () => {
    for (const [file, css] of Object.entries(cssFiles)) {
      for (const m of css.matchAll(/(min-height|height)\s*:\s*100vh\s*;([^\n]*\n\s*)([^\n]*)/g)) {
        expect(m[3], `${file}: ${m[1]}`).toMatch(/100dvh/)
      }
    }
  })
})
