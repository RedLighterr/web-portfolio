# Mimari

> **Durum (2026-10-17):** tasarım önerisi, koddan doğrulanmadı. Kararlar kullanıcıyla soru-cevap ile netleşti (bkz. [../TODO.md](../TODO.md) "Kapsam kararları"); "Açık karar" olarak işaretlenenler uygulama öncesi kullanıcıya sorulur. Keycloak ayrıntıları ayrı dokümanda: [KEYCLOAK.md](KEYCLOAK.md).

## 1. Genel bakış

```
                     ┌──────────────────────── nginx (prod, :8080) ────────────────────────┐
 Tarayıcı ──────────▶│  /            → prerender edilmiş HTML (varsa) → yoksa SPA kabuğu   │
                     │  /assets/     → Vite build çıktısı (hash'li, uzun önbellek)          │
                     │  /media/      → yalnızca PUBLIC görseller (volume)                   │
                     │  /demos/      → public WebGL demoları (ayrı CSP, iframe)             │
                     │  /api/        → backend (ASP.NET Core)                               │
                     │  /auth/       → Keycloak (admin konsolu dışarıya kapalı)             │
                     └──────────────────────────────────────────────────────────────────────┘
                                   │                         │
                         backend (.NET 9) ── Postgres 17 ── Keycloak
                                   │   (portfolio DB)   (keycloak DB)
                                   ▼
                         prerender servisi (Node) ──▶ site-prerender volume ──▶ nginx
```

- **Tek SPA** (`apps/web`): public site, özel alan ve admin paneli aynı uygulamada; özel alan ve admin kodu **lazy chunk**.
- **Aynı origin:** API (`/api/`) ve Keycloak (`/auth/`) nginx üzerinden aynı origin'de → CSP `'self'` ile yetinir, CORS gerekmez (dev hariç).
- **İçerik Postgres'te**, admin panelinden yönetilir. Public sayfalar **prerender** edilir; içerik değişince admin "Yayınla" ile yeniden prerender tetiklenir. O ana kadar SPA, hydration sonrası canlı veriyi API'den zaten gösterir.

## 2. Erişim katmanları

| Katman | Kim | Keycloak rolü | API öneki | Frontend |
|---|---|---|---|---|
| Public | Herkes (anonim) | — | `/api/public/*` | `/{lang}/…` (prerender edilir) |
| Özel — genel | Davet edilen kullanıcılar | `private-viewer` (veya `admin`) | `/api/private/*` | `/{lang}/private/…` (prerender **edilmez**) |
| Özel — proje | Projeye izin verilen kullanıcılar | — (izin `project_access`'te) | `/api/private/projects/*` | `/{lang}/private/projects/{slug}` |
| Admin | Site sahibi | `admin` | `/api/admin/*` | `/admin/…` (prerender edilmez, `noindex`) |

**Proje bazlı izin (karar 2026-10-17):**
- `private-viewer` rolü: özel alana giriş + detaylı CV / referanslar / iletişim bilgileri + **projeye bağlı olmayan** indirmeler.
- Özel / NDA projeler ve **onlara bağlı** indirmeler ile özel demolar: yalnızca `project_access` tablosunda o projeye izni olan kullanıcı (Keycloak `sub`) veya `admin`. Rol tek başına NDA projesini açmaz; izin de rol gerektirmez (yalnızca tek bir projeyi görmesi gereken kişiye `private-viewer` verilmeden izin verilebilir).
- Özel alan sayfası kullanıcıya yalnızca erişebildiği öğeleri listeler; hiçbir öğeye erişimi olmayan, girişli kullanıcı "erişim yok" ekranı görür.
- İzinler admin panelinden verilir (`/admin/access`). Kullanıcı listesi Keycloak Admin REST API'den, salt okunur servis hesabıyla (`portfolio-admin-cli`, yalnızca `view-users`) okunur — bkz. [KEYCLOAK.md](KEYCLOAK.md) §3.
- Bir izni kaldırmak anında etkilidir (izin her istekte DB'den kontrol edilir, token'a gömülmez).

- Kayıt (self-registration) **kapalı**; kullanıcılar davetle/elle oluşturulur (bkz. [KEYCLOAK.md](KEYCLOAK.md)).
- Yetki kontrolü **yalnızca backend'de** güvenlik sınırıdır. Frontend rol kontrolü sadece arayüzü düzenler.
- Public endpoint'ler özel alanları **hiç** döndürmez (ayrı DTO'lar; aynı entity'nin public ve özel görünümü ayrı tiplerdir). Bir testle korunur: public DTO'larda özel alan adı yok.

## 3. Sayfa kataloğu

Rota segmentleri iki dilde de İngilizce; dil öneki zorunlu (`/tr/…`, `/en/…`). `hreflang` ile iki dil birbirine bağlanır.

### Public (prerender edilir)

| Rota | İçerik |
|---|---|
| `/` | 302 yönlendirme (nginx `map`): önce `lang` cookie'si (dil seçicide seçilen dil), yoksa `Accept-Language` Türkçeyse `/tr/`, değilse `/en/`; dil bilgisi olmayan (botlar) → `/en/`. `x-default` hreflang → `/en/` |
| `/{lang}/` | Hero, öne çıkan projeler, son yazılar, kısa iletişim çağrısı |
| `/{lang}/about` | Biyografi, deneyim zaman çizelgesi, yetenekler, public CV (PDF) indirme |
| `/{lang}/projects` | Proje kartları (filtre: teknoloji/tür — Unity oyunları dahil) |
| `/{lang}/projects/{slug}` | Proje detayı: görsel/video galerisi, teknoloji, roller, linkler (repo, mağaza), varsa **public WebGL demosu** (sayfa içinde oynatılır, bkz. §6a) |
| `/{lang}/blog` | Yazı listesi, etiket filtresi |
| `/{lang}/blog/{slug}` | Yazı (Markdown) |
| `/{lang}/contact` | İletişim formu + sosyal linkler |
| 404 | Dil bazlı prerender edilmiş 404 |

### Özel (login + `private-viewer`/`admin`)

| Rota | İçerik |
|---|---|
| `/{lang}/private` | Özel alan girişi: kullanıcının erişebildiği öğeler; `private-viewer` ise detaylı CV, referanslar, iletişim bilgileri |
| `/{lang}/private/projects/{slug}` | Özel / NDA proje detayı (proje izni gerekir), varsa özel WebGL demosu + projeye bağlı indirmeler |
| `/{lang}/private/downloads` | Kullanıcının erişebildiği build / dosya indirmeleri (projeye bağlı olmayanlar `private-viewer`, bağlı olanlar proje izni) |

Login olmayan kullanıcı bu rotalara gelirse Keycloak login'e yönlendirilir; login olup rolü olmayan kullanıcı "erişim yok" ekranı görür (içerik değil).

### Admin (login + `admin`)

| Rota | İçerik |
|---|---|
| `/admin` | Özet: taslaklar, okunmamış mesajlar, son yayın durumu |
| `/admin/profile` | Public profil + özel profil (ayrı bölümler) |
| `/admin/experience`, `/admin/skills` | Deneyim ve yetenek CRUD + sıralama |
| `/admin/projects` | Proje CRUD, görünürlük (public/özel), öne çıkarma, sıralama, medya |
| `/admin/posts` | Blog CRUD, taslak/yayın |
| `/admin/downloads` | Dosya yükleme, projeye bağlama |
| `/admin/demos` | WebGL build yükleme (zip), public/özel, projeye bağlama |
| `/admin/access` | Proje bazlı izinler: Keycloak kullanıcı listesi × özel projeler |
| `/admin/messages` | İletişim mesajları |
| `/admin/publish` | "Yayınla" (prerender) + geçmiş yayın işleri ve hataları |

Admin arayüzü yalnızca Türkçe (sözlükten okunur ama `admin.*` anahtarlarında EN zorunlu değil); düzenlenen **içerik** TR + EN alanlarıyla girilir.

## 4. İçerik modeli (Postgres, EF Core)

**Çok dilli metin (karar 2026-10-17): `*_translations` tabloları.** Dilden bağımsız alanlar ana tabloda, çevrilen alanlar `<entity>_translations` tablosunda: `(entity_id, locale, …metin alanları)`, birincil anahtar `(entity_id, locale)`, `locale` ∈ {`tr`, `en`} (check constraint). Bir öğenin bir dilde çeviri satırı yoksa o dilde **yoktur**: rota üretilmez, `hreflang` yalnızca var olan dile verilir, public API o dilde 404 döner (blog yazıları tek dilde olabilir). Yayınlanmış bir proje/profil için iki dil de zorunluysa bu backend doğrulamasında kontrol edilir (**doğrulanacak:** hangi entity'lerde iki dil zorunlu).

| Tablo | Ana tablo alanları | `_translations` alanları | Katman |
|---|---|---|---|
| `profile` (tekil) | avatar, sosyal linkler | unvan, biyografi, public CV PDF (dil başına dosya) | public |
| `private_profile` (tekil) | telefon, e-posta, adres | referanslar, detaylı CV PDF | özel (`private-viewer`) |
| `experiences` | şirket, başlangıç/bitiş, sıra | rol, açıklama | public |
| `skills` | kategori, sıra | ad (gerekirse) | public |
| `projects` | slug, teknoloji etiketleri, linkler, kapak + galeri, `visibility` (public/private), öne çıkan, sıra, `status` (draft/published), yayın tarihi | başlık, özet, gövde (Markdown) | public / özel |
| `project_access` | proje, Keycloak `sub`, veren, tarih (+ e-posta önbelleği, gösterim için) | — | admin yönetir |
| `posts` | slug, etiketler, kapak, `status`, yayın tarihi | başlık, özet, gövde (Markdown) | public |
| `media` | depolama anahtarı, mime, boyut, `visibility` | alt metin | public / özel |
| `downloads` | dosya meta (ad, boyut, sha256), depolama anahtarı, bağlı proje (ops.) | açıklama | özel |
| `demos` | bağlı proje, `visibility`, depolama anahtarı (açılmış WebGL build klasörü), Unity sürümü, boyut | başlık, kontrol açıklaması | public / özel |
| `contact_messages` | ad, e-posta, mesaj, dil, IP hash'i, tarih, okundu | — | admin |
| `publish_jobs` | istek zamanı, isteyen, durum, bitiş, hata, üretilen sayfa sayısı | — | admin |

Taslak (`draft`) içerik public API'de ve prerender'da görünmez. Slug dilden bağımsızdır (iki dilde aynı URL segmenti).

**Dosya depolama:** yerel volume (`media-data`), iki ayrı kök: `public/` (nginx `/media/` ile doğrudan) ve `private/` (yalnızca backend okur; indirme backend'de yetki kontrolünden sonra `X-Accel-Redirect` ile nginx'in `internal` location'ına devredilir — büyük build dosyaları .NET belleğinden geçmez). Yükleme sınırı (`client_max_body_size`) build boyutlarına göre ayarlanır.

**Markdown:** gövde Markdown olarak saklanır, istemcide ve prerender'da aynı render fonksiyonuyla HTML'e çevrilir. Ham HTML **kapalı** (sanitize), XSS'e karşı. Kod blokları için sözdizimi vurgulama build-time veya istemci (CSP'ye uygun, inline script yok).

## 5. i18n

- **URL:** dil öneki zorunlu (`/tr/…`, `/en/…`); dil seçici aynı sayfanın diğer dil sürümüne gider (öğe o dilde yoksa o dilin liste sayfasına) ve seçimi `lang` cookie'sine yazar (`SameSite=Lax`, 1 yıl; yalnızca `/` yönlendirmesi okur, sır değil).
- **Kütüphane (karar 2026-10-17): özel hook, dış bağımlılık yok.** `apps/web/src/lib/i18n.ts`: `useT()` → `t('anahtar', { degisken })`, `{degisken}` interpolasyonu; dil rota önekinden gelir (context). Anahtarlar `tr.json`'dan türetilen TypeScript tipiyle denetlenir (olmayan anahtar derleme hatası). Prerender'da aynı hook, ek ayar yok.
- **Arayüz metinleri:** `apps/web/src/i18n/tr.json` ve `en.json`; component'ler metni anahtar ile okur, sabit metin yazmaz. Bir vitest, iki sözlüğün anahtar setlerinin aynı olduğunu denetler (`admin.*` hariç). Çoğul gereken yerde `Intl.PluralRules`.
- **İçerik:** DB'de `*_translations` tabloları (§4); public API `?lang=tr|en` ile tek dili döndürür (prerender ve istemci aynı endpoint'i kullanır).
- **Tarih/sayı:** `Intl` ile dile göre biçimlendirilir.

## 6. Prerender hattı (SEO)

Amaç: public sayfaların ilk HTML'i içerik + `<head>` etiketleriyle gelsin (Google, LinkedIn/Twitter/WhatsApp kart önizlemesi).

1. **Vite SSR build:** `src/entry-client.tsx` (`hydrateRoot`) + `src/entry-server.tsx` (`render(url, data)` → HTML + head). Router saf fonksiyon olmalı (url → rota), sunucuda da çalışır.
2. **Veri:** prerender yalnızca **anonim** public API'yi çağırır: `GET /api/public/prerender-manifest` (tüm public rotalar × diller + her rotanın verisi). Özel/admin endpoint'lere token'la çağrı **yapılmaz** → özel içerik çıktıya giremez (Erişim Kuralı).
3. **Çıktı:** her rota için `{lang}/{path}/index.html` — `<title>`, `description`, `canonical`, `hreflang` (tr/en/x-default), Open Graph + Twitter kart etiketleri, JSON-LD (`Person`, `CreativeWork`/`BlogPosting`); ayrıca `sitemap.xml`, `robots.txt` (`/admin`, `/{lang}/private` hariç tutulur).
4. **Hydration verisi:** sayfa verisi `<script type="application/json" id="__DATA__">` ile gömülür (çalıştırılabilir script değil → CSP `script-src 'self'` ile uyumlu). İstemci bununla hydrate olur, TanStack Query arka planda tazeler.
5. **Çalıştığı yer:** compose'da ayrı `prerender` servisi (Node, `apps/web`'in SSR bundle'ı). Backend, admin "Yayınla" dediğinde `publish_jobs`'a kayıt atar ve prerender servisini iç ağdan tetikler (paylaşılan sır ile; nginx bu uç noktayı proxy'lemez). Aynı anda tek iş çalışır; arka arkaya gelen istekler birleştirilir.
6. **Atomik geçiş:** çıktı `releases/<job-id>/`'e yazılır, bitince `current` işaretçisi oraya çevrilir; yarım site servis edilmez. Son N sürüm saklanır (geri alma).
7. **nginx:** `try_files /prerender/current$uri/index.html $uri /index.html` mantığı — prerender edilmiş public sayfa varsa o, yoksa SPA kabuğu (özel/admin rotalar hep SPA kabuğu).
8. **İlk kurulum:** volume boşken backend açılışta bir yayın işi başlatır; o bitene kadar SPA kabuğu servis edilir.

**Karar (2026-10-17):** prerender **sürekli çalışan küçük bir Node servisi** (compose'da `prerender`). Backend'e Docker soketi verilmez.

## 6a. WebGL (Unity) demoları

**Karar (2026-10-17):** demolar sayfa içinde oynatılır; **public demolar** (herkese açık proje sayfasında, portfolyo vitrini) ve **özel demolar** (proje izni gerekir) var. İndirilebilir build'ler ayrıca `downloads`'ta.

- **Yükleme:** admin Unity WebGL build'ini zip olarak yükler; backend açar, beklenen yapıyı (`index.html`, `Build/*.loader.js`, `.data`, `.wasm`, `.framework.js`) doğrular, `media-data/{public|private}/demos/<id>/` altına yazar. Zip içinde yol kaçışı (`../`) reddedilir, boyut sınırı uygulanır.
- **İzolasyon:** demo, ana sayfaya **sandbox'lı iframe** ile gömülür: `sandbox="allow-scripts allow-pointer-lock"` (+ tam ekran için `allowfullscreen`), **`allow-same-origin` yok** → demo opak origin'de çalışır, sitenin çerezlerine, `localStorage`'ına ve token'lara erişemez.
- **CSP:** Unity WebGL `'wasm-unsafe-eval'` ve varsayılan şablonda inline script ister. Ana sitenin CSP'si **gevşetilmez**; yalnızca demo dosyalarının servis edildiği location'a ayrı, gevşek bir CSP verilir. Inline script gerektirmeyen özel bir Unity WebGL şablonu tercih edilir (**doğrulanacak:** Unity sürümüne göre gereken direktifler).
- **Sıkıştırma:** Unity build'i `.br`/`.gz` üretir → nginx'te doğru `Content-Encoding` / `Content-Type` başlıkları (veya Unity'de "decompression fallback").
- **Public demo:** nginx `/demos/<id>/` doğrudan (statik, uzun önbellek). Opak origin'den yüklendiği için bu location `Access-Control-Allow-Origin: *` döner (yalnızca public demo dosyaları).
- **Özel demo:** sandbox'lı iframe çerez/bearer taşıyamaz → backend, yetki kontrolünden sonra **kısa ömürlü imzalı URL** üretir (`/private-demos/<id>/<imza>/…`); nginx her dosya isteğini `auth_request` ile backend'e doğrulatır (imza + süre + demo kimliği). İmza yalnızca o demoyu açar, birkaç dakikada düşer. (**doğrulanacak:** `auth_request` vs nginx `secure_link`.)
- Prerender: public demo yalnızca iframe yer tutucusu + kapak görseli olarak çıktıya girer; özel demo hiç girmez.

## 7. API yüzeyi (taslak)

| Önek | Yetki | Örnekler |
|---|---|---|
| `/api/health` | anonim | sağlık |
| `/api/public/*` | anonim | `profile`, `experiences`, `skills`, `projects`, `projects/{slug}`, `posts`, `posts/{slug}`, `prerender-manifest`, `POST contact` (hız sınırlı) |
| `/api/private/*` | girişli; öğe bazında: `private-viewer` (genel) veya `project_access` (proje) \| `admin` | `me/access` (erişebildiği öğeler), `profile` (`private-viewer`), `projects`, `projects/{slug}` (izin), `downloads`, `downloads/{id}` (indirme), `demos/{id}/url` (imzalı URL) |
| `/api/admin/*` | `admin` | tüm CRUD, `media`/`demos` yükleme, `messages`, `access` (izinler + Keycloak kullanıcı listesi), `publish`, `publish-jobs` |
| `/api/internal/*` | paylaşılan sır, yalnızca compose ağı | prerender ↔ backend, nginx `auth_request` (özel demo imzası); nginx dışarıya proxy'lemez |

Tipler `shared/api-types.ts`'te tek kaynak (referans projedeki `sync-types.mjs` kalıbıyla `apps/web/src/lib/apiTypes.ts`'e kopyalanır).

**İletişim formu (karar 2026-10-17: Cloudflare Turnstile):** hız sınırı (IP başına), honeypot alanı, minimum doldurma süresi, uzunluk sınırları **+ Turnstile**. Widget script'i yalnızca iletişim sayfasında dinamik yüklenir; backend token'ı Cloudflare `siteverify` ile doğrular (`TURNSTILE_SECRET_KEY` sır, site anahtarı public). CSP'ye `https://challenges.cloudflare.com` eklenir (`script-src`, `frame-src`) — SPA içi gezinmede ilk belgenin CSP'si geçerli olduğu için global CSP'ye. Gizlilik metninde belirtilir. Dev'de Cloudflare'in test anahtarları kullanılır. Mesaj DB'ye yazılır; e-posta bildirimi sonraya (SMTP sırrı gerekir).

## 8. Frontend yapısı (referans projeyle aynı düzen)

```
apps/web/src/
  main.tsx / entry-client.tsx / entry-server.tsx
  App.tsx
  pages/{public,private,admin}/     sayfa component'leri (private/admin lazy)
  components/                       ThemeToggle, Logo, LanguageSwitch, layout/, admin/ …
  lib/                              api, auth (keycloak-js sarmalayıcı), routes, i18n, queries, queryClient, breakpoints
  i18n/{tr,en}.json                 arayüz sözlükleri
  styles/{theme.css,fonts.css}      token'lar + gömülü fontlar
  assets/logo/{light,dark}/         tema bazlı logo
```

- Veri: TanStack Query (referanstaki gibi).
- **Router (karar 2026-10-17): özel router**, referanstaki `lib/routes.ts` + `lib/location.ts` kalıbı. Eklenenler: dil öneki (`/{lang}/…`) ve parametreli yollar (`/projects/{slug}`) — `matchRoute(pathname) → { lang, page, params } | null` ve `pathFor(page, lang, params)` saf fonksiyonları (prerender'da sunucuda aynen çalışır, testle korunur). Sayfa component'leri `React.lazy` ile; özel/admin ayrı chunk. Gezinmede kaydırma konumu, `<a>` tıklamalarının yakalanması ve admin formlarında "kaydedilmemiş değişiklik" uyarısı elle yazılır.
- Testler `*.test.ts` kodun yanında; referanstaki `themeAudit.test.ts`, `breakpoints.test.ts`, `touchCss.test.ts` aynen uyarlanır, ek olarak i18n anahtar denetimi ve "public DTO'da özel alan yok" denetimi.

## 9. Güvenlik özeti

- CSP referanstaki gibi engelleyen modda (`default-src 'self'` …); Keycloak aynı origin'de olduğu için `connect-src`/`frame-src` `'self'` yeterli olmalı — **doğrulanacak** (keycloak-js silent check-sso iframe'i). Tek dış kaynak Cloudflare Turnstile (§7). WebGL demo dosyaları ayrı location'da kendi CSP'siyle (§6a); ana CSP'ye `'wasm-unsafe-eval'` eklenmez.
- Tema flash'ını önleyen `theme-init.js` harici dosya (inline değil) → `script-src 'self'` yeterli (bkz. [THEME.md](THEME.md)).
- Token'lar yalnızca bellekte (keycloak-js); `localStorage`'a yazılmaz.
- Production'da sırlar zorunlu; boş/örnek/kısa değerle backend açılmaz (referanstaki `SecretRules` kalıbı).
- Keycloak admin konsolu (`/auth/admin`) nginx'te dışarıya kapalı; yönetim SSH tüneli veya ayrı iç port ile.
- Backend portu dışarı açılmaz; yalnızca nginx proxy'si üzerinden.
