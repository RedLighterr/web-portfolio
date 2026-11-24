// API tip tanımları — TEK KAYNAK. Backend karşılığı: apps/src/Contracts/. Backend'de bir kayıt değişince burası da değişmeli.
//
// Frontend bu dosyanın bir kopyasını kullanır (apps/web/src/lib/apiTypes.ts) çünkü Docker build
// context'i yalnızca apps/web'i görür. Kopyayı güncellemek için: `node shared/sync-types.mjs`
// (CI'da `--check` ile drift yakalanır).
//
// Serileştirme: JSON alanları camelCase. Public ve özel görünümler AYRI tiplerdir; public tiplerde özel alan
// (telefon, adres, referans, NDA detayı, dosya linki) bulunmaz — bkz. CLAUDE.md Erişim Kuralı.

/** GET /api/health — anonim. */
export interface HealthResponse {
  status: 'ok'
  /** Veritabanına bağlanılabiliyor mu (yalnızca bilgi; servis yine ayakta sayılır). */
  database: boolean
}

/** GET /api/me — giriş gerekli. Keycloak token'ındaki kimlik ve realm rolleri. */
export interface MeResponse {
  /** Keycloak kullanıcı kimliği (`sub`). */
  subject: string
  username: string | null
  roles: string[]
}
