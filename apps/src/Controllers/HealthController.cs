using Backend.Contracts;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/health")]
[AllowAnonymous]
public class HealthController(AppDbContext db) : ControllerBase
{
    private static readonly TimeSpan DatabaseTimeout = TimeSpan.FromSeconds(2);

    /// <summary>Servis ayakta mı; veritabanı durumu yalnızca bilgi (DB yokken de 200 döner).</summary>
    [HttpGet]
    public async Task<HealthResponse> Get(CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(DatabaseTimeout);
        bool database;
        try
        {
            database = await db.Database.CanConnectAsync(timeout.Token);
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            database = false;
        }
        return new HealthResponse("ok", database);
    }
}
