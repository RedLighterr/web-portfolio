# web-portfolio

Kişisel portfolyo sitesi: herkese açık vitrin (hakkımda/CV, projeler, blog, iletişim) + Keycloak ile korunan özel alan ve admin paneli. TR + EN.

> Proje iskelet aşamasında: arayüz geçici, Keycloak servisi henüz eklenmedi (bkz. [TODO.md](TODO.md)).

Monorepo yapısı:

```
apps/
  web/        React + Vite (TypeScript) frontend
  src/        ASP.NET Core (.NET 9) Web API backend
  tests/      Backend testleri
  keycloak/   Keycloak image'ı ve realm tanımı
shared/       Frontend ve backend arasında paylaşılan kaynaklar (DTO/tip tanımları vb.)
docs/         Dokümantasyon
```

## Çalıştırma

Gerekenler: Docker + Docker Compose.

```bash
cp .env.example .env               # dev için sırlar boş kalabilir
docker compose -f docker-compose.dev.yml up
```

| Servis | Adres |
|---|---|
| Frontend (Vite, hot reload) | http://localhost:5173 |
| Backend API | http://localhost:5247 |
| Keycloak (henüz yok) | http://localhost:8081/auth |
| Postgres | localhost:5432 |

Docker olmadan: `cd apps/web && npm install && npm run dev` (frontend, `/api/` → `localhost:5247`) ve `cd apps/src && dotnet run` (.NET 9 SDK; `global.json` 9.0.318'e sabitler).

Production build (nginx, `http://localhost:8080`; `.env`'de sırlar zorunlu):

```bash
docker compose up --build
```

## Dokümanlar

- [docs/MIMARI.md](docs/MIMARI.md) — mimari, sayfa kataloğu, içerik modeli, prerender
- [docs/KEYCLOAK.md](docs/KEYCLOAK.md) — kimlik doğrulama ve kullanıcı yönetimi
- [docs/THEME.md](docs/THEME.md) — tema token'ları ve kuralları
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — geliştirme ve yayınlama akışı

## Lisans

- **Kod:** [Web Portfolio License 1.0](LICENSE) — kullanmak, incelemek ve değiştirmek serbest. Değiştirilmemiş kopya yalnızca ticari olmayan amaçla ve görünür kaynak belirterek kullanılabilir. Değiştirilmiş sürümler satılabilir ve değişiklikler istenen lisansla lisanslanabilir.
- **İçerik** (ad, logo, CV, yazılar, görseller): [CC BY-NC-ND 4.0](LICENSE-CONTENT). Özel alandaki içerik: tüm hakları saklı.
