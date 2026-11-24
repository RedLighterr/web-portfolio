using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Tests;

// Gerçek Keycloak yerine test anahtarıyla imzalanmış token (docs/KEYCLOAK.md §4): JwtBearer'ın discovery'si statik
// bir yapılandırmayla değiştirilir, doğrulama kuralları (issuer, audience, süre, rol claim'i) üretimdekiyle aynı kalır.
// Veritabanı yok: bağlantı dizesi kapalı bir porta işaret eder (sağlık uç noktası "database: false" döner).
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const string Issuer = "https://keycloak.test/auth/realms/portfolio";
    public const string Audience = "portfolio-api";

    public static readonly SymmetricSecurityKey SigningKey = new(Encoding.UTF8.GetBytes("test-only-signing-key-0123456789abcdef0123"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", "Host=127.0.0.1;Port=1;Database=x;Username=x;Password=x;Timeout=1");
        builder.UseSetting("Keycloak:Authority", Issuer);
        builder.UseSetting("Keycloak:Audience", Audience);
        builder.ConfigureTestServices(services =>
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.ConfigurationManager = new StaticConfigurationManager<OpenIdConnectConfiguration>(
                    new OpenIdConnectConfiguration { Issuer = Issuer });
                options.TokenValidationParameters.IssuerSigningKey = SigningKey;
            }));
    }

    public static string CreateToken(
        string[] roles,
        string issuer = Issuer,
        string audience = Audience,
        DateTime? expires = null,
        SecurityKey? key = null)
    {
        var expiresAt = expires ?? DateTime.UtcNow.AddMinutes(5);
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = issuer,
            Audience = audience,
            IssuedAt = expiresAt.AddMinutes(-10),
            NotBefore = expiresAt.AddMinutes(-10),
            Expires = expiresAt,
            Claims = new Dictionary<string, object>
            {
                ["sub"] = "user-1",
                ["preferred_username"] = "tester",
                ["roles"] = roles,
            },
            SigningCredentials = new SigningCredentials(key ?? SigningKey, SecurityAlgorithms.HmacSha256),
        });
    }
}
