---
title: About
description: Why AuthEngine works as a central identity system — problem, fit, capabilities, and author.
---

# About

A deeper look at why AuthEngine exists and how it serves multiple apps and organizations. For a quick overview, start at **[Home](index.md)**.

---

## 1. The problem without central identity

When each service owns its own auth, problems multiply quickly:

| Without central identity | What goes wrong |
|--------------------------|-----------------|
| Separate login per app | Users juggle accounts; support tickets increase |
| Permissions copied into every service | Access rules drift; security gaps appear |
| Each backend verifies tokens differently | Secrets spread; revocation is unreliable |
| No shared view of users | Invites, offboarding, and audits are manual and inconsistent |
| Every new app rebuilds MFA, social login, password reset | Slow delivery; uneven security |

AuthEngine replaces that fragmentation with **one system of record** for users, sessions, roles, and policies.

---

## 2. Why AuthEngine fits as a central identity system

AuthEngine sits **between people and many services** — not as auth for a single app in isolation.

### 2.1 One account, many organizations

A person has **one user profile** but can belong to **multiple tenants** (organizations). Each tenant can have different roles — owner in one company, member in another. After login, the user picks which organization they are working in; permissions follow that choice.

This fits **SaaS platforms**, **agency portals**, and **multi-brand products** where one identity layer serves many customers.

### 2.2 Two ways for other services to connect

| Consumer | How they use AuthEngine | Best for |
|----------|-------------------------|----------|
| **Web and mobile apps** | “Login with AuthEngine” (OpenID Connect) | Browser flows, partner apps, SPAs |
| **Backend APIs and microservices** | Token validation with a service key | Servers that check every request |

Human-facing apps get a familiar login flow. Server-side services ask AuthEngine “is this session still valid?” and receive **permissions** in the response — without holding signing secrets.

### 2.3 Permissions defined once, enforced everywhere

Roles and permissions live in AuthEngine — not in every app’s database. When a user logs in or a service validates a token, the permission list travels with the identity.

Built-in roles cover platform operators, tenant owners, admins, managers, and everyday users — with rules that prevent granting access above your own level.

### 2.4 Policy per organization, platform run by you

Each tenant can set its own rules:

- Allowed sign-in methods (email, magic link, Google, GitHub, Microsoft, passkeys)
- Whether MFA is required
- Password strength and session length
- Allowed email domains
- Email and SMS settings for invites and verification

You run the platform; each organization controls **how their people sign in**.

### 2.5 Governance built in

Platform operators onboard tenants, issue keys for trusted services, and review global audit history. Tenant admins invite users, assign roles, and configure login policy. Security-relevant events — logins, invites, tenant changes, logouts — are recorded for review.

---

## 3. Who uses AuthEngine

| Persona | Role |
|---------|------|
| **Platform admin** | Runs the identity platform — tenants, service keys, global users |
| **Tenant admin** | Runs one organization — members, roles, login rules, invites |
| **End user** | Signs in, manages profile, MFA, and passkeys |
| **Relying party app** | Adds “Login with AuthEngine” to its product |
| **Backend service** | Validates user tokens on each API call |

---

## 4. What AuthEngine provides

### 4.1 Sign-in and account security

- Email and password — register, login, reset, verify email or phone
- Passwordless magic link
- Social login — Google, GitHub, Microsoft (linkable to one account)
- Two-factor authentication (authenticator app)
- Passkeys / WebAuthn
- Account lockout and rate limiting on failed attempts

### 4.2 Organizations and access control

- Multi-tenant structure (platform + customer organizations)
- User invitation and onboarding per tenant
- Role-based permissions with a clear hierarchy
- Tenant-scoped sessions after organization selection

### 4.3 Identity for external applications

- OpenID Connect provider (“Login with AuthEngine”)
- Hosted login and consent experience
- Dynamic app registration for new relying parties

### 4.4 Trust for backend services

- Service API keys for machine-to-machine validation
- Token introspection — session status, user profile, permissions, tenant memberships
- Optional tenant scope per key; immediate revocation

### 4.5 Operations and visibility

- Admin dashboard for platform and tenant management
- Audit trail for security-relevant actions
- Per-tenant email and SMS configuration

---

## 5. About me

**Niranjan Kumar**  
GitHub: [@auth-engine](https://github.com/auth-engine) · [@Q-Niranjan](https://github.com/Q-Niranjan)

Creator and maintainer of AuthEngine and this documentation.

---

## Next

| Topic | Guide |
|-------|-------|
| Back to overview | [Home](index.md) |
| Run locally | [Quick Start](quick-start.md) |
| How it is built | [Architecture](architecture.md) |
| Production setup | [Deployment](deployment.md) |
