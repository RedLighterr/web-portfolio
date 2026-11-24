/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY } from './theme'

// public/theme-init.js modül sistemi dışında (index.html'den düz script) — anahtarı import edemez, elle yazar.
const themeInit = readFileSync(fileURLToPath(new URL('../../public/theme-init.js', import.meta.url)), 'utf8')
const indexHtml = readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8')

describe('theme-init.js', () => {
  it('ThemeToggle ile aynı localStorage anahtarını okur', () => {
    expect(themeInit).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`)
  })

  it('index.html <head>’inde, async/defer olmadan, modül script’inden önce yüklenir', () => {
    const head = indexHtml.slice(0, indexHtml.indexOf('</head>'))
    expect(head).toMatch(/<script src="\/theme-init\.js"><\/script>/)
    expect(indexHtml.indexOf('theme-init.js')).toBeLessThan(indexHtml.indexOf('type="module"'))
  })
})
