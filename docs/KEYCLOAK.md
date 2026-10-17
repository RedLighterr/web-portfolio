# Keycloak

> **Durum (2026-10-17):** tasarım önerisi, koddan doğrulanmadı. Keycloak sürümü, ortam değişkeni adları ve `keycloak-js` API'si uygulama sırasında güncel Keycloak dokümanından **teyit edilmeli** (adlar sürümler arasında değişti: örn. `KEYCLOAK_ADMIN` → `KC_BOOTSTRAP_ADMIN_USERNAME`, hostname v1 → v2). Genel mimari: [MIMARI.md](MIMARI.md).

## 1. Neden ve ne için

Referans projede (SDK-Infrastructure-Dashboard) kimlik doğrulama custom JWT + kendi kullanıcı tablosu + Argon2 idi. Bu projede kullanıcı yönetimi, şifre, oturum, 2FA ve kaba kuvvet koruması **Keycloak'a** devredilir; backend yalnızca Keycloak'ın imzaladığı token'ı doğrular ve rolü okur. Backend'de şifre/kullanıcı tablosu **yoktur**.

Korunan iki katman (bkz. [MIMARI.md](MIMARI.md) "Erişim katmanları"):
- **Özel alan** → `private-viewer` rolü (veya `admin`)
- **Admin paneli** → `admin` rolü

## 2. Realm tasarımı

**Realm:** `portfolio`

| Ayar | Değer | Neden |
|---|---|---|
| Kullanıcı kaydı (registration) | **kapalı** | Özel alan davetle; herkes hesap açamaz |
| Login with email | açık | Davet edilenler e-postayla girer |
| Brute force detection | açık | Kaba kuvvet koruması (referanstaki `LoginThrottle`'ın karşılığı) |
| `admin` rolü için OTP | **zorunlu** (koşullu OTP akışı) | Admin hesabı tüm içeriği yönetir |
| Access token ömrü | ~5 dk | Kısa ömür; `keycloak-js` arka planda yeniler |
| SSO session idle / max | ~30 dk / ~10 sa | Ziyaretçi alanı için makul |

**Realm rolleri:**

| Rol | Verir |
|---|---|
| `private-viewer` | Özel alan: detaylı CV/referanslar, özel/NDA projeler, indirmeler |
| `admin` | Her şey (özel alan dahil) + admin paneli |

**Proje bazlı izin (karar 2026-10-17):** NDA projeleri rol ile değil, backend'deki `project_access` tablosuyla (Keycloak `sub` ↔ proje) açılır; Keycloak'ta proje başına rol/grup **oluşturulmaz**. İzin her istekte DB'den okunur, token'a gömülmez (kaldırılınca anında etkili). Ayrıntı: [MIMARI.md](MIMARI.md) §2.

## 3. Client'lar

| Client | Tür | Akış | Not |
|---|---|---|---|
| `portfolio-web` | public | Authorization Code + **PKCE (S256)** | SPA. Implicit ve direct access grants **kapalı**. Redirect URI: dev `http://localhost:5173/*`, prod `https://<alan-adı>/*`. Web origins: `+` |
| `portfolio-api` | (audience) | — | Token'ın `aud` değeri. `portfolio-web`'in dedicated scope'una **audience mapper** eklenir; backend `aud = portfolio-api` ister |
| `portfolio-admin-cli` | confidential, service account | client credentials | **İlk sürümde gerekli** (proje bazlı izin ekranı kullanıcı listesini buradan okur). Servis hesabına yalnızca `realm-management` → `view-users` (+ `query-users`) verilir — **salt okunur**. Client secret yalnızca backend'de (`KEYCLOAK_ADMIN_CLIENT_SECRET`, `.env`; realm export'una girmez). Kullanıcı oluşturma/davet (yazma yetkisi: `manage-users`) **sonraya**; o zamana kadar kullanıcılar Keycloak admin konsolundan oluşturulur |

**Rol claim'i:** Keycloak realm rollerini varsayılan olarak `realm_access.roles` içine iç içe koyar. `portfolio-web` scope'una bir "User Realm Role" mapper eklenir → düz, çok değerli `roles` claim'i. Backend `RoleClaimType = "roles"` kullanır (claims transformation gerekmez).

## 4. Token akışı

```
Tarayıcı (SPA)                     Keycloak (/auth)                 Backend (/api)
   │  login() ─── redirect + PKCE ──▶ │                                │
   │ ◀── code ────────────────────────│                                │
   │  code → token (keycloak-js) ────▶│                                │
   │ ◀── access + refresh token ──────│                                │
   │  GET /api/private/... (Authorization: Bearer) ──────────────────▶ │ imza (JWKS), iss, aud, exp, rol
   │ ◀───────────────────────────────────────────────────── 200 / 401 / 403
```

### Frontend (`apps/web/src/lib/auth.ts`)

- `keycloak-js` (resmî adapter). `init({ onLoad: 'check-sso', pkceMethod: 'S256', silentCheckSsoRedirectUri: <origin>/silent-check-sso.html })`.
- **Public sayfalar Keycloak'ı yüklemez** (prerender edilen sayfalar hafif kalsın, iframe/istek yok). `keycloak-js` yalnızca özel/admin chunk'ında ve header'daki "Giriş" tıklamasında dinamik import edilir.
- Token **yalnızca bellekte**; `localStorage`/`sessionStorage`'a yazılmaz. API çağrısından önce `updateToken(30)`.
- 401 → yeniden login; 403 → "erişim yok" ekranı (içerik değil).
- Logout: `keycloak.logout({ redirectUri: <origin>/<lang>/ })` + TanStack Query önbelleği temizlenir (referanstaki `queryClient.clear()` kalıbı).
- `silent-check-sso.html` `apps/web/public/` altında statik dosya (inline script içermemeli → CSP; Keycloak'ın önerdiği içerik **doğrulanacak**).

### Backend (`apps/src`)

- `Microsoft.AspNetCore.Authentication.JwtBearer`.
- `Authority` / `ValidIssuer` = **public** issuer (`https://<alan-adı>/auth/realms/portfolio`; dev'de `http://localhost:8081/auth/realms/portfolio`).
- `MetadataAddress` = **iç ağ** adresi (`http://keycloak:8080/auth/realms/portfolio/.well-known/openid-configuration`) — container içinden public alan adına çıkmak gerekmesin. Keycloak tarafında `KC_HOSTNAME_BACKCHANNEL_DYNAMIC=true` ile backchannel istekleri iç adresle cevaplanır (**doğrulanacak**).
- `ValidAudience = portfolio-api`, `RoleClaimType = "roles"`, `RequireHttpsMetadata` yalnızca Development'ta `false`.
- Politikalar: `Admin` (rol `admin`), `PrivateViewer` (rol `private-viewer` **veya** `admin`), `ProjectAccess` (resource-based: `project_access`'te `sub` + proje kaydı **veya** `admin`). `/api/public/*` anonim; `/api/private/*` girişli + öğe bazında `PrivateViewer` / `ProjectAccess`; `/api/admin/*` `Admin`. Varsayılan politika: kimlik doğrulanmış (yeni endpoint yanlışlıkla açık kalmasın — anonim olanlar `[AllowAnonymous]` ile işaretlenir).
- Entegrasyon testleri gerçek Keycloak'a değil, test imzalı token'a dayanır (test ortamında sabit anahtar ile `TokenValidationParameters`).

## 5. Sunucu kurulumu

### Image — `apps/keycloak/`

```
apps/keycloak/
  Dockerfile              quay.io/keycloak/keycloak:<sürüm> tabanlı; prod için `kc.sh build` (optimized)
  realm-export/
    portfolio-realm.json  realm, roller, client'lar, mapper'lar, akışlar — SIR VE KULLANICI İÇERMEZ
  db-init/
    01-keycloak-db.sh     Postgres ilk açılışta `keycloak` veritabanı + kullanıcısını oluşturur
  theme/                  Keycloakify projesi (login teması, React) — kendi package.json'ı
```

**Login teması (karar 2026-10-17): Keycloakify.** Giriş, şifre güncelleme, OTP ve hata sayfaları React ile yazılır; sitenin görünümüyle aynı olur.
- Kaynak `apps/keycloak/theme/` (ayrı Vite/Keycloakify projesi). Çıktı bir tema `.jar`'ı; Keycloak image'ının `providers/` klasörüne kopyalanır, realm'de login teması olarak seçilir.
- Build multi-stage Dockerfile'da (Node + Java/Maven — Keycloakify `.jar` üretimi için Maven ister); geliştirici makinesinde Java gerekmesin.
- **Token'lar tek kaynak:** `theme.css` ve `fonts.css` `apps/web`'de kalır; `shared/sync-types.mjs` kalıbındaki gibi bir senkron betiği tema projesine kopyalar, CI `--check` ile eskimeyi yakalar (Docker build context'i yalnızca `apps/keycloak`'u görür). Theme Kuralı burada da geçerli: tema bileşenleri `var(--…)` kullanır.
- Tema sayfaları da TR + EN (Keycloak'ın locale desteği; realm'de iki dil açık, varsayılan `lang` cookie'sine/tarayıcıya göre).
- **Doğrulanacak:** Keycloakify sürümünün kullanılan Keycloak sürümüyle uyumu (her Keycloak yükseltmesinde kontrol edilir); Keycloakify'ın dev modu (Storybook / `npx keycloakify start-keycloak`) dev compose'a nasıl bağlanacağı.

- Realm açılışta `--import-realm` ile içe aktarılır. **Dikkat:** realm zaten varsa import atlanır; JSON'daki sonraki değişiklikler mevcut realm'e kendiliğinden uygulanmaz. Değişiklik akışı: konsolda yap → export al → JSON'u güncelle (ya da dev'de volume'u sıfırla). Bu akış [WORKFLOW.md](WORKFLOW.md)'de.
- `db-init` betiği yalnızca Postgres volume'u **ilk oluşturulurken** çalışır.
- Realm export'unda client secret, kullanıcı, şifre **olmaz**. Dev test kullanıcıları elle oluşturulur; bilgileri gitignore'daki `docs/LOCAL_*.md`'de tutulur (referans projedeki kural).

### Dev (`docker-compose.dev.yml`)

- `start-dev --import-realm`, port `8081:8080`, `KC_HTTP_RELATIVE_PATH=/auth`.
- Bootstrap admin: `.env`'den, boşsa dev varsayılanı (yalnızca dev).
- DB: aynı Postgres container'ında `keycloak` veritabanı.
- Vite dev sunucusu `:5173`, Keycloak `:8081` → farklı origin; dev'de CSP yok, `portfolio-web` redirect/web origin'i `http://localhost:5173`.

### Prod (`docker-compose.yml`)

- `start --optimized`, port **yayınlanmaz**; yalnızca nginx `/auth/` üzerinden.
- `KC_HOSTNAME=https://<alan-adı>/auth`, `KC_PROXY_HEADERS=xforwarded`, `KC_HTTP_ENABLED=true` (TLS önde sonlanır), `KC_HEALTH_ENABLED=true`.
- nginx: `/auth/admin/` ve `/auth/realms/master/` **dışarıya kapalı** (403). Admin konsoluna SSH tüneliyle erişilir.
- Sırlar zorunlu (referanstaki `SecretRules` kalıbı, `.env.example`'da üretme komutlarıyla): `KEYCLOAK_DB_PASSWORD`, `KC_BOOTSTRAP_ADMIN_PASSWORD` (ilk açılıştan sonra kalıcı admin oluşturulup bootstrap hesabı silinir), `KEYCLOAK_ADMIN_CLIENT_SECRET` (`portfolio-admin-cli`).
- **Açık karar (Faz 4'e ertelendi, 2026-10-17):** hosting ve TLS'i kim sonlandırıyor (sunucudaki nginx/Caddy, Cloudflare)? Keycloak `KC_HOSTNAME` ve cookie'ler HTTPS varsayar.

## 6. Kullanıcı yönetimi (başlangıç)

1. Keycloak admin konsolu → `portfolio` realm → Users → Add user (e-posta).
2. Role mapping: `private-viewer` (genel özel içerik gerekiyorsa). Yalnızca belirli NDA projelerini görecekse rol gerekmez: kullanıcı oluşturulduktan sonra admin panelinde `/admin/access`'ten projeye izin verilir.
3. Credentials: geçici şifre ("Temporary" açık) **veya** SMTP yapılandırıldıysa "Execute actions email" (Update Password).
4. Erişimi kaldırmak: rolü al veya kullanıcıyı devre dışı bırak; açık oturumlar Sessions'dan sonlandırılır (access token en geç ~5 dk'da düşer).

Admin panelinden davet (servis hesabıyla) sonraki bir iş — bkz. [../TODO.md](../TODO.md).
