/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// THEME denetimi (docs/THEME.md): `theme.css` dışındaki CSS'te renk ve yazı boyutu sabit yazılmaz, token'dan okunur.
const srcDir = fileURLToPath(new URL('..', import.meta.url))
const cssFiles: Record<string, string> = {}
for (const rel of readdirSync(srcDir, { recursive: true }) as string[]) {
  const path = String(rel).replaceAll('\\', '/')
  if (path.endsWith('.css') && path !== 'styles/theme.css') cssFiles[path] = readFileSync(join(srcDir, path), 'utf8')
}

/** Yorum satırlarını atar (açıklamalarda örnek değer geçebilir). */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('theme.css dışında hardcode değer yok', () => {
  it('CSS dosyaları bulundu', () => {
    expect(Object.keys(cssFiles).length).toBeGreaterThanOrEqual(4)
  })

  it('renk: hex / rgb() / hsl() yok', () => {
    const offenders: string[] = []
    for (const [file, css] of Object.entries(cssFiles)) {
      for (const m of stripComments(css).matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g)) offenders.push(`${file}: ${m[0]}`)
    }
    expect(offenders).toEqual([])
  })

  it('yazı boyutu: px / rem sabit yok (kök 16 px istisnası index.css)', () => {
    const offenders: string[] = []
    for (const [file, css] of Object.entries(cssFiles)) {
      for (const m of stripComments(css).matchAll(/font-size:\s*([0-9.]+(?:px|rem|em))/g)) {
        if (file === 'index.css' && m[1] === '16px') continue
        offenders.push(`${file}: font-size ${m[1]}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('denetim sabit değeri yakalar', () => {
    expect(stripComments('a { color: #fff; box-shadow: 0 0 1px rgba(0,0,0,.2) }').match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(/g)).toHaveLength(2)
    expect(stripComments('/* #fff */ a { color: var(--x) }').match(/#[0-9a-fA-F]{3,8}\b/)).toBeNull()
  })
})
