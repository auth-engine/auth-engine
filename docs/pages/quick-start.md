---
title: Quick Start
description: Run AuthEngine locally — databases in Docker, API and dashboard on the host, or the full Compose stack.
author: Niranjan
---

# Quick Start

AuthEngine is **open source** (MIT). Two ways to run it on your machine:

| Path | Best for |
|------|----------|
| **Databases in Docker, apps on the host** | Changing API or dashboard code (hot reload) |
| **Full Docker Compose** | Trying published images with one command |

Compose is the **repository-root** [`docker-compose.yml`](https://github.com/auth-engine/auth-engine/blob/main/docker-compose.yml) — not a nested `infra/compose/` folder.

!!! abstract "Host-dev steps"
    **1** Start Postgres, Mongo, Redis → **2** Configure `apps/api/.env.local` → **3** Migrate & seed → **4** Run API → **5** Run dashboard

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Docker + Compose v2 | Databases (and optional full stack) |
| Python **3.12+** and [uv](https://docs.astral.sh/uv/) | Host API |
| Node.js **20+** | Host dashboard |
| OpenSSL | Local secrets and the OIDC RSA key |

```bash
git clone https://github.com/auth-engine/auth-engine.git
cd auth-engine
```

---

## Path A — local development (recommended)

### 1. Start databases

```bash
docker compose up -d postgres mongo redis
```

| Service | Default host port |
|---------|-------------------|
| PostgreSQL | `5432` |
| MongoDB | `27017` |
| Redis | `6379` |

If a port is already in use (system Postgres on `5432` is common), change only the **left** side of the Compose port mapping (for example `"5434:5432"`) and point `apps/api/.env.local` at that host port.

### 2. API

```bash
cd apps/api
uv sync --extra dev
cp .env.example .env.local
openssl genrsa -out oidc_private.pem 2048
```

Set `SECRET_KEY` and `JWT_SECRET_KEY` to unique 32+ character values (`openssl rand -hex 32`).

Redis should use a password-only URL when the container uses `--requirepass`:

```env
REDIS_URL=redis://:redis_local_pass@localhost:6379/0
```

```bash
uv run auth-engine migrate
uv run auth-engine seed
uv run auth-engine run --reload
```

Seed is **not** run on API startup. `SUPERADMIN_*` live in `.env.local`; roles and the super-admin profile are in [`data/`](https://github.com/auth-engine/auth-engine/tree/main/data).

### 3. Dashboard

```bash
cd apps/dashboard
cp .env.example .env.local
npm ci && npm run dev
```

`NEXT_PUBLIC_PLATFORM_TENANT_ID` can stay empty — login calls `GET /auth/auth-config` and uses the returned `tenant_id`.

### 4. Smoke test

| Service | URL |
|---------|-----|
| API | [http://localhost:8000](http://localhost:8000) |
| Swagger | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Health | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) |
| Dashboard | [http://localhost:3000](http://localhost:3000) |

1. Confirm `GET /api/v1/health` and `GET /api/v1/auth/auth-config`.
2. Log in at [http://localhost:3000/login](http://localhost:3000/login) with `SUPERADMIN_*`.
3. Platform routes (`/platform/*`) need a platform-scoped role; tenant routes need a tenant selected in the dashboard.

---

## Path B — full Compose (published images)

```bash
docker compose up -d
docker compose ps
```

The `migrate` service runs `auth-engine migrate && auth-engine seed` before the API becomes healthy. Images: `qniranjan01/authengine`, `qniranjan01/authengine-dashboard`.

Do not also bind a host API to `:8000` while this stack is up.

---

## OAuth providers (optional)

Platform social login is configured on the **platform tenant** — seed with `auth-engine seed platform-config` (see `apps/api/.env.example`) or set providers in the dashboard. Per-tenant OAuth is under tenant settings.

---

## CLI

```bash
cd apps/api
uv run auth-engine run --reload
uv run auth-engine migrate
uv run auth-engine makemigration "message"
uv run auth-engine seed                 # all
uv run auth-engine seed roles
uv run auth-engine seed superadmin
uv run auth-engine seed platform-config
```

---

## Next

| Step | Guide |
|------|-------|
| Understand the system | [Architecture](architecture.md) |
| Deploy | [Deployment](deployment.md) |
| OAuth / OIDC integration | [OAuth2 / OIDC Guides](oauth2-oidc-guides.md) |
| REST endpoints | [API Reference](api-reference.md) |
| Contribute | [Contributing](contributing.md) |
