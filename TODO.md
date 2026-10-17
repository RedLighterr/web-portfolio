# TODO.md

Yapılacaklar listesi / backlog. Task tamamlanınca buradan kaldır, [docs/PROGRESS.md](docs/PROGRESS.md)'ye taşı.

> **Geliştirme sırası:** backend'den önce her zaman frontend yapılır (bkz. [CLAUDE.md](CLAUDE.md)). Fazlarda Frontend bu yüzden Backend'den önce.

## Kapsam kararları (2026-10-17, kullanıcı ile netleşti)

- **Temel:** web temeli ve klasör yapısı SDK-Infrastructure-Dashboard ile aynı (bkz. [CLAUDE.md](CLAUDE.md) "Temel").
- **Backend:** ASP.NET Core (.NET 9) + PostgreSQL 17 (EF Core + Npgsql).
- **Kimlik:** Keycloak — **admin paneli + özel alanlar**. Özel alan içeriği: detaylı CV / referanslar, özel / NDA projeler, demo / build indirmeleri. Kayıt kapalı (davetle). Keycloak compose içinde, realm tanımı repoda JSON (bkz. [docs/KEYCLOAK.md](docs/KEYCLOAK.md)).
- **Public bölümler:** hakkımda + CV/deneyim, projeler (Unity oyunları dahil), blog, iletişim formu.
- **Dil:** TR + EN (dil önekli URL'ler).
- **İçerik:** Postgres'te, admin panelinden yönetilir.
- **SEO:** SPA + build-time prerender (public rotalar); içerik değişince admin "Yayınla" ile yeniden prerender.
- **Tema:** referanstaki `theme.css` yapısı aynen; marka **turuncu/amber**; fontlar referanstan farklı, daha kişisel bir set.
- **Kurallar:** commit kuralı, tasarım → Artifact onayı → kod, önce frontend, erişim kuralı (uyarlanmış) — hepsi [CLAUDE.md](CLAUDE.md)'de.

## Teknik kararlar (2026-10-17, açık kararlar turu)

- **Router:** özel router (referanstaki `routes.ts` + `location.ts` kalıbı + dil öneki + slug parametresi) — [MIMARI.md §8](docs/MIMARI.md)
- **i18n:** özel `useT()` hook'u, dış bağımlılık yok, tip güvenli anahtarlar — [MIMARI.md §5](docs/MIMARI.md)
- **Çok dilli içerik:** `*_translations` tabloları (çeviri satırı yoksa öğe o dilde yok) — [MIMARI.md §4](docs/MIMARI.md)
- **NDA erişimi:** baştan **proje bazlı izin** (`project_access`). `private-viewer` = özel alan + detaylı CV/referanslar + projeye bağlı olmayan indirmeler; NDA projeler ve bağlı indirme/demolar yalnızca izinle. İzin ekranı için salt okunur Keycloak servis hesabı (`portfolio-admin-cli`, `view-users`) ilk sürümde — [MIMARI.md §2](docs/MIMARI.md), [KEYCLOAK.md §3](docs/KEYCLOAK.md)
- **Prerender:** sürekli çalışan Node servisi (backend'e Docker soketi verilmez) — [MIMARI.md §6](docs/MIMARI.md)
- **WebGL demoları:** sayfa içinde oynatılır; public demolar (vitrin) + özel demolar (proje izni). Sandbox'lı iframe, ayrı CSP, özel demoda imzalı URL — [MIMARI.md §6a](docs/MIMARI.md)
- **İletişim formu:** Cloudflare Turnstile (+ hız sınırı, honeypot); CSP'ye `challenges.cloudflare.com` — [MIMARI.md §7](docs/MIMARI.md)
- **Tema flash'ı:** harici `theme-init.js` — [THEME.md](docs/THEME.md)
- **Keycloak login teması:** Keycloakify (`apps/keycloak/theme/`, theme.css senkronu) — [KEYCLOAK.md §5](docs/KEYCLOAK.md)
- **`/` yönlendirmesi:** `lang` cookie → `Accept-Language` (Türkçe → `/tr/`, diğer → `/en/`) → varsayılan `/en/` — [MIMARI.md §3](docs/MIMARI.md)

## Açık kararlar (uygulamadan önce kullanıcıya sorulacak)

Karar verilince yukarıya tarihle taşı.

- [ ] Font seti (aday: Sora / Bricolage Grotesque + Inter + JetBrains Mono) — Faz 1 tasarımda
- [ ] Marka tonunun kesin değeri (hue ≈ 25–35), logo / monogram, favicon, OG görseli — Faz 1 tasarımda
- [ ] Hosting: sunucu, alan adı, TLS sonlandırma (Caddy / Cloudflare / ortak sunucu), yedekleme — Faz 4'e ertelendi (2026-10-17)

## Faz 0 — İskelet (referanstan uyarlanır, tasarım gerektirmez)

### Frontend iskeleti (`apps/web`)
- [ ] Vite + React 19 + TS projesi; `package.json` script'leri, `tsconfig.*`, `.oxlintrc.json`, `vite.config.ts` referanstaki gibi
- [ ] `src/styles/theme.css` — referans yapısı, turuncu/amber geçici rampa, warning/danger ayrıştırması ([THEME.md](docs/THEME.md))
- [ ] `src/styles/fonts.css` + Fontsource (geçici: referans set; kesin set tasarımda)
- [ ] `index.css`, `ThemeToggle`, `Logo` (geçici logo), `breakpoints.ts`, `public/theme-init.js`
- [ ] Testler: `themeAudit`, `breakpoints`, `touchCss` (referanstan), i18n anahtar denetimi, tema `localStorage` anahtarı tutarlılığı
- [ ] Özel router (`lib/routes.ts`: `matchRoute` / `pathFor`, dil öneki + slug) + testleri
- [ ] i18n altyapısı (`lib/i18n.ts`, `useT()`, tip güvenli anahtarlar) + `i18n/{tr,en}.json` iskeleti
- [ ] `Dockerfile`, `Dockerfile.dev`, `nginx.conf` (CSP + Turnstile, `/api/`, `/auth/`, `/media/`, `/demos/` ayrı CSP + CORS, `/private-demos/` `auth_request`, prerender `try_files`, `/` dil yönlendirmesi `map`, `/auth/admin` kapalı), `.dockerignore`

### Backend iskeleti (`apps/src`, `apps/tests`)
- [ ] ASP.NET Core .NET 9 Web API, `global.json`, `Backend.csproj`, `.sln` (referanstaki gibi)
- [ ] `/api/health`, EF Core + Npgsql, ilk migration (boş şema)
- [ ] Keycloak JwtBearer doğrulaması + `Admin` / `PrivateViewer` / `ProjectAccess` politikaları, varsayılan politika "kimlik doğrulanmış" ([KEYCLOAK.md §4](docs/KEYCLOAK.md))
- [ ] `SecretRules` (prod sırları zorunlu), `Dockerfile`, `Dockerfile.dev`
- [ ] `Backend.Tests` (xUnit), test imzalı token ile yetki testleri

### Keycloak (`apps/keycloak`)
- [ ] `Dockerfile`, `realm-export/portfolio-realm.json` (realm, roller, `portfolio-web`, `portfolio-admin-cli` salt okunur servis hesabı, audience + `roles` mapper'ları, brute force, admin OTP, TR + EN locale), `db-init/01-keycloak-db.sh`
- [ ] Frontend `lib/auth.ts` (`keycloak-js`, lazy), `public/silent-check-sso.html`, CSP ile doğrulama
- [ ] Keycloakify iskeleti (`apps/keycloak/theme/`), theme.css/fonts.css senkron betiği + CI `--check`, multi-stage build (Node + Maven) → `providers/`

### Altyapı
- [ ] `docker-compose.dev.yml` / `docker-compose.yml` (db, backend, frontend, keycloak; prod'da prerender servisi + volume'lar)
- [ ] `.env.example` (üretme komutlarıyla), `shared/api-types.ts` + `shared/sync-types.mjs`
- [ ] `.github/workflows/ci.yml` (frontend: lint/test/build/sync-check; backend: build/test) — branch'ler `main`, `development`
- [ ] `.claude/agents/Explore.md` Repo map'ini gerçek klasörlere göre güncelle

## Faz 1 — Tasarım (Artifact onayı)

- [ ] Görsel kimlik: marka tonu, font seti, logo/monogram, light/dark örnekleri
- [ ] Public sayfa tasarımları: ana sayfa, hakkımda, projeler (liste + detay), blog (liste + yazı), iletişim, 404 — mobil + masaüstü, TR + EN
- [ ] Özel alan tasarımı: giriş, detaylı CV, NDA proje detayı, indirmeler, "erişim yok" ekranı
- [ ] WebGL demo oynatıcısı: kapak → "oynat", iframe, tam ekran, mobil uyarısı
- [ ] Admin paneli tasarımı: kabuk + içerik düzenleme formları (TR/EN alanları), demo yükleme, proje izinleri ekranı, yayınla ekranı
- [ ] Keycloak giriş sayfaları (Keycloakify): login, şifre güncelleme, OTP, hata — TR + EN

## Faz 2 — Frontend (mock veriyle)

- [ ] Public sayfalar + dil seçici + SEO head yönetimi
- [ ] Özel alan sayfaları (gerçekçi kişisel veri içermeyen mock)
- [ ] Admin paneli sayfaları (lazy chunk)
- [ ] Markdown render (sanitize, ham HTML kapalı) + kod vurgulama (CSP uyumlu)
- [ ] SSR entry'leri (`entry-client.tsx` / `entry-server.tsx`) + prerender betiği (mock veriyle)

## Faz 3 — Backend

- [ ] İçerik modeli + `*_translations` tabloları + migration'lar ([MIMARI.md §4](docs/MIMARI.md)); public ve özel DTO'lar ayrı + "public DTO'da özel alan yok" testi
- [ ] `/api/public/*` (+ `prerender-manifest`, iletişim formu: hız sınırı, honeypot, Turnstile `siteverify`)
- [ ] `/api/private/*` (+ `me/access`, proje izni kontrolü — izinsizde 404, yetkili indirme `X-Accel-Redirect`, özel demo imzalı URL + `auth_request` uç noktası)
- [ ] `/api/admin/*` CRUD, medya ve WebGL zip yükleme (yapı doğrulama, yol kaçışı koruması), mesajlar, proje izinleri (Keycloak kullanıcı listesi servis hesabıyla)
- [ ] Yetki testleri: proje izni olmayan kullanıcı NDA projeyi listede/detayda/indirmede/demoda göremez
- [ ] Yayın hattı: `publish_jobs`, prerender servisi tetikleme, atomik `current` geçişi, ilk açılışta yayın
- [ ] Frontend'i mock'tan gerçek API'ye bağla

## Faz 4 — Yayına alma

- [ ] Hosting/alan adı/TLS kararı (açık karar), prod `.env`, Keycloak prod realm + kalıcı admin + OTP
- [ ] Cloudflare Turnstile prod anahtarları (alan adına bağlı), gizlilik metni
- [ ] `sitemap.xml`, `robots.txt`, OG görselleri, Search Console
- [ ] Yedekleme (Postgres + `media-data`) ve geri alma adımları
- [ ] Yayına alma rehberi (`docs/LOCAL_YAYINA_ALMA.md`, gitignore'da)

## Sonra (kapsam dışı, fikir)

- [ ] Admin panelinden kullanıcı oluşturma/davet (servis hesabına `manage-users` yazma yetkisi)
- [ ] İletişim formu e-posta bildirimi (SMTP)
- [ ] Ziyaret analitiği (gizlilik dostu, self-hosted; CSP etkisi)
