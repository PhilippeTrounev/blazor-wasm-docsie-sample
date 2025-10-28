# Docsie Blazor WebAssembly Sample

Blazor WebAssembly example showing how to embed Docsie documentation in a client-side Blazor application.

## Requirements

- .NET SDK 9.0 or later (works on Mac, Windows, Linux)
- Any modern web browser

## Running the Sample

1. Navigate to the project directory:
   ```bash
   cd blazor-wasm-docsie-sample
   ```

2. Run the application:
   ```bash
   dotnet run
   ```

3. Open your browser to:
   - https://localhost:5001 (secure)
   - http://localhost:5000 (non-secure)

4. Click "Documentation" in the navigation menu

## What This Demonstrates

- **Blazor WASM Integration**: Shows how to embed Docsie in client-side Blazor applications
- **JavaScript Interop**: Uses JSInterop to load and manage external JavaScript library
- **Lifecycle Management**: Proper initialization and cleanup of Docsie script
- **DOM Isolation**: Prevents Blazor render tree from conflicting with Docsie's Inferno.js rendering

## Architecture

### The Challenge

Blazor WebAssembly manages its own virtual DOM. When external JavaScript frameworks (like Docsie's Inferno.js-based script-reader) try to render content, Blazor can wipe it out during re-renders.

### The Solution

1. **Use `@((MarkupString)"...")` to isolate the container** - This prevents Blazor from tracking the div
2. **Load Docsie via JavaScript module** - JSInterop loads the script dynamically
3. **Proper lifecycle management** - Initialize on first render, cleanup on dispose

## Files

- **Pages/Docs.razor** - Blazor component that hosts Docsie documentation
- **wwwroot/js/docsie-loader.js** - JavaScript module that manages Docsie script loading
- **Layout/NavMenu.razor** - Updated navigation with "Documentation" link

## How It Works

### 1. Docs.razor Component

```razor
@page "/docs"
@inject IJSRuntime JSRuntime
@implements IAsyncDisposable

<!-- Isolated from Blazor's render tree -->
@((MarkupString)"<div id=\"docsie-container\" data-ddsroot></div>")

@code {
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            module = await JSRuntime.InvokeAsync<IJSObjectReference>(
                "import", "./js/docsie-loader.js");

            await module.InvokeVoidAsync("initializeDocsie",
                "deployment_EFk3AIigMh599HRk6", null);
        }
    }
}
```

### 2. JavaScript Module (docsie-loader.js)

```javascript
export function initializeDocsie(deploymentId, jwtToken) {
    // Add CSS
    const style = document.createElement('link');
    style.href = 'https://lib.docsie.io/current/styles/docsie.css';
    document.head.appendChild(style);

    // Add script with configuration
    const script = document.createElement('script');
    script.src = 'https://lib.docsie.io/current/service.js';
    script.setAttribute('data-docsie',
        `docsie_pk_key:${deploymentId},authorizationToken:${jwtToken}`);
    document.body.appendChild(script);
}
```

## Adding JWT Authentication

To add JWT authentication for secured deployments:

1. Install JWT package:
   ```bash
   dotnet add package System.IdentityModel.Tokens.Jwt
   ```

2. Create JWT service:
   ```csharp
   // Services/DocsieAuthService.cs
   using System.IdentityModel.Tokens.Jwt;
   using Microsoft.IdentityModel.Tokens;

   public class DocsieAuthService
   {
       public string GenerateJwtToken(string masterKey)
       {
           var key = new SymmetricSecurityKey(
               System.Text.Encoding.UTF8.GetBytes(masterKey));
           var credentials = new SigningCredentials(
               key, SecurityAlgorithms.HmacSha256);

           var token = new JwtSecurityToken(
               expires: DateTime.UtcNow.AddHours(1),
               signingCredentials: credentials
           );

           return new JwtSecurityTokenHandler().WriteToken(token);
       }
   }
   ```

3. Register service in `Program.cs`:
   ```csharp
   builder.Services.AddScoped<DocsieAuthService>();
   ```

4. Update `Docs.razor`:
   ```razor
   @inject DocsieAuthService AuthService

   @code {
       protected override async Task OnAfterRenderAsync(bool firstRender)
       {
           if (firstRender)
           {
               var jwtToken = AuthService.GenerateJwtToken("your_master_key");
               await module.InvokeVoidAsync("initializeDocsie",
                   "deployment_YOUR_ID", jwtToken);
           }
       }
   }
   ```

## Troubleshooting

**Blank page or documentation not loading?**
- Open browser console (F12) and check for JavaScript errors
- Verify deployment ID is correct: `deployment_EFk3AIigMh599HRk6`
- Ensure script URL is `service.js` not `styles.js`

**Documentation disappears on page navigation?**
- Check that `IAsyncDisposable` is implemented
- Verify `cleanupDocsie()` is called on disposal

**Port already in use?**
- Change port in `Properties/launchSettings.json`
- Or kill existing process: `lsof -ti:5000 | xargs kill -9`

## Blazor WASM vs Razor Pages

**When to use Blazor WASM:**
- You need full client-side SPA experience
- Documentation is part of larger Blazor application
- You're comfortable with JavaScript interop complexity

**When to use Razor Pages:**
- Simpler integration (just 3 lines of HTML)
- Server-side rendering is acceptable
- No JavaScript interop needed
- See: [razor-pages-docsie-sample](https://github.com/PhilippeTrounev/razor-pages-docsie-sample)

## Key Differences from Razor Pages

| Feature | Razor Pages | Blazor WASM |
|---------|-------------|-------------|
| Rendering | Server-side | Client-side |
| Integration | 3 lines of HTML | JSInterop module |
| Complexity | Very simple | Moderate |
| DOM conflicts | None | Requires isolation |
| Page load | Fast (server-rendered) | Slower (WASM bootstrap) |

## Additional Resources

- [Docsie Documentation](https://help.docsie.io)
- [Blazor JavaScript Interop](https://learn.microsoft.com/en-us/aspnet/core/blazor/javascript-interoperability)
- [Razor Pages Alternative](https://github.com/PhilippeTrounev/razor-pages-docsie-sample)

## License

MIT
