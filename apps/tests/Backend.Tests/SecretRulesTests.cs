using Backend.Security;

namespace Backend.Tests;

// Production açılış kontrolü: sırlar ve zorunlu ayarlar; repodaki örnek değerler ve zayıf sırlar reddedilir.
public class SecretRulesTests
{
    private const string GoodConn = "Host=db;Port=5432;Database=portfolio;Username=portfolio;Password=9f2c4e8a1b7d3f6e0a5c";
    private const string GoodAuthority = "https://example.com/auth/realms/portfolio";

    [Fact]
    public void Strong_settings_pass()
    {
        Assert.Empty(SecretRules.Validate(GoodConn, GoodAuthority));
        // Yerel prod denemesi (docker compose up, http://localhost:8080) da geçerli.
        Assert.Empty(SecretRules.Validate(GoodConn, "http://localhost:8080/auth/realms/portfolio"));
    }

    [Theory]
    [InlineData("Host=db;Username=portfolio;Password=portfolio")]
    [InlineData("Host=db;Username=portfolio;Password=Postgres")]
    [InlineData("Host=db;Username=portfolio;Password=")]
    [InlineData("Host=db;Username=portfolio")]
    [InlineData("Host=db;Username=portfolio;Password=short123")]
    public void Db_password_must_be_set_not_known_default_and_long_enough(string conn)
    {
        var problems = SecretRules.Validate(conn, GoodAuthority);
        Assert.Single(problems);
        Assert.StartsWith("POSTGRES_PASSWORD", problems[0]);
    }

    [Fact]
    public void Missing_or_unreadable_connection_string_is_reported()
    {
        Assert.Contains(SecretRules.Validate("", GoodAuthority), p => p.StartsWith("ConnectionStrings:Default"));
        Assert.Contains(SecretRules.Validate("this is not=a;valid;;conn==string", GoodAuthority), p => p.StartsWith("ConnectionStrings:Default"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("/auth/realms/portfolio")]
    [InlineData("ftp://example.com/auth/realms/portfolio")]
    public void Keycloak_authority_must_be_an_absolute_http_url(string? authority)
    {
        var problems = SecretRules.Validate(GoodConn, authority);
        Assert.Single(problems);
        Assert.StartsWith("Keycloak:Authority", problems[0]);
    }

    [Fact]
    public void Messages_never_contain_the_secret()
    {
        const string secret = "portfolio";
        foreach (var problem in SecretRules.Validate($"Host=db;Username=x;Password={secret}", GoodAuthority))
            Assert.DoesNotContain($"={secret}", problem);
        const string shortSecret = "s3cr3t-short";
        foreach (var problem in SecretRules.Validate($"Host=db;Username=x;Password={shortSecret}", GoodAuthority))
            Assert.DoesNotContain(shortSecret, problem);
    }
}
