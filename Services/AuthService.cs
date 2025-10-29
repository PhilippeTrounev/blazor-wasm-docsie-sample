using System.Net.Http.Json;

namespace blazor_wasm_docsie_sample.Services;

public class AuthService
{
    private readonly HttpClient _httpClient;
    private const string API_BASE_URL = "http://localhost:5145";

    public AuthService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string?> GetJwtTokenAsync()
    {
        try
        {
            var response = await _httpClient.PostAsync($"{API_BASE_URL}/api/auth/token", null);

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<TokenResponse>();
                return result?.Token;
            }

            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting JWT token: {ex.Message}");
            return null;
        }
    }
}

public class TokenResponse
{
    public string Token { get; set; } = string.Empty;
}
