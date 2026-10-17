# PROGRESS.md

Proje ilerleme günlüğü. En yeni kayıt en üstte. Her task tamamlandığında buraya bir madde eklenir.

## 2026-10-17 — Açık kararlar turu (TODO 23–35)

Kullanıcıyla soru-cevap; 10 açık karar kapandı, kararlar `TODO.md` "Teknik kararlar"a taşındı ve dokümanlara işlendi (`MIMARI.md`, `KEYCLOAK.md`, `THEME.md`, `CLAUDE.md`). Commit edilmedi.
- Önerilenden farklı seçilenler ve etkileri: **`*_translations` tabloları** (jsonb yerine); **baştan proje bazlı NDA izni** → `project_access` tablosu, `ProjectAccess` politikası, `/admin/access` ekranı, salt okunur Keycloak servis hesabı (`portfolio-admin-cli`) ilk sürüme alındı; **public + özel WebGL demoları** → yeni §6a (sandbox'lı iframe, ayrı CSP, özel demoda imzalı URL + `auth_request`), `demos` tablosu; **Cloudflare Turnstile** → global CSP'ye tek dış kaynak; **Keycloakify** → `apps/keycloak/theme/`, theme.css senkronu, Node + Maven multi-stage build.
- Önerildiği gibi: özel router, özel i18n hook'u, sürekli çalışan prerender servisi, harici `theme-init.js`, `/` yönlendirmesi (`lang` cookie → `Accept-Language` → varsayılan `/en/`; önceki taslakta varsayılan `/tr/` idi).
- Açık kalanlar: font seti ve marka tonu (Faz 1 tasarım), hosting/TLS (Faz 4'e ertelendi).

## 2026-10-17 — Lisans: MIT → özel kod lisansı + içerik için CC BY-NC-ND 4.0

Kullanıcı isteği: kod değiştirilmeden kullanılırsa satılamasın ve kaynak belirtilsin; değiştirilirse satılabilsin ve değişiklikler istenen lisansla lisanslanabilsin. Bunu karşılayan standart açık kaynak lisansı olmadığı için özel metin yazıldı (OSI onaylı değil, GitHub "Other" olarak gösterir). Commit edilmedi.
- `LICENSE` — "Web Portfolio License 1.0": değiştirilmemiş kopya (yalnızca "önemsiz değişiklik" yapılmış hali dahil) ticari olmayan kullanım + görünür kaynak; değiştirilmiş sürüm ticari kullanılabilir, kaynak kodunda telif notu korunur. "Önemsiz değişiklik" (yeniden adlandırma, biçim, ayar/tema/içerik değişimi vb.) açıkça tanımlı; böylece değişken adı değiştirip satma açığı kapatıldı.
- `LICENSE-CONTENT` — kişisel içerik CC BY-NC-ND 4.0; özel alan içeriği tüm hakları saklı; ad/logo marka hakkı verilmez.
- `README.md` lisans bölümü güncellendi.

## 2026-10-17 — Proje temeli: dokümanlar ve kapsam kararları

Kullanıcıyla soru-cevap ile projenin temeli belirlendi; yalnızca dokümanlar oluşturuldu (kod iskeleti yok — kullanıcı kararı, sonraki adım [../TODO.md](../TODO.md) "Faz 0"). Commit edilmedi.
- **Temel:** web temeli ve klasör yapısı `C:\Users\mfurk\Unity Projects\SDK-Infrastructure-Dashboard` ile aynı (React 19 + TS + Vite 8, ASP.NET Core .NET 9, Postgres 17, oxlint/vitest, Docker Compose dev/prod, nginx + CSP, iki katmanlı `theme.css`, Fontsource, tema denetim testleri, CLAUDE/TODO/PROGRESS düzeni). Ek: Keycloak (`apps/keycloak/`), i18n, prerender hattı.
- **Kararlar:** Keycloak admin paneli + özel alanları korur (özel: detaylı CV/referanslar, NDA projeler, demo/build indirmeleri); Keycloak compose içinde, realm repoda JSON; backend .NET 9 + Postgres; tema yapısı aynı, marka turuncu/amber, fontlar daha kişisel bir set (seçim tasarımda); TR + EN; public bölümler hakkımda/CV, projeler, blog, iletişim formu; içerik DB + admin panel, SEO için build-time prerender + "Yayınla" ile yeniden prerender. Taşınan kurallar: commit kuralı, tasarım → Artifact onayı → kod, önce frontend, erişim kuralı (uyarlanmış).
- **Oluşturulan dosyalar:** `CLAUDE.md`, `TODO.md`, `README.md`, `docs/MIMARI.md`, `docs/KEYCLOAK.md`, `docs/THEME.md`, `docs/WORKFLOW.md`, `docs/PROGRESS.md`, `shared/README.md`, `.claude/agents/Explore.md` (ortak çekirdek + bu repoya Repo map), `.gitignore`.
