using Microsoft.AspNetCore.Authorization;

namespace Backend.Security;

/// <summary>Keycloak realm rolleri (docs/KEYCLOAK.md §2).</summary>
public static class Roles
{
    public const string Admin = "admin";
    public const string PrivateViewer = "private-viewer";
}

// Erişim katmanları (docs/MIMARI.md §2). Proje bazlı izin (`ProjectAccess`) içerik modeliyle birlikte gelecek.
public static class Policies
{
    public const string Admin = "Admin";
    public const string PrivateViewer = "PrivateViewer";

    public static void Configure(AuthorizationOptions options)
    {
        // Varsayılan: her endpoint giriş ister. Public uçlar [AllowAnonymous] ile açıkça işaretlenir — yeni bir
        // endpoint yanlışlıkla herkese açık kalmasın (CLAUDE.md Erişim Kuralı).
        options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();

        options.AddPolicy(Admin, policy => policy.RequireAuthenticatedUser().RequireRole(Roles.Admin));
        options.AddPolicy(PrivateViewer, policy => policy.RequireAuthenticatedUser().RequireRole(Roles.PrivateViewer, Roles.Admin));
    }
}
