# GeoAutomations Backend (Azure Functions)

Minimal endpoints to validate configuration and accept audio-processing requests.

## Endpoints
- GET /api/version → returns static version info
- GET /api/health → returns which required env vars are present/missing (no values)
- POST /api/processAudio → validates input; if env is incomplete, returns 503 with a missing-keys list; otherwise 202 Accepted (stub)

## Deploy via GitHub Actions
Secrets required in this GitHub repo:
- AZ_FUNCTIONAPP_NAME → Azure Function App name (e.g., fn-geo-clean)
- AZ_FUNCTIONAPP_PUBLISH_PROFILE → XML content from Azure Portal → Function App → Overview → Get publish profile
- (Optional) BACKEND_HEALTH_URL → https://<FUNCTION_APP_NAME>.azurewebsites.net/api/health

Workflow: .github/workflows/backend.yml

## Azure Settings (No Secrets in Repo)
See ENV_CHECKLIST.md for exact key names. After updates, Save + Restart, then hit /api/health.

## Local Dev
- Node 18+
- npm install
- Start: func start (if Azure Functions Core Tools installed)
