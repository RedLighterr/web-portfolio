using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Backend.Contracts;
using Backend.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Tests;

public class AuthTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpResponseMessage> GetMe(string? token)
    {
        var client = factory.CreateClient();
        if (token is not null) client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.GetAsync("/api/me");
    }

    [Fact]
    public async Task Health_is_anonymous_and_reports_database_state()
    {
        var response = await factory.CreateClient().GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.Equal("ok", body!.Status);
        Assert.False(body.Database);
    }

    [Fact]
    public async Task Endpoints_require_login_by_default()
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await GetMe(null)).StatusCode);
    }

    [Fact]
    public async Task Valid_keycloak_token_exposes_identity_and_realm_roles()
    {
        var response = await GetMe(ApiFactory.CreateToken(["private-viewer", "admin"]));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var me = await response.Content.ReadFromJsonAsync<MeResponse>();
        Assert.Equal("user-1", me!.Subject);
        Assert.Equal("tester", me.Username);
        Assert.Equal(["admin", "private-viewer"], me.Roles);
    }

    public static TheoryData<string> InvalidTokens => new()
    {
        ApiFactory.CreateToken([], audience: "some-other-client"),
        ApiFactory.CreateToken([], issuer: "https://evil.test/auth/realms/portfolio"),
        ApiFactory.CreateToken([], expires: DateTime.UtcNow.AddMinutes(-5)),
        ApiFactory.CreateToken([], key: new SymmetricSecurityKey(Encoding.UTF8.GetBytes("another-key-that-is-long-enough-0123456789"))),
        "not-a-jwt",
    };

    [Theory]
    [MemberData(nameof(InvalidTokens))]
    public async Task Wrong_audience_issuer_expiry_or_signature_is_rejected(string token)
    {
        Assert.Equal(HttpStatusCode.Unauthorized, (await GetMe(token)).StatusCode);
    }

    private static ClaimsPrincipal User(params string[] roles) => new(new ClaimsIdentity(
        roles.Select(r => new Claim(KeycloakClaims.Roles, r)).Append(new Claim(KeycloakClaims.Subject, "user-1")),
        authenticationType: "test",
        nameType: KeycloakClaims.Username,
        roleType: KeycloakClaims.Roles));

    [Theory]
    [InlineData(Policies.Admin, new[] { "admin" }, true)]
    [InlineData(Policies.Admin, new[] { "private-viewer" }, false)]
    [InlineData(Policies.Admin, new string[0], false)]
    [InlineData(Policies.PrivateViewer, new[] { "private-viewer" }, true)]
    [InlineData(Policies.PrivateViewer, new[] { "admin" }, true)]
    [InlineData(Policies.PrivateViewer, new string[0], false)]
    public async Task Policies_follow_realm_roles(string policy, string[] roles, bool allowed)
    {
        using var scope = factory.Services.CreateScope();
        var authorization = scope.ServiceProvider.GetRequiredService<IAuthorizationService>();

        var result = await authorization.AuthorizeAsync(User(roles), policy);

        Assert.Equal(allowed, result.Succeeded);
    }
}
