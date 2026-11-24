using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Security;

// Keycloak'ın imzaladığı access token'ı doğrular (bkz. docs/KEYCLOAK.md §4). Backend'de kullanıcı/şifre tablosu yok.
public sealed class KeycloakOptions
{
    public const string Section = "Keycloak";

    /// <summary>Public issuer — token'daki `iss` (örn. https://alan-adi/auth/realms/portfolio).</summary>
    public string Authority { get; set; } = "";

    /// <summary>
    /// İç ağdan discovery adresi (http://keycloak:8080/auth/realms/portfolio/.well-known/openid-configuration):
    /// container'ın public alan adına çıkması gerekmesin. Boşsa Authority'den türetilir.
    /// </summary>
    public string? MetadataAddress { get; set; }

    /// <summary>Token'ın `aud` değeri (portfolio-web scope'undaki audience mapper ekler).</summary>
    public string Audience { get; set; } = "portfolio-api";

    /// <summary>Discovery/JWKS HTTPS ile mi alınmalı. İç ağ adresi http olduğundan compose'da false.</summary>
    public bool RequireHttpsMetadata { get; set; } = true;
}

public static class KeycloakClaims
{
    public const string Subject = "sub";
    public const string Username = "preferred_username";
    /// <summary>Realm rolleri — "User Realm Role" mapper'ı ile düz, çok değerli claim (docs/KEYCLOAK.md §3).</summary>
    public const string Roles = "roles";
}

public static class KeycloakAuthentication
{
    public static IServiceCollection AddKeycloakAuthentication(this IServiceCollection services)
    {
        services.AddOptions<KeycloakOptions>().BindConfiguration(KeycloakOptions.Section);
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        // Ayarlar seçenekler ilk kullanıldığında okunur (host kurulduktan sonra verilen yapılandırma da görünsün).
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<KeycloakOptions>>((options, keycloak) => Apply(options, keycloak.Value));
        return services;
    }

    private static void Apply(JwtBearerOptions options, KeycloakOptions keycloak)
    {
        options.Authority = keycloak.Authority;
        if (!string.IsNullOrWhiteSpace(keycloak.MetadataAddress)) options.MetadataAddress = keycloak.MetadataAddress;
        options.RequireHttpsMetadata = keycloak.RequireHttpsMetadata;
        // Claim adları Keycloak'taki gibi kalsın (sub, roles…); WS-Federation URI'lerine çevrilmesin.
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = keycloak.Authority,
            ValidateAudience = true,
            ValidAudience = keycloak.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = KeycloakClaims.Username,
            RoleClaimType = KeycloakClaims.Roles,
        };
    }
}
