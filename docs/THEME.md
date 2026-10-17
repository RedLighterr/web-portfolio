# Theme Kuralları

Kaynak dosya: [`apps/web/src/styles/theme.css`](../apps/web/src/styles/theme.css) *(henüz oluşturulmadı — bkz. [../TODO.md](../TODO.md) "Faz 0")*

Yapı, SDK-Infrastructure-Dashboard projesindeki `theme.css` ile **aynıdır** (token adları, iki katman, light/dark çözümleme, denetim testleri). Değerler portfolyoya özeldir: marka rengi **turuncu/amber**, fontlar ve logo yeni.

## Mimari

İki katman:

1. **Primitive token'lar** — ham skalalar (renk rampaları, tipografi skalası, spacing, radius, duration, z-index). Light/dark'ta değişmez, sabittir. Örn: `--color-primary-600`, `--space-4`, `--font-size-lg`.
2. **Semantic token'lar** — component'lerin gerçekten kullandığı isimler (`--bg-canvas`, `--text-primary`, `--border-default`, `--color-primary`, `--shadow-md` vb.). Bunlar tema bazında (light/dark) farklı primitive'lere map edilir.

Tema çözümleme sırası: önce OS tercihi (`prefers-color-scheme`), sonra `<html data-theme="light|dark">` manuel override kazanır. Dark değerleri üç yerde tekrarlanır (referanstaki gibi): `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`, `:root[data-theme='dark']`, `:root[data-theme='light']`.

## KESİN KURAL

**Bir sayfada veya component'te theme.css'teki bir değeri asla kopyalayıp sabit (hardcoded) yazma.**

❌ Yanlış:
```css
.card {
  background: hsl(30 20% 100%);
  color: #1a1a1a;
  padding: 16px;
}
```

✅ Doğru:
```css
.card {
  background: var(--bg-surface);
  color: var(--text-primary);
  padding: var(--space-4);
}
```

**Neden:** Kullanıcı theme.css'te bir token'ı değiştirdiğinde (örn. marka tonunu turuncudan amber'e kaydırmak), bunu referans alan her yer otomatik güncellenmeli. Kopyalanmış/hardcode değerler bu dinamikliği kırar ve tema tutarsız hale gelir.

## Component yazarken kontrol listesi

- Renk, spacing, radius, shadow, font, z-index, duration/easing — hepsi için önce theme.css'te uygun semantic token var mı diye bak.
- Semantic token yoksa ama ihtiyaç genel ise → yeni semantic token'ı theme.css'e ekle (primitive'den türet), sonra onu referans al. Component dosyasına özel bir değer gömme.
- Yalnızca gerçekten component'e özel, tema ile ilgisi olmayan bir değer varsa (örn. tek seferlik bir animasyon offset'i) sabit yazılabilir — ama bu istisna, kural değil.
- Keycloak login teması (**Keycloakify**, `apps/keycloak/theme/`) aynı `theme.css`/`fonts.css`'i kullanır: dosyalar senkron betiğiyle kopyalanır (CI eskimeyi yakalar), elle değer kopyalanmaz. Ayrıntı: [KEYCLOAK.md](KEYCLOAK.md) §5.

## Marka rengi — turuncu/amber

Plan (kesin ton tasarım aşamasında Artifact ile onaylanır):

- `--color-primary-50 … 950`: tek ton ailesinde (hue ≈ 25–35) 11 adımlık rampa; nötr rampa hafif sıcak (referanstaki gibi düşük doygunlukta aynı ton).
- **Kontrast:** turuncu, beyaz zemin üzerinde düşük kontrastlıdır. Light temada metin/link/buton zemini için koyu adımlar (`-700` civarı) kullanılır; `--on-primary` ile buton metni WCAG AA (≥ 4.5:1) sağlamalı. Dark temada daha açık adımlar (`-400`/`-500`).
- **Çakışma uyarısı:** referansta `--color-warning` amber (hue 38) ve `--color-danger` marka kırmızısına bağlıydı. Burada marka zaten turuncu/amber olduğundan:
  - `--color-warning` sarıya (hue ≈ 48–52) kaydırılır, markadan ayırt edilebilir olmalı;
  - `--color-danger` markaya **bağlanmaz**, kendi kırmızı tonunu (hue ≈ 355) alır.
- Referanstaki `--chart-*` token'ları alınmaz (portfolyoda grafik yok); gerekirse eklenir.

## Portfolyoya özel layout token'ları

Referanstaki dashboard kabuğu token'ları (`--sidebar-w`, `--rail-w`, `--bottom-bar-h`) yalnızca admin paneli kabuğu için gerekirse alınır. Public site için:

- `--page-max-w` — sayfa içerik genişliği
- `--prose-max-w` — blog/proje gövdesi okuma genişliği (≈ 68ch)
- `--header-h` — üst gezinme yüksekliği
- `--tap-min`, `--safe-*`, `--sheet-*` — referanstaki gibi (dokunmatik/mobil temel)

## Dark/Light

`theme.css` hem `prefers-color-scheme` hem `data-theme="dark"` / `data-theme="light"` manuel override'ı destekler. Toggle UI'ı `apps/web/src/components/ThemeToggle.tsx` (referanstan uyarlanır) — `document.documentElement.dataset.theme` set eder, tercihi `localStorage`'da tutar, ilk açılışta sistem temasına düşer.

**Tema flash'ı (karar 2026-10-17): harici `theme-init.js`.** Prerender edilmiş HTML'de `data-theme` yoktur; kullanıcı manuel tema seçtiyse hydration'a kadar yanlış tema görünürdü. Bunu önlemek için `apps/web/public/theme-init.js` `<head>`'de, CSS'ten önce, `async`/`defer` **olmadan** yüklenir: `localStorage`'daki tercihi okur (try/catch), varsa `document.documentElement.dataset.theme`'i set eder. Harici dosya olduğu için CSP `script-src 'self'` yeterli (inline script yok). Birkaç satırdır, `ThemeToggle` ile aynı `localStorage` anahtarını kullanır (anahtar tek yerde sabit; bir test ikisinin aynı olduğunu denetler). Hash'siz dosya adı olduğu için nginx'te kısa önbellek.

## Fontlar

Fontlar **projeye gömülü**: Google Fonts'tan değil, npm'deki [Fontsource](https://fontsource.org) paketlerinden. Hangi ailenin hangi ağırlıklarının yüklendiği tek dosyada: `apps/web/src/styles/fonts.css` (`index.css`'in ilk import'u). Build'de font dosyaları `/assets/` altına kopyalanır; CSP `font-src 'self'` bu yüzden yeterli. Yalnızca `latin` + `latin-ext` alt kümeleri alınır (Türkçe ğ/ş/ı/İ `latin-ext`'te).

Component'ler aile adını asla yazmaz — `var(--font-heading)` / `var(--font-body)` / `var(--font-mono)`.

**Set — açık karar (tasarım aşamasında Artifact ile seçilir):** "kişisel" bir set isteniyor. Adaylar: başlık **Sora** veya **Bricolage Grotesque**; gövde **Inter**; kod **JetBrains Mono**. Seçilen fontun `latin-ext` alt kümesi olduğu doğrulanmalı.

**Font değiştirmek:**
1. `cd apps/web && npm install @fontsource/<yeni-font>` (değişken font: `@fontsource-variable/<font>`).
2. `fonts.css`'te ilgili satırları değiştir: kullanılan her ağırlık için `latin-<ağırlık>.css` + `latin-ext-<ağırlık>.css` (ağırlıklar `--weight-*` token'larından).
3. `theme.css`'te `--font-heading` / `--font-body` / `--font-mono` aile adını güncelle (değişken fontta `'<Font> Variable'`).
4. Eski paketi kaldır: `npm uninstall @fontsource/<eski-font>`.
5. Dev container `node_modules`'ü kalıcı volume'da tutar — `up --build` yenilemez: `docker compose -f docker-compose.dev.yml exec frontend npm install` → `docker compose -f docker-compose.dev.yml restart frontend`.

## Logo

Referanstaki gibi iki ayrı dosya (CSS `filter` ile tek logodan üretilmez):

- `apps/web/src/assets/logo/light/logo.svg|png` — açık zemin
- `apps/web/src/assets/logo/dark/logo.svg|png` — koyu zemin

`--logo-src` semantic token'ı temaya göre ikisi arasında geçer; logo gösteren her yer `Logo` component'ini kullanır (`background-image: var(--logo-src)`). **Açık karar:** logo/monogram tasarımı (örn. "MFY" monogramı) — tasarım aşamasında. OG kart görseli ve favicon da aynı kimlikten üretilir.

## Breakpoints ve dokunmatik boyutlar

Kırılma noktaları **token değildir** (CSS `@media` içinde custom property kullanılamaz). Tek kaynak `apps/web/src/lib/breakpoints.ts`; CSS'te aynı sayılar yazılır ve `breakpoints.test.ts` izin verilen setin dışında genişlik eşiği bırakmaz. Yeni eşik gerekiyorsa önce `breakpoints.ts`'e eklenir.

Başlangıç seti (tasarımda kesinleşir): telefon ≤ 639, tablet 640–1024, masaüstü ≥ 1025.

Dokunmatik kuralları referanstaki gibi: büyütmeler genişliğe değil `@media (pointer: coarse)`'a bağlanır; giriş alanları dokunmatikte `font-size: var(--font-size-base)` (≥ 16px, iOS Safari zoom'u); `:hover` kuralları `@media (hover: hover)` içinde.

## Otomatik denetim

Referanstan uyarlanacak testler (`apps/web/src/lib/`):
- `themeAudit.test.ts` — `theme.css` dışındaki her `.css`'te hex / `rgb()` / `hsl()` renk ve `font-size` px/rem sabiti bırakmaz (tek istisna kök `16px`, `index.css`).
- `breakpoints.test.ts` — izinli genişlik eşikleri.
- `touchCss.test.ts` — sarılmamış `:hover` ve kaydırma sınırları.
