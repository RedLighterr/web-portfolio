# shared

Frontend ve backend arasında paylaşılan kaynaklar. *(Dosyalar Faz 0'da oluşturulacak — bkz. [../TODO.md](../TODO.md).)*

- `api-types.ts` — Public, Özel ve Admin API tip tanımları (**tek kaynak**). Backend karşılığı: `apps/src/Contracts/`. Public ve özel görünümler **ayrı tiplerdir** (bkz. [../CLAUDE.md](../CLAUDE.md) Erişim Kuralı): public tiplerde özel alan bulunmaz.
- `sync-types.mjs` — `api-types.ts`'i `apps/web/src/lib/apiTypes.ts`'e kopyalar (Docker build context'i yalnızca `apps/web`'i gördüğü için doğrudan import edilemez).
  - `node shared/sync-types.mjs` — kopyayı günceller
  - `node shared/sync-types.mjs --check` — kopya eskiyse hata verir (CI)

Backend'de bir DTO değişince `api-types.ts`'i de güncelle, sonra sync çalıştır.
