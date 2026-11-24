namespace Backend.Contracts;

// Frontend karşılığı: shared/api-types.ts (HealthResponse, MeResponse). Biri değişince diğeri de değişmeli.

/// <summary>GET /api/health — anonim.</summary>
public sealed record HealthResponse(string Status, bool Database);

/// <summary>GET /api/me — giriş gerekli. Keycloak token'ındaki kimlik ve realm rolleri.</summary>
public sealed record MeResponse(string Subject, string? Username, IReadOnlyList<string> Roles);
