# Docker Setup for Docsie Blazor Integration

This document explains how to run the complete Docsie Blazor example using Docker Compose.

## Prerequisites

- Docker Desktop installed
- Docker Compose installed
- `.env` file configured with your Docsie master key

## Quick Start

1. **Make sure `.env` file exists with your credentials:**
   ```bash
   cp .env.example .env
   # Edit .env and add your real DOCSIE_MASTER_KEY
   ```

2. **Build and run everything:**
   ```bash
   docker-compose up --build
   ```

3. **Access the applications:**
   - Blazor Client: http://localhost:5000
   - API Server: http://localhost:5145
   - Test JWT Endpoint: http://localhost:5145/api/auth/token

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Blazor WASM    │ ───────>│   API Server     │
│  (Port 5000)    │  HTTP   │   (Port 5145)    │
│                 │ <───────│                  │
│  - PublicDocs   │  JWT    │  - JWT Generator │
│  - SecureDocs   │  Token  │  - Loads .env    │
│  - InAppHelp    │         │  - Master Key    │
└─────────────────┘         └──────────────────┘
         │                           │
         │                           │
         └───────────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  Docsie Portal  │
            │  (validates JWT)│
            └─────────────────┘
```

## Services

### 1. API Server (`api-server`)
- **Port:** 5145
- **Purpose:** Generates JWT tokens using Docsie master key
- **Endpoints:**
  - `POST /api/auth/token` - Get JWT token for authentication (no auth required for demo)
  - `POST /api/auth/login` - Login with username/password (demo - accepts any credentials)
  - `GET /api/auth/login` - Serves mock login HTML page for fallback redirects
- **Environment:** Loads `.env` file for master key
- **JWT Format:** Generates minimal JWT with only `exp` claim (matches Docsie's format)

### 2. Blazor Client (`blazor-client`)
- **Port:** 5000
- **Purpose:** Frontend application with Docsie integration
- **Pages:**
  - `/public-docs` - Public documentation (no auth)
  - `/secure-docs` - Secured documentation (JWT auth)
  - `/inapp-help` - In-app help widget

## Docker Commands

### Start services
```bash
docker-compose up
```

### Start in background
```bash
docker-compose up -d
```

### Rebuild and start
```bash
docker-compose up --build
```

### View logs
```bash
docker-compose logs -f
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes
```bash
docker-compose down -v
```

## Testing the JWT Flow

1. **Test API Server directly:**
   ```bash
   curl -X POST http://localhost:5145/api/auth/token
   ```

   Should return:
   ```json
   {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
   ```

2. **Test Blazor Client:**
   - Open http://localhost:5000
   - Navigate to "Secure Docs"
   - Should automatically fetch JWT and load secured documentation

3. **Check logs:**
   ```bash
   docker-compose logs blazor-client
   docker-compose logs api-server
   ```

## Environment Variables

Required in `.env` file:

```bash
# Docsie Master Key (from your deployment)
DOCSIE_MASTER_KEY=key_VKvx...

# Docsie Deployment Key
DOCSIE_DEPLOYMENT_KEY=deployment_No7ZEhXL...

# JWT Settings
JWT_ISSUER=blazor-docsie-sample
JWT_AUDIENCE=docsie-portal
JWT_EXPIRY_MINUTES=60

# API Server URL (for Blazor client)
API_BASE_URL=http://api-server:8080
```

## Troubleshooting

### Ports already in use
If ports 5000 or 5145 are already in use, edit `docker-compose.yml`:

```yaml
ports:
  - "5001:8080"  # Change 5000 to 5001
```

### API Server not responding
Check if the health check is passing:
```bash
docker-compose ps
```

### JWT token invalid
1. Verify master key in `.env` matches your Docsie deployment
2. Test JWT format - should contain ONLY `exp` claim:
   ```bash
   # Get token
   TOKEN=$(curl -s -X POST http://localhost:5145/api/auth/token | jq -r '.token')
   # Decode and check at https://jwt.io
   echo $TOKEN
   ```
3. Check API server logs for errors:
   ```bash
   docker-compose logs api-server
   ```

### Blazor can't connect to API
- Make sure `api-server` container is running
- Check network connectivity:
  ```bash
  docker-compose exec blazor-client ping api-server
  ```

## Development Mode

For local development without Docker:

```bash
# Terminal 1 - API Server
cd Server
dotnet watch run --urls "http://localhost:5145"

# Terminal 2 - Blazor WASM
dotnet watch run
```

## Production Deployment

For production, you should:

1. Use proper secrets management (Azure Key Vault, AWS Secrets Manager)
2. Enable HTTPS
3. Set proper CORS policies
4. Use production-grade JWT settings (longer keys, shorter expiry)
5. Implement proper authentication (not demo mode)

Example production docker-compose:

```yaml
services:
  api-server:
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=https://+:443;http://+:80
    volumes:
      - ./certs:/https:ro
```

## Security Notes

- ⚠️ `.env` file is gitignored - never commit secrets
- ⚠️ Master key should be rotated regularly
- ⚠️ JWT tokens expire after 60 minutes (configurable)
- ⚠️ CORS is set to allow all origins in development (restrict in production)
- ⚠️ The demo `/api/auth/token` endpoint has no authentication (add auth in production)

## Support

For issues with:
- Docsie integration: https://help.docsie.io
- This example: https://github.com/PhilippeTrounev/blazor-wasm-docsie-sample

---

Built with ❤️ using Docker, .NET 9, and Docsie
