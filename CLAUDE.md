# CLAUDE.md

> **Her task başında önce [docs/PROGRESS.md](docs/PROGRESS.md) ve [TODO.md](TODO.md) dosyalarına bak.** Task bittiğinde bu iki dosyayı güncelle (tamamlanan işi PROGRESS.md'ye taşı, TODO.md'den kaldır veya durumunu işaretle).

## Proje Nedir

**web-portfolio** — Muhammed Furkan Yüce'nin kişisel portfolyo sitesi. Herkese açık bir vitrin (hakkımda/CV, projeler, blog, iletişim) + **Keycloak** ile korunan iki kimlikli alan:

- **Özel alan** — davet edilen kullanıcılara açık: detaylı CV / referanslar, özel / NDA projeler, demo ve build indirmeleri.
- **Admin paneli** — yalnızca site sahibi: tüm içeriğin (public + özel) yönetimi, kullanıcı erişimleri, iletişim mesajları, "yeniden yayınla" (prerender).

Site **iki dilli (TR + EN)**. Public sayfalar SEO ve paylaşım önizlemesi (Google, LinkedIn kartı) için **build-time prerender** edilir; içerik Postgres'te yaşar ve değişince yeniden prerender tetiklenir.

**Mimari arka plan — mutlaka önce oku:** [docs/MIMARI.md](docs/MIMARI.md) (sayfa kataloğu, içerik modeli, i18n, prerender hattı, API yüzeyi) ve [docs/KEYCLOAK.md](docs/KEYCLOAK.md) (realm, client'lar, roller, token akışı, dev/prod kurulum).

Bu iki doküman **tasarım önerisidir, koddan doğrulanmamıştır** — kütüphane sürümleri ve Keycloak ayarları güncel dokümandan teyit edilmeli. Ama mimari kararlar (erişim katmanları, içerik modeli, prerender stratejisi) bu projede referans alınıyor. Kapsam kararları ve açık kararlar için [TODO.md](TODO.md)'ye bak.

> **Temel (2026-10-17):** Web temeli ve klasör yapısı `C:\Users\mfurk\Unity Projects\SDK-Infrastructure-Dashboard` projesiyle **aynıdır** (monorepo düzeni, Docker/nginx/CSP yaklaşımı, iki katmanlı `theme.css`, Fontsource ile gömülü fontlar, tema denetim testleri, doküman düzeni). Bir altyapı kalıbı belirsizse önce oradaki karşılığına bak, sonra bu projeye uyarla — ama o repoda değişiklik yapma. Farklar: kimlik doğrulama custom JWT değil **Keycloak**; ek olarak `apps/keycloak/`, i18n ve prerender hattı var.

## Stack

| Katman | Teknoloji |
|---|---|
| Frontend | React 19 + TypeScript + Vite 8 |
| Backend | ASP.NET Core (.NET 9) Web API |
| Veritabanı | PostgreSQL 17 (uygulama DB'si + Keycloak DB'si, aynı instance'ta ayrı veritabanları) |
| Kimlik | Keycloak (OIDC; frontend `keycloak-js`, backend JwtBearer) |
| SEO | Build-time prerender (public rotalar, TR + EN) |
| Lint / test (frontend) | oxlint / vitest |
| Test (backend) | xUnit |
| Konteynerleştirme | Docker + Docker Compose |

## Monorepo Yapısı

```
apps/
  web/        React + Vite (TypeScript) frontend — public site + özel alan + admin paneli (tek SPA)
  src/        ASP.NET Core (.NET 9) Web API backend
  tests/      Backend testleri (Backend.Tests)
  keycloak/   Keycloak image'ı: realm export (realm-export/*.json), Keycloakify login teması (theme/)
shared/       Frontend ve backend arasında paylaşılan kaynaklar (DTO/tip tanımları vb.)
docs/         Ek dokümantasyon (mimari, Keycloak, tema kuralları, workflow, ilerleme)
```

> **Durum (2026-10-17):** yalnızca dokümanlar var; `apps/*` iskeleti henüz oluşturulmadı (bkz. [TODO.md](TODO.md) "Faz 0").

Portlar (dev): frontend `:5173`, backend `:5247`, Keycloak `:8081`, Postgres `:5432`. Prod'da dışarıya yalnızca nginx açılır (`:8080`); `/api/` → backend, `/auth/` → Keycloak aynı origin'den proxy'lenir.

## Komutlar (kullanıcı sözlü isteği → aksiyon)

Kullanıcı **"çalıştır" / "test et"** dediğinde:
```bash
docker compose -f docker-compose.dev.yml up
```
Hot-reload aktif çalışır: backend `:5247`, frontend `:5173`, Keycloak `:8081` (volume mount + `CHOKIDAR_USEPOLLING`, `Dockerfile.dev`).

Kullanıcı **"build al"** dediğinde:
```bash
docker compose up --build
```
Production image build edilir: site `:8080` (nginx; `/api/` ve `/auth/` proxy).

Detaylı workflow (tasarım süreci dahil) için → [docs/WORKFLOW.md](docs/WORKFLOW.md).

## Theme Kuralı — ÇOK ÖNEMLİ

Tüm tasarım token'ları `apps/web/src/styles/theme.css` içinde tanımlı (renk, spacing, tipografi, radius, shadow, z-index — primitive + semantic iki katman, light/dark tema desteği). Marka rengi **turuncu/amber**.

**KESİN KURAL: Hiçbir sayfada/component'te theme.css'teki değerleri kopyalayıp sabit (hardcoded) değer olarak yazma.** Her zaman `var(--token-adi)` ile referans al. Kullanıcı theme.css'te bir değişiklik yaptığında, referans alan her yer otomatik/dinamik güncellenmeli — kopyalanmış değerler bunu kırar.

Detaylar ve token listesi için → [docs/THEME.md](docs/THEME.md).

## Tasarım Süreci — ÇOK ÖNEMLİ

Yeni UI/sayfa tasarımı şu sırayla ilerler:
1. **Frontend design tool** ile tasarım oluşturulur.
2. Tasarım **Artifact ile doğrulanır** (kullanıcı onayı alınır).
3. Onay sonrası koda geçirilir (theme.css referanslarıyla, yukarıdaki kurala uyularak).

Kodlama, tasarım onaylanmadan başlamaz. **Onay alınmadan hiçbir değişiklik projeye (koda) dahil edilmez** — Artifact yalnızca önizlemedir, kullanıcı açıkça onay verene kadar repo'ya yazılmaz. Detaylar → [docs/WORKFLOW.md](docs/WORKFLOW.md).

## Erişim Kuralı — ÇOK ÖNEMLİ

Üç erişim katmanı vardır: **public** (herkes), **özel** (genel özel içerik: Keycloak'ta `private-viewer` rolü; NDA projeler ve onlara bağlı indirme/demolar: `project_access` tablosunda **proje bazlı izin**; `admin` her şeyi görür), **admin** (`admin` rolü). Ayrıntı → [docs/MIMARI.md](docs/MIMARI.md) "Erişim katmanları".

**Özel veya admin katmanındaki hiçbir veri, yetkisi olmayan bir kullanıcıya görünmez ya da sızmaz.** Bu şunları da kapsar:
- **API cevapları** — yetki kontrolü **her zaman backend'de** yapılır; frontend'deki rol kontrolü yalnızca arayüz kolaylığıdır, güvenlik sınırı değildir. Public endpoint'ler özel alanları (telefon, adres, referans, NDA proje detayı, dosya linki) **hiç** döndürmez — "frontend'de gizleriz" yaklaşımı yasak.
- **Prerender çıktısı** — prerender yalnızca anonim (public) API ile çalışır; özel içerik build çıktısına, statik HTML'e, sitemap'e, OG etiketlerine asla girmez.
- **Mock / placeholder veri** — özel alan ve admin ekranlarının mock verisi gerçekçi kişisel veri (gerçek telefon, adres, referans adı, NDA müşteri adı) içermez; login olmadan render edilmez.
- **Dosyalar** — özel build indirmeleri ve özel WebGL demoları nginx'in statik dizininden doğrudan servis edilmez; her istek backend'de yetki kontrolünden geçer (indirme: `X-Accel-Redirect`, demo: kısa ömürlü imzalı URL + `auth_request`).
- **Proje izni** — NDA projeye erişim her istekte DB'den kontrol edilir; bir projenin varlığı, adı veya slug'ı bile izni olmayan kullanıcıya (listelerde, 404/403 farkında) sızmaz — izinsiz erişimde 404 döner.
- **Bundle** — özel alan ve admin kodu ayrı (lazy) chunk'tadır; gizli içerik JS bundle'ına gömülmez.

## i18n Kuralı

Arayüzdeki hiçbir metin component içinde sabit yazılmaz; çeviri sözlüğünden (TR + EN) okunur. DB içeriği her iki dil için ayrı alan tutar. Yeni bir metin eklerken **iki dili birlikte** ekle; eksik çeviri bırakma (test denetler). Ayrıntı → [docs/MIMARI.md](docs/MIMARI.md) "i18n".

## Geliştirme Sırası — ÇOK ÖNEMLİ

**Backend'den önce her zaman frontend yapılır.** Yeni bir özellik/ekran için: önce frontend (tasarım onayı + component + sahte/mock veriyle çalışır hal), backend en sona bırakılır. Frontend mock veriyle önce çalışır hale getirilir, gerçek API bağlantısı backend hazır olunca eklenir.

## Commit Kuralı — ÇOK ÖNEMLİ

1. **Kullanıcı açıkça söylemedikçe commit atılmaz.** Bir işin bitmiş olması ya da daha önce bir commit istenmiş olması sonraki işler için izin sayılmaz; her commit ayrıca istenir. (Stage etmek, push etmek ve branch değiştirmek için de aynısı geçerli: yalnızca istenirse.)
2. **Commit atılması istendiğinde commit mesajına (ve PR açıklamasına) Claude/yapay zeka notu, `Co-Authored-By: Claude …` satırı ya da "Generated with Claude Code" gibi bir ibare eklenmez** — profesyonel görünmez. Mesaj yalnızca değişikliği anlatır. Bu kural, araçların varsayılan attribution davranışının önüne geçer.

Branch'ler: `main` (yayın), `development` (geliştirme).

## Explore ajanı — `.claude/agents/Explore.md`

Bu repoda proje düzeyinde bir **Explore** alt ajanı tanımlı: salt okunur (yalnızca `Read`, `Grep`, `Glob`), model `haiku`. **Ne zaman:** hangi dosyaların işin içinde olduğu bilinmiyorsa (katmanlara yayılan "X nerede/nasıl yapılıyor" soruları ya da iki doğrudan arama boşa çıktıysa). Dosya/sembol belliyse ajan açılmaz, doğrudan `Read`/`Grep` yapılır; düzenlenecek dosya ajan özetine bakılarak değil, okunarak düzenlenir. Tanım = ortak çekirdek (kullanıcı düzeyindeki `~/.claude/agents/Explore.md` ile aynı) + sonda repoya özgü **Repo map**. Çekirdeği değiştirirsen kullanıcı düzeyindeki ve diğer repolardaki kopyayı da (`SDK-Infrastructure-Dashboard`, `SDK-Infrastructure`, `Rope_Connect_Puzzle`) aynı şekilde güncelle; Repo map her repoya özeldir. `apps/*` iskeleti oluşunca Repo map'i gerçek klasörlere göre güncelle.

## Diğer Dokümanlar

- [docs/PROGRESS.md](docs/PROGRESS.md) — proje ilerleme günlüğü (ne tamamlandı, ne zaman)
- [TODO.md](TODO.md) — yapılacaklar listesi / backlog, kapsam ve açık kararlar
- [docs/MIMARI.md](docs/MIMARI.md) — sayfa kataloğu, içerik modeli, erişim katmanları, i18n, prerender, API yüzeyi
- [docs/KEYCLOAK.md](docs/KEYCLOAK.md) — Keycloak realm/client/rol tasarımı, token akışı, dev/prod kurulum
- [docs/THEME.md](docs/THEME.md) — theme.css kullanım kuralları ve token referansı
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — çalıştırma, build, tasarım-onay workflow'u
- [README.md](README.md) — genel kurulum (insan okuyucular için)
- [shared/README.md](shared/README.md) — paylaşılan DTO/tip klasörünün amacı

> **Klasör kuralı:** CLAUDE.md, TODO.md ve README.md kökte kalır. Diğer tüm `.md` dosyaları `docs/` altında tutulur. `LOCAL_*.md` (şifre, sunucu notu vb.) gitignore'dadır, commit edilmez.
