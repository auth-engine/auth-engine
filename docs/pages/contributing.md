---
title: Contributing
description: How to contribute to AuthEngine — local setup, pull requests, and issue templates.
author: Niranjan
---

# Contributing

Thank you for your interest in AuthEngine. This guide applies to all repositories in the [auth-engine](https://github.com/auth-engine) organization.

**Tagline:** One identity for every app and organisation.

!!! tip "New contributor?"
    Start with [Quick Start](quick-start.md), then open a [good first issue](https://github.com/auth-engine/auth-engine/issues?q=label%3A%22good+first+issue%22) when available.

---

## Layout

| Folder | What to change here |
|--------|---------------------|
| [`apps/api`](https://github.com/auth-engine/auth-engine/tree/main/apps/api) | FastAPI API, IAM, OIDC, migrations |
| [`apps/dashboard`](https://github.com/auth-engine/auth-engine/tree/main/apps/dashboard) | Next.js admin UI |
| [`data/`](https://github.com/auth-engine/auth-engine/tree/main/data) | JSON seed data — roles, super admin profile, platform config |
| [`infra/`](https://github.com/auth-engine/auth-engine/tree/main/infra) | Terraform, Helm, Docker Compose, deploy scripts |
| [`docs/`](https://github.com/auth-engine/auth-engine/tree/main/docs) | **This documentation** (MkDocs) |
| [`.github` org](https://github.com/auth-engine/.github) | Org profile, CONTRIBUTING, SECURITY |

Canonical copy on GitHub: [CONTRIBUTING.md](https://github.com/auth-engine/.github/blob/main/CONTRIBUTING.md)

---

## Before you start

1. Read [Quick Start](quick-start.md) and run the stack locally.
2. Search [existing issues](https://github.com/auth-engine/auth-engine/issues) — avoid duplicate work.
3. For large changes, open an issue first to discuss approach.
4. Look for issues labeled **`good first issue`** if you are new to the codebase.

---

## Local development

### Full stack (recommended)

```bash
git clone https://github.com/auth-engine/auth-engine.git
cd auth-engine/infra/compose
cp env.local.example .env
# Set SECRET_KEY and JWT_SECRET_KEY (openssl rand -hex 32)

docker compose up -d
docker exec authengine-api auth-engine migrate
```

Then seed once with `auth-engine seed` (see [Quick Start — seed](quick-start.md#4-run-migrations--seed-data)).

| Service | URL |
|---------|-----|
| API / Swagger | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Dashboard | [http://localhost:3000](http://localhost:3000) |

### API only

```bash
git clone https://github.com/auth-engine/auth-engine.git
cd auth-engine/apps/api
uv sync
cp .env.example .env.local
uv run auth-engine migrate
uv run auth-engine run
```

Requires Python **3.12+**, [uv](https://docs.astral.sh/uv/), and Postgres, Redis, and MongoDB (or use Compose above).

### Dashboard only

```bash
cd auth-engine/apps/dashboard
cp .env.example .env.local
npm ci && npm run dev
```

---

## Pull request workflow

1. **Fork** the repository and branch from `main` (`feature/…`, `fix/…`, `docs/…`).
2. **Keep PRs focused** — one logical change when possible.
3. **Test locally:**
   - API: CI lint/typecheck; run migrations if models changed.
   - Dashboard: `npm run build` must pass.
   - Docs: verify links if you edited `docs/`.
4. **Describe the PR** — what, why, how tested, `Fixes #123`.
5. Open against **`main`**.

---

## Code guidelines

- Match existing style (Ruff/mypy for Python, ESLint for TypeScript).
- Never commit secrets — use `.env.example` only.
- Update documentation here when behavior changes.
- Prefer small diffs; discuss large refactors in an issue first.

---

## Issues and templates

| Type | Link |
|------|------|
| Bug | [Bug report](https://github.com/auth-engine/auth-engine/issues/new?template=bug_report.yml) |
| Feature | [Feature request](https://github.com/auth-engine/auth-engine/issues/new?template=feature_request.yml) |
| Question | [Question](https://github.com/auth-engine/auth-engine/issues/new?template=question.yml) |
| Security | [Security policy](security-policy.md) — **not** a public issue |

### Suggested GitHub labels

`bug` · `enhancement` · `question` · `good first issue`

---

## License

Contributions are licensed under the [MIT License](https://github.com/auth-engine/auth-engine/blob/main/LICENSE).

---

## Contact

| | |
|--|--|
| Website | [authengine.org](https://authengine.org) |
| Docs | [docs.authengine.org](https://docs.authengine.org) |
| GitHub | [github.com/auth-engine](https://github.com/auth-engine) |
