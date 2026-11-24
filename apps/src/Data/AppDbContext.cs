using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

// Uygulama veritabanı (portfolio). İçerik modeli Faz 3'te eklenecek (docs/MIMARI.md §4: ana tablolar +
// `*_translations` tabloları, `project_access`, `publish_jobs` …). Keycloak'ın kendi veritabanı ayrıdır.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
}
