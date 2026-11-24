using Npgsql;

namespace Backend.Security;

// Production'da sırlar elle girilir ve zorunludur: boş, repoda açıkça duran örnek/varsayılan değer ya da zayıf
// değer varsa uygulama açılmaz (Program.cs, Development/Testing dışındaki her ortamda). Zorunlu ayarlar (Keycloak
// issuer) da burada denetlenir. Hata mesajları sırrın kendisini asla içermez (log'a sızmasın).
// Keycloak sırları (KEYCLOAK_ADMIN_CLIENT_SECRET) servis hesabı kullanılmaya başlayınca buraya eklenecek.
public static class SecretRules
{
    public const int MinDbPasswordLength = 16;

    // Repodaki dev varsayılanı (`docker-compose.dev.yml`) ve yaygın varsayılanlar.
    private static readonly string[] KnownDbPasswords = ["portfolio", "postgres", "password", "changeme"];

    public static IReadOnlyList<string> Validate(string? connectionString, string? keycloakAuthority)
    {
        var problems = new List<string>();

        var dbPassword = ReadDbPassword(connectionString, problems);
        if (dbPassword is not null)
        {
            if (dbPassword.Length == 0)
                problems.Add("POSTGRES_PASSWORD boş.");
            else if (KnownDbPasswords.Contains(dbPassword, StringComparer.OrdinalIgnoreCase))
                problems.Add("POSTGRES_PASSWORD bilinen bir varsayılan değer; production için güçlü bir şifre üret.");
            else if (dbPassword.Length < MinDbPasswordLength)
                problems.Add($"POSTGRES_PASSWORD en az {MinDbPasswordLength} karakter olmalı.");
        }

        if (string.IsNullOrWhiteSpace(keycloakAuthority))
            problems.Add("Keycloak:Authority boş (PUBLIC_URL'i ayarla).");
        else if (!Uri.TryCreate(keycloakAuthority, UriKind.Absolute, out var authority)
                 || (authority.Scheme != Uri.UriSchemeHttps && authority.Scheme != Uri.UriSchemeHttp))
            problems.Add("Keycloak:Authority geçerli bir http(s) adresi değil (PUBLIC_URL'i kontrol et).");

        return problems;
    }

    private static string? ReadDbPassword(string? connectionString, List<string> problems)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            problems.Add("ConnectionStrings:Default boş.");
            return null;
        }

        try
        {
            return new NpgsqlConnectionStringBuilder(connectionString).Password ?? "";
        }
        catch (ArgumentException)
        {
            problems.Add("ConnectionStrings:Default okunamadı.");
            return null;
        }
    }
}
