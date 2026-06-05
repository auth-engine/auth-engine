# auth-engine

Backend API for **AuthEngine** — FastAPI IAM, multi-tenancy, OIDC provider, and token introspection.

**Documentation:** [auth-engine-infra/docs](https://github.com/Q-Niranjan/auth-engine-infra/tree/main/docs) · published at [docs.bestcrmhub.com](https://docs.bestcrmhub.com)

| Guide | Link |
|-------|------|
| Quick Start | [quick-start.md](https://github.com/Q-Niranjan/auth-engine-infra/blob/main/docs/quick-start.md) |
| OAuth2 / OIDC | [oauth2-oidc-guides.md](https://github.com/Q-Niranjan/auth-engine-infra/blob/main/docs/oauth2-oidc-guides.md) |
| API Reference | [api-reference.md](https://github.com/Q-Niranjan/auth-engine-infra/blob/main/docs/api-reference.md) |
| Architecture | [architecture.md](https://github.com/Q-Niranjan/auth-engine-infra/blob/main/docs/architecture.md) |
| Deployment | [deployment.md](https://github.com/Q-Niranjan/auth-engine-infra/blob/main/docs/deployment.md) |
| Security | [security-overview.md](https://github.com/Q-Niranjan/auth-engine-infra/blob/main/docs/security-overview.md) |

## Docker

Dockerfile only — compose files live in **[auth-engine-infra/compose](https://github.com/Q-Niranjan/auth-engine-infra/tree/main/compose)**.

```bash
cd auth-engine-infra/compose
docker compose up -d --build
```

## Related repositories

| Repository | Role |
|------------|------|
| [auth-engine-frontend](https://github.com/Q-Niranjan/auth-engine-frontend) | Admin dashboard |
| [auth-engine-infra](https://github.com/Q-Niranjan/auth-engine-infra) | Terraform, Docker Compose, docs |
