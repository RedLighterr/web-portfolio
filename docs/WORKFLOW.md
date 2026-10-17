# Workflow

> **Durum (2026-10-17):** compose dosyaları ve `apps/*` henüz yok; aşağıdaki komutlar Faz 0 iskeleti kurulunca geçerli olur (bkz. [../TODO.md](../TODO.md)).

## Çalıştırma (test / hot-reload)

Kullanıcı **"çalıştır"** veya **"test et"** dediğinde:

```bash
docker compose -f docker-compose.dev.yml up
```

- Frontend: `http://localhost:5173` (`Dockerfile.dev`, volume mount `./apps/web:/app`, `CHOKIDAR_USEPOLLING=true`)
- Backend: `http://localhost:5247` (`Dockerfile.dev`, volume mount `./apps/src:/app`, `dotnet watch`)
- Keycloak: `http://localhost:8081/auth` (`start-dev --import-realm`; admin konsolu `/auth/admin`)
- Postgres: `localhost:5432` (veritabanları: `portfolio`, `keycloak`)

Kod değişiklikleri container içine mount edildiği için anında yansır, image yeniden build gerekmez. Dev'de prerender çalışmaz; Vite SPA modunda servis eder (prerender'ı denemek için "build al").

## Build

Kullanıcı **"build al"** dediğinde:

```bash
docker compose up --build
```

- Site (nginx): `http://localhost:8080` — `/api/` → backend, `/auth/` → Keycloak, public rotalar prerender çıktısından.
- Backend, Keycloak ve Postgres portları dışarı açılmaz.
- `docker-compose.yml` volume mount kullanmaz (kod image'a bake edilir); kalıcı veriler volume'da: `db-data`, `media-data`, `site-prerender`.
- Production sırları `.env`'de zorunlu (bkz. `.env.example`); boş/örnek değerle backend açılmaz.

## Tasarım → Kod Süreci

Yeni bir sayfa veya UI component'i eklenirken sıra şaşmaz:

1. **Frontend design tool** ile tasarım oluşturulur (görsel/layout/etkileşim). Public sayfalarda iki dil ve light/dark birlikte düşünülür.
2. Tasarım **Artifact aracıyla doğrulanır** — kullanıcıya gösterilir, onay beklenir. Onay alınmadan bir sonraki adıma geçilmez.
3. Onay sonrası tasarım React component'ine çevrilir:
   - Tüm görsel değerler `theme.css` semantic token'larından `var(--...)` ile referans alınır (bkz. [THEME.md](THEME.md)) — kopyalama/hardcode yok.
   - Yeni bir token gerekiyorsa önce `theme.css`'e eklenir, sonra component onu referans alır.
   - Metinler `i18n/tr.json` + `en.json`'a birlikte eklenir.

## Geliştirme sırası

Backend'den önce her zaman frontend yapılır (bkz. [../CLAUDE.md](../CLAUDE.md)). Yeni özellik: önce frontend mock veriyle, backend en sona bırakılır. Özel alan/admin mock verisi gerçek kişisel veri içermez (Erişim Kuralı).

## İçerik yayınlama (prod)

1. Admin panelinde içerik düzenlenir (taslak → yayın).
2. Canlı SPA değişikliği hemen gösterir (API'den).
3. SEO/paylaşım çıktısı için **Admin → Yayınla**: backend bir `publish_jobs` kaydı açar, prerender servisi public sayfaları yeniden üretir, `current` atomik olarak yeni sürüme geçer. Hata olursa eski sürüm servis edilmeye devam eder; hata admin panelinde görünür.

Ayrıntı → [MIMARI.md](MIMARI.md) "Prerender hattı".

## Keycloak realm değişikliği

Realm tanımı `apps/keycloak/realm-export/portfolio-realm.json`'da (sır ve kullanıcı içermez). Import yalnızca realm yokken çalışır, bu yüzden:

1. Değişikliği dev Keycloak konsolunda yap (`http://localhost:8081/auth/admin`).
2. Realm'i dışa aktar (konsol "Partial export" veya `kc.sh export --realm portfolio`), kullanıcıları ve sırları **çıkar**, JSON'u güncelle.
3. Doğrulamak için dev'de Keycloak'ı temiz başlat (yalnızca dev'de: `keycloak` veritabanını sıfırla) → realm JSON'dan yeniden içe aktarılır.
4. Prod'daki mevcut realm'e değişiklik **elle** (konsoldan, SSH tüneliyle) uygulanır; JSON yeniden import edilmez.

Ayrıntı → [KEYCLOAK.md](KEYCLOAK.md).

## Task akışı

Her task başında: [../CLAUDE.md](../CLAUDE.md) üstündeki kurala göre önce [PROGRESS.md](PROGRESS.md) ve [../TODO.md](../TODO.md) okunur. Task bitince:

- Tamamlanan iş `PROGRESS.md`'ye tarih + kısa açıklama ile eklenir (en yeni en üstte; alınan kullanıcı kararları ve commit edilip edilmediği belirtilir).
- İlgili madde `TODO.md`'den kaldırılır (veya kapsam değiştiyse güncellenir).
- Açık bir kararı kapatan task, kararı `TODO.md` "Kapsam kararları"na tarihle taşır.
