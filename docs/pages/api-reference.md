---
title: API Reference
description: REST API endpoints, authentication headers, and response codes.
author: Niranjan
---

# API Reference

**Base URL:** `https://api.authengine.org/api/v1`  
**Interactive docs:** [https://api.authengine.org/docs](https://api.authengine.org/docs)  
**OpenAPI JSON:** `/api/v1/openapi.json`

!!! abstract "Sections"
    **1** Authentication → **2** System → **3** Auth → **4** Current user → **5** Platform admin → **6** Tenant admin → **7** OIDC → **8** Roles → **9** Dashboard routes

---

## 1. Authentication

| Context | Header / mechanism |
|---------|------------------|
| User API | `Authorization: Bearer <access_token>` |
| Tenant-scoped routes | `X-Tenant-Id: <uuid>` (dashboard sends this automatically) |
| Service introspection | `X-API-Key: ae_sk_<hex>` |
| OIDC token endpoint | HTTP Basic or `client_id` / `client_secret` in body |

### Common response codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (e.g. magic link sent, MFA challenge) |
| 204 | No content (logout) |
| 401 | Invalid or expired credentials |
| 403 | Missing permission (PBAC) |
| 404 | Resource not found |
| 422 | Validation error |

---

## 2. System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API metadata |
| `GET` | `/health` | Health check |

---

## 3. Authentication (`/auth`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register with email + password |
| `POST` | `/auth/login` | Login — 200 tokens or 202 MFA challenge |
| `POST` | `/auth/logout` | Revoke session, blacklist token |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/password-reset/request` | Send reset email |
| `GET` | `/auth/password-reset/confirm` | Validate reset token |
| `POST` | `/auth/password-reset/confirm` | Set new password |
| `POST` | `/auth/set-password` | Add password to OAuth-only account |
| `POST` | `/auth/update-password` | Change password (authenticated) |
| `GET` | `/auth/verify-email` | Verify email via token |
| `POST` | `/auth/verify-phone` | Verify phone OTP |
| `POST` | `/auth/request-token` | Request verification token |
| `POST` | `/auth/select-tenant` | Exchange token for tenant-scoped session |
| `GET` | `/auth/auth-config` | Public login methods for a tenant (no auth) |

#### `GET /auth/auth-config`

Returns which sign-in methods the login UI should show. Used by the dashboard and customer integrations.

| Query | Required | Description |
|-------|----------|-------------|
| `tenant_id` | No | Tenant UUID. Omit for **platform login** — API resolves the canonical platform tenant. |

**Response:**

```json
{
  "tenant_id": "uuid",
  "allowed_methods": ["email_password", "magic_link", "social_provider", "passkey"]
}
```

### Magic link

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/magic-link/request` | Send passwordless link (always 202) |
| `GET` | `/auth/magic-link/verify` | Exchange link JWT for session |

### MFA (login step)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/mfa/complete` | Complete TOTP after 202 login challenge |

### WebAuthn (passkeys)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/webauthn/register/begin` | Registration challenge |
| `POST` | `/auth/webauthn/register/complete` | Store credential |
| `POST` | `/auth/webauthn/authenticate/begin` | Authentication challenge |
| `POST` | `/auth/webauthn/authenticate/complete` | Verify assertion, issue tokens |

### OAuth2 social

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/oauth/{provider}/login` | Start flow (`google`, `github`, `microsoft`) |
| `GET` | `/auth/oauth/{provider}/callback` | Provider callback |
| `GET` | `/auth/oauth/{provider}/link` | Link provider to current user |
| `GET` | `/auth/oauth/accounts` | List linked accounts |

### Service API keys (platform admin)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/service-keys` | Create key (raw key returned once) |
| `GET` | `/auth/service-keys` | List keys |
| `DELETE` | `/auth/service-keys/{id}` | Revoke key |

### Token introspection

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/platform/service-keys/introspect` | `X-API-Key` | Validate user JWT; return identity + permissions |

**Request:**

```json
{
  "token": "<access_token>",
  "tenant_id": "<optional-uuid>"
}
```

**Active response (abbreviated):**

```json
{
  "active": true,
  "user_id": "uuid",
  "email": "user@example.com",
  "permissions": ["tenant.view"],
  "tenant_ids": ["uuid"]
}
```

Inactive: `{ "active": false }`

---

## 4. Current user (`/me`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me` | Profile |
| `GET` | `/me/tenants` | Organizations |
| `GET` | `/me/tenants/{id}/permissions` | Permissions in tenant |

### MFA management

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/me/mfa/enroll` | Start TOTP setup (QR URI) |
| `POST` | `/me/mfa/verify` | Confirm enrollment |
| `DELETE` | `/me/mfa/disable` | Disable (requires valid code) |
| `GET` | `/me/mfa/status` | MFA enabled flag |

### WebAuthn credentials

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me/webauthn/credentials` | List passkeys |
| `DELETE` | `/me/webauthn/credentials/{id}` | Remove passkey |

---

## 5. Platform admin (`/platform`)

Requires platform-scoped permissions (e.g. `platform.tenants.manage`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/platform/users` | List users |
| `GET` | `/platform/users/{id}` | User detail |
| `PATCH` | `/platform/users/{id}` | Update user |
| `DELETE` | `/platform/users/{id}` | Delete user |
| `GET` | `/platform/tenants` | List tenants |
| `POST` | `/platform/tenants` | Create tenant |
| `GET` | `/platform/tenants/{id}` | Tenant detail |
| `PUT` | `/platform/tenants/{id}` | Update tenant |
| `DELETE` | `/platform/tenants/{id}` | Delete tenant |
| `GET` | `/platform/roles` | List roles |
| `GET` | `/platform/roles/permissions` | Permission catalog |
| `POST` | `/platform/roles` | Create role |
| `PUT` | `/platform/roles/{id}` | Update role |
| `DELETE` | `/platform/roles/{id}` | Delete role |
| `POST` | `/platform/users/{id}/roles` | Assign platform role |
| `DELETE` | `/platform/users/{id}/roles/{name}` | Remove platform role |
| `GET` | `/platform/audit` | Platform audit logs |
| `GET` | `/platform/audit/{id}` | Audit entry detail |

---

## 6. Tenant admin (`/tenants`)

Path includes `tenant_id`. Guards use PBAC permissions scoped to that tenant.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tenants/{tenant_id}/users` | List members |
| `GET` | `/tenants/{tenant_id}/users/{user_id}` | Member detail |
| `POST` | `/tenants/{tenant_id}/users` | Invite / add user |
| `DELETE` | `/tenants/{tenant_id}/users/{user_id}` | Remove member |
| `GET` | `/tenants/{tenant_id}/roles` | Tenant roles |
| `GET` | `/tenants/{tenant_id}/roles/{role_id}` | Role detail |
| `POST` | `/tenants/{tenant_id}/users/{user_id}/roles` | Assign tenant role |
| `DELETE` | `/tenants/{tenant_id}/users/{user_id}/roles/{role_id}` | Remove role |
| `GET` | `/tenants/{tenant_id}/audit-logs` | Tenant audit trail |
| `GET` | `/tenants/{tenant_id}/auth-config` | Auth methods / policies |
| `PUT` | `/tenants/{tenant_id}/auth-config` | Update auth config |
| `GET` | `/tenants/{tenant_id}/social-providers` | SSO provider configs |
| `POST` | `/tenants/{tenant_id}/social-providers` | Add provider |
| `PUT` | `/tenants/{tenant_id}/social-providers/{id}` | Update provider |
| `DELETE` | `/tenants/{tenant_id}/social-providers/{id}` | Remove provider |
| `PATCH` | `/tenants/{tenant_id}/social-providers/{id}` | Partial update |
| `GET` | `/tenants/{tenant_id}/email-config` | Email delivery config |
| `POST` | `/tenants/{tenant_id}/email-config` | Create email config |
| `PUT` | `/tenants/{tenant_id}/email-config` | Update email config |
| `DELETE` | `/tenants/{tenant_id}/email-config` | Delete email config |
| `POST` | `/tenants/{tenant_id}/email-config/test` | Send test email |
| `GET` | `/tenants/{tenant_id}/sms-config` | SMS config |
| `POST` | `/tenants/{tenant_id}/sms-config` | Create SMS config |
| `PUT` | `/tenants/{tenant_id}/sms-config` | Update SMS config |
| `DELETE` | `/tenants/{tenant_id}/sms-config` | Delete SMS config |
| `POST` | `/tenants/{tenant_id}/sms-config/test` | Send test SMS |

---

## 7. OIDC (`/oidc` and `/.well-known`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/.well-known/openid-configuration` | Discovery (spec URL) |
| `GET` | `/.well-known/jwks.json` | JWKS |
| `GET` | `/oidc/authorize` | Authorization endpoint |
| `POST` | `/oidc/token` | Token endpoint |
| `GET` | `/oidc/userinfo` | UserInfo |
| `POST` | `/oidc/userinfo` | UserInfo (POST alias) |
| `POST` | `/oidc/register` | Dynamic client registration |

---

## 8. Roles and permission levels

| Role | Level | Scope |
|------|-------|-------|
| `SUPER_ADMIN` | 100 | Platform (seed only — `data/`) |
| `PLATFORM_ADMIN` | 80 | Platform |
| `TENANT_OWNER` | 60 | Tenant |
| `TENANT_ADMIN` | 50 | Tenant |
| `TENANT_MANAGER` | 30 | Tenant |
| `TENANT_USER` | 10 | Tenant |

Higher levels cannot assign equal or higher roles (lateral escalation blocked).

Sample permissions: `platform.tenants.manage`, `tenant.users.manage`, `auth.tokens.refresh`.

Full permission strings are returned by introspection and `GET /me/tenants/{id}/permissions`.

---

## 9. Frontend dashboard routes

| UI path | API area |
|---------|----------|
| `/login`, `/register`, `/magic-link` | `/auth/*` |
| `/platform/*` | `/platform/*` |
| `/tenant/*` | `/tenants/{tenant_id}/*` |
| `/me`, `/me/security` | `/me/*` |

---

## Next

| Step | Guide |
|------|-------|
| OAuth / OIDC flows | [OAuth2 / OIDC Guides](oauth2-oidc-guides.md) |
| Security model | [Security Overview](security-overview.md) |
| Local URLs | [Quick Start](quick-start.md) |
