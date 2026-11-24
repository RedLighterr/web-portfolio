using System.Security.Claims;
using Backend.Contracts;
using Backend.Security;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

// Yetki: varsayılan (fallback) politika — giriş yeterli (bkz. Security/Policies.cs).
[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    [HttpGet]
    public MeResponse Get() => new(
        User.FindFirstValue(KeycloakClaims.Subject) ?? "",
        User.FindFirstValue(KeycloakClaims.Username),
        User.FindAll(KeycloakClaims.Roles).Select(c => c.Value).Order(StringComparer.Ordinal).ToArray());
}
