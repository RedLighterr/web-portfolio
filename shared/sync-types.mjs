// shared/api-types.ts → apps/web/src/lib/apiTypes.ts kopyası.
//   node shared/sync-types.mjs          kopyayı günceller
//   node shared/sync-types.mjs --check  kopya eskiyse exit 1 (CI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'shared', 'api-types.ts')
const target = join(root, 'apps', 'web', 'src', 'lib', 'apiTypes.ts')
const header = '// OTOMATİK KOPYA — düzenleme. Kaynak: shared/api-types.ts (güncelle: node shared/sync-types.mjs)\n'

const expected = header + readFileSync(source, 'utf8')

if (process.argv.includes('--check')) {
  if (!existsSync(target) || readFileSync(target, 'utf8') !== expected) {
    console.error('apps/web/src/lib/apiTypes.ts shared/api-types.ts ile senkron değil. Çalıştır: node shared/sync-types.mjs')
    process.exit(1)
  }
  console.log('apiTypes.ts senkron.')
} else {
  writeFileSync(target, expected)
  console.log('apiTypes.ts güncellendi.')
}
