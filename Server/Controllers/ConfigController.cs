using Microsoft.AspNetCore.Mvc;

namespace BlazorDocsieAuth.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ConfigController> _logger;

    public ConfigController(IConfiguration configuration, ILogger<ConfigController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("docsie")]
    public IActionResult GetDocsieConfig()
    {
        var deploymentKey = _configuration["DOCSIE_DEPLOYMENT_KEY"];
        var redirectUrl = _configuration["DOCSIE_REDIRECT_URL"];

        if (string.IsNullOrEmpty(deploymentKey))
        {
            _logger.LogWarning("DOCSIE_DEPLOYMENT_KEY is not configured");
            return BadRequest(new { message = "DOCSIE_DEPLOYMENT_KEY is not configured in .env" });
        }

        if (string.IsNullOrEmpty(redirectUrl))
        {
            _logger.LogWarning("DOCSIE_REDIRECT_URL is not configured, using default");
            redirectUrl = "http://localhost:5145/api/auth/login";
        }

        _logger.LogInformation("Returning Docsie config: DeploymentKey={DeploymentKey}, RedirectUrl={RedirectUrl}",
            deploymentKey, redirectUrl);

        return Ok(new
        {
            deploymentId = deploymentKey,
            redirectUrl = redirectUrl
        });
    }
}
