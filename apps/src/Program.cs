using System.Text.Json.Serialization;
using Backend.Data;
using Backend.Security;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Production'da sırlar ve zorunlu ayarlar: boş / repodaki örnek değer / zayıf değer varsa açılmadan dur
// (bkz. Security/SecretRules.cs).
if (!builder.Environment.IsDevelopment() && !builder.Environment.IsEnvironment("Testing"))
{
    var problems = SecretRules.Validate(
        builder.Configuration.GetConnectionString("Default"),
        builder.Configuration["Keycloak:Authority"]);
    if (problems.Count > 0)
    {
        throw new InvalidOperationException(
            "Production ayarları uygun değil (.env'i düzelt, bkz. .env.example):\n- " + string.Join("\n- ", problems));
    }
}

builder.Services.AddControllers()
    // Enum'lar API'de metin olarak gider — frontend tipleriyle (shared/api-types.ts) aynı.
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

// Bağlantı dizesi DbContext kurulurken okunur (host kurulduktan sonra verilen yapılandırma da görünsün — testler).
// Migration'lar ilk entity ile (Faz 3) eklenecek; o zaman açılışta Database.Migrate() çağrılacak.
builder.Services.AddDbContext<AppDbContext>((services, options) =>
    options.UseNpgsql(services.GetRequiredService<IConfiguration>().GetConnectionString("Default")));

// Prod'da backend yalnızca nginx proxy'sinin arkasında (portu dışarı açık değil, bkz. docker-compose.yml) —
// istemci IP'si ve şema X-Forwarded-* başlıklarından alınır.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddKeycloakAuthentication();
builder.Services.AddAuthorization(Policies.Configure);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

app.UseForwardedHeaders();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// WebApplicationFactory<Program> (entegrasyon testleri) için üst düzey ifadelerin Program tipini görünür kılar.
public partial class Program;
