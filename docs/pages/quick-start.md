---
title: Quick Start
description: Run AuthEngine locally — API, frontend, Postgres, MongoDB, and Redis via Docker Compose.
author: Niranjan
---

# Quick Start

Two ways to develop locally:

| Path | Best for |
|------|----------|
| **Docker Compose** (below) | Full stack with one command — API, dashboard, Postgres, MongoDB, Redis |
| **Repos on host** ([§7](#7-run-without-docker-alternative)) | Backend or dashboard changes with hot reload |

Compose lives in **`infra/compose/`**.

!!! abstract "Compose steps"
    **1** Configure `.env` → **2** `docker compose up -d` → **3** Migrate → **4** Seed → **5** Smoke test

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|-------|
| Docker + Docker Compose | Required |
| OpenSSL | Optional — `openssl rand -hex 32` for secrets |

---

## 2. Configure environment

```bash
cd infra/compose
cp env.local.example .env
```

Set `SECRET_KEY` and `JWT_SECRET_KEY` to unique 32+ character values (`openssl rand -hex 32`). Defaults in `env.local.example` are for local use only.

The compose `.env` holds **credentials and app settings** — database URLs are assembled by `docker-compose.yml` for the API container. Dashboard `NEXT_PUBLIC_*` vars are also set here.

---

## 3. Start the stack

```bash
docker compose up -d
```

| Service | URL |
|---------|-----|
| API | [http://localhost:8000](http://localhost:8000) |
| Swagger | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Frontend | [http://localhost:3000](http://localhost:3000) |

Images are pulled from Docker Hub (`qniranjan01/authengine`, `qniranjan01/authengine-dashboard`) as defined in `docker-compose.yml`.

---

## 4. Run migrations & seed data

```bash
docker exec authengine-api auth-engine migrate
```

RBAC roles, the super admin, and optional platform-tenant config (email, SMS, social OAuth, password policy) are **not** seeded on API startup. Seed JSON lives in [`data/`](https://github.com/auth-engine/auth-engine/tree/main/data). After migrations, run:

```bash
cd apps/api
uv run auth-engine seed
```

`SUPERADMIN_PASSWORD` (and optional email/SMS/OAuth secrets) come from `apps/api/.env.local`. Role lists and the super admin profile are in `data/*.json`.

---

## 5. Smoke test

1. Call `GET /api/v1/health` in Swagger.
2. Confirm auth config: `GET /api/v1/auth/auth-config` — returns `tenant_id` and `allowed_methods` (no `tenant_id` query needed for platform login).
3. Log in at [http://localhost:3000/login](http://localhost:3000/login) with super admin credentials (`SUPERADMIN_*` from compose `.env` or `apps/api/.env.local`).
4. Platform routes (`/platform/*`) need a platform-scoped role; tenant routes need a tenant selected in the dashboard.

---

## 6. OAuth providers (optional)

Platform social login (Google, AuthEngine OIDC) is configured on the **platform tenant** — seed once with `auth-engine seed platform-config` (see `apps/api/.env.example`) or set providers in the dashboard. Per-tenant OAuth is managed in the dashboard under tenant settings.

---

## 7. Run without Docker (alternative)

**API** — `apps/api` in this repo (Postgres, MongoDB, Redis running — use root `docker compose up -d` or install locally):

```bash
cd apps/api
uv sync
cp .env.example .env.local
uv run auth-engine migrate
uv run auth-engine run
```

**Dashboard** — `apps/dashboard`:

```bash
cd apps/dashboard
cp .env.example .env.local
npm ci && npm run dev
```

`NEXT_PUBLIC_PLATFORM_TENANT_ID` can stay empty — the login page calls `GET /auth/auth-config` and uses the returned `tenant_id`.

---

## Next

| Step | Guide |
|------|-------|
| Understand the system | [Architecture](architecture.md) |
| Deploy to production | [Deployment](deployment.md) |
| OAuth / OIDC integration | [OAuth2 / OIDC Guides](oauth2-oidc-guides.md) |
| REST endpoints | [API Reference](api-reference.md) |
