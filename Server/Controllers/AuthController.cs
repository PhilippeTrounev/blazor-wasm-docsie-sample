using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BlazorDocsieAuth.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // In production, validate credentials against your database
        // For demo purposes, we'll accept any username/password
        if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Username and password are required" });
        }

        // Generate JWT token
        var token = GenerateJwtToken(request.Username);

        return Ok(new { token });
    }

    [HttpPost("token")]
    public IActionResult GetToken()
    {
        // Simple endpoint that generates a token without credentials
        // Useful for testing
        var token = GenerateJwtToken("demo-user");
        return Ok(new { token });
    }

    [HttpGet("login")]
    public IActionResult LoginPage()
    {
        // Serve the login HTML page
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Views", "login.html");

        if (System.IO.File.Exists(filePath))
        {
            var html = System.IO.File.ReadAllText(filePath);
            return Content(html, "text/html");
        }

        return NotFound("Login page not found");
    }

    private string GenerateJwtToken(string username)
    {
        var masterKey = _configuration["DOCSIE_MASTER_KEY"]
            ?? throw new InvalidOperationException("DOCSIE_MASTER_KEY not configured");

        var expiryMinutes = int.Parse(_configuration["JWT_EXPIRY_MINUTES"] ?? "60");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(masterKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        // IMPORTANT: Docsie only expects the 'exp' claim in the JWT
        // Match exactly what Docsie's backend generates: jwt.encode({'exp': exp}, master_key)
        var token = new JwtSecurityToken(
            issuer: null,  // No issuer
            audience: null,  // No audience
            claims: null,  // No custom claims
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        _logger.LogInformation("Generated JWT token for user: {Username} (exp only)", username);

        return tokenString;
    }
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
