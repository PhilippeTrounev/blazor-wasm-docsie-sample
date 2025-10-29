# Docsie Blazor WebAssembly Sample

Complete Blazor WebAssembly example showing how to embed Docsie documentation with full JWT authentication support.

## Features

✅ **Public Documentation** - Embed public Docsie portals
✅ **JWT Authentication** - Complete server-side JWT generation and validation
✅ **Secure Deployments** - Access password-protected documentation
✅ **Mock Login Page** - Demo authentication flow for developers
✅ **Docker Support** - Run complete stack with Docker Compose
✅ **Production Ready** - Environment variables and proper secret management

## Requirements

- .NET SDK 9.0 or later (works on Mac, Windows, Linux)
- Docker Desktop (optional, for containerized deployment)
- Any modern web browser

## Quick Start

### Option 1: Docker Compose (Recommended)

See [README-DOCKER.md](./README-DOCKER.md) for complete Docker setup instructions.

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env and configure your Docsie settings:
#    DOCSIE_MASTER_KEY=your_master_key_here
#    DOCSIE_DEPLOYMENT_KEY=your_deployment_id_here
#    DOCSIE_REDIRECT_URL=http://localhost:5145/api/auth/login

# 3. Run with Docker Compose
docker-compose up --build
```

**Access the applications:**
- Blazor Client: http://localhost:5000
- API Server: http://localhost:5145
- Mock Login: http://localhost:5145/api/auth/login

### Option 2: Local Development

1. Navigate to the project directory:
   ```bash
   cd blazor-wasm-docsie-sample
   ```

2. Start the API server (in one terminal):
   ```bash
   cd Server
   dotnet run --urls "http://localhost:5145"
   ```

3. Start the Blazor WASM client (in another terminal):
   ```bash
   dotnet run
   ```

4. Open your browser to http://localhost:5000

## What This Demonstrates

### Core Integration
- **Blazor WASM Integration**: Embed Docsie in client-side Blazor applications
- **JavaScript Interop**: JSInterop for external JavaScript library management
- **Lifecycle Management**: Proper initialization and cleanup of Docsie script
- **DOM Isolation**: Prevents Blazor render tree conflicts with Docsie's Inferno.js

### JWT Authentication
- **Server-Side JWT Generation**: ASP.NET Core API generates tokens using Docsie master key
- **Minimal JWT Claims**: Only `exp` claim (matches Docsie's format exactly)
- **URL Parameter Auth**: JWT passed via `?token=...` query parameter
- **Mock Login Flow**: Complete authentication redirect demonstration
- **Master Key Security**: Environment variables and `.gitignore` protection

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

## JWT Authentication Flow

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Visitor   │────────>│  Your Backend    │         │    Docsie    │
│  (Browser)  │         │  (Port 5145)     │         │   (Cloud)    │
└─────────────┘         └──────────────────┘         └──────────────┘
       │                          │                           │
       │  1. Access portal        │                           │
       ├─────────────────────────>│                           │
       │                          │                           │
       │  2. Generate JWT         │                           │
       │     (signed with         │                           │
       │      master key)         │                           │
       │<─────────────────────────│                           │
       │                          │                           │
       │  3. Load portal with token in URL                    │
       │     (?token=eyJ...)      │                           │
       ├──────────────────────────┼──────────────────────────>│
       │                          │                           │
       │                          │  4. Validate JWT          │
       │                          │     (using master key)    │
       │                          │<──────────────────────────│
       │                          │                           │
       │  5. Show secured content │                           │
       │<─────────────────────────┼───────────────────────────│
```

### Key Points

1. **JWT contains only `exp` claim** - Docsie expects minimal JWT: `{'exp': timestamp}`
2. **Signed with master key** - Use HS256 algorithm with deployment's master key
3. **Passed in URL** - Token goes in query parameter: `?token=JWT_HERE`
4. **Fallback URL** - If auth fails, Docsie redirects to your login page

### Implementation

See the complete implementation in:
- **Server/Controllers/AuthController.cs** - JWT generation endpoint
- **Server/Controllers/ConfigController.cs** - Configuration endpoint (deployment ID, redirect URL)
- **Services/AuthService.cs** - Client service for fetching JWT and config
- **wwwroot/js/secure-docsie-loader.js** - Client-side token handling
- **Pages/SecureDocs.razor** - Blazor component integration
- **Server/Views/login.html** - Mock login page for demonstration

### Configuration Flow

All Docsie configuration is stored in `.env` on the API server and fetched dynamically:

1. **API server** reads `.env` file (DOCSIE_MASTER_KEY, DOCSIE_DEPLOYMENT_KEY, DOCSIE_REDIRECT_URL)
2. **Blazor client** calls `/api/config/docsie` to get deployment ID and redirect URL
3. **Blazor client** calls `/api/auth/token` to get JWT token
4. **JavaScript** initializes Docsie with fetched config and JWT

This keeps all secrets on the server side while allowing the client to configure itself dynamically.

## Troubleshooting

### General Issues

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

### JWT Authentication Issues

**Getting "Failed to get Docsie configuration" error?**
- Make sure `.env` file exists and contains `DOCSIE_DEPLOYMENT_KEY`
- Test config endpoint: `curl http://localhost:5145/api/config/docsie`
- Should return: `{"deploymentId":"deployment_...","redirectUrl":"http://..."}`
- If error: Check API server logs with `docker-compose logs api-server`

**Getting 403 Forbidden from Docsie API?**
- Verify your `DOCSIE_MASTER_KEY` is correct in `.env`
- Check JWT format - should contain ONLY `exp` claim (no `sub`, `iss`, `aud`, etc.)
- Test JWT generation: `curl -X POST http://localhost:5145/api/auth/token`
- Inspect JWT at https://jwt.io to verify it only has `exp` claim

**Login page shows 404 error?**
- Ensure `Views/login.html` is included in your .csproj file
- Check that `CopyToOutputDirectory` is set to `PreserveNewest`
- Restart the API server after making .csproj changes

**Infinite redirect loop?**
- Check that fallback URL points to your local server: `http://localhost:5145/api/auth/login`
- Verify JWT is being added to URL as `?token=...` not `#jwt=...`
- Clear browser cookies and try again

**Docker containers not starting?**
- Run `docker-compose logs` to see error messages
- Ensure ports 5000 and 5145 are not already in use
- Check that `.env` file exists in the root directory

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
