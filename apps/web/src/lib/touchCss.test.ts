/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Dokunmatik uyum (docs/THEME.md): CSS kuralları diskten okunur (Vitest `?raw` CSS'i boş döndürür).
const srcDir = fileURLToPath(new URL('..', import.meta.url))
const cssFiles: Record<string, string> = {}
for (const rel of readdirSync(srcDir, { recursive: true }) as string[]) {
  const path = String(rel).replaceAll('\\', '/')
  if (path.endsWith('.css')) cssFiles[path] = readFileSync(join(srcDir, path), 'utf8')
}

/** `@media (hover: hover) { ... }` bloklarını (süslü parantez eşleştirmeli) metinden çıkarır. */
function withoutHoverMedia(css: string): string {
  let out = ''
  let i = 0
  const marker = '@media (hover: hover)'
  while (i < css.length) {
    const at = css.indexOf(marker, i)
    if (at === -1) {
      out += css.slice(i)
      break
    }
    out += css.slice(i, at)
    let depth = 0
    let j = css.indexOf('{', at)
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++
      else if (css[j] === '}' && --depth === 0) break
    }
    i = j + 1
  }
  return out
}

/** `:hover` içeren seçiciler (kural başlıkları). */
function hoverSelectors(css: string): string[] {
  return [...css.matchAll(/([^{}]*:hover[^{}]*)\{/g)].map((m) => m[1].trim().replace(/\s+/g, ' '))
}

describe('hover yalnızca fareli cihazda', () => {
  it('CSS dosyaları okundu', () => {
    expect(Object.keys(cssFiles).length).toBeGreaterThanOrEqual(4)
  })

  it('bir kural :hover kullanıyorsa @media (hover: hover) içindedir (dokunmatikte takılı kalmasın)', () => {
    const offenders: string[] = []
    for (const [file, css] of Object.entries(cssFiles)) {
      for (const sel of hoverSelectors(withoutHoverMedia(css))) offenders.push(`${file}: ${sel}`)
    }
    expect(offenders).toEqual([])
  })

  it('denetim çalışıyor: sarılmamış :hover yakalanır, sarılmış yakalanmaz', () => {
    expect(hoverSelectors(withoutHoverMedia('a:hover { x: y }'))).toEqual(['a:hover'])
    expect(hoverSelectors(withoutHoverMedia('@media (hover: hover) { a:hover { x: y } } b { c: d }'))).toEqual([])
  })
})
