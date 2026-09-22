---
title: Security Policy
description: How to report security vulnerabilities in AuthEngine responsibly.
author: Niranjan
---

# Security Policy

!!! danger "Do not use public GitHub issues for vulnerabilities"
    Email **qniranjan.dev@gmail.com** with subject `AuthEngine Security Report`.  
    See [reporting steps](#reporting-a-vulnerability) below.

For architecture hardening and token design, see [Security Overview](security-overview.md).

Canonical copy on GitHub: [SECURITY.md](https://github.com/auth-engine/.github/blob/main/SECURITY.md)

---

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` (latest) | Yes |
| Older release tags | Best effort — upgrade to latest |

Production operators: [Deployment](deployment.md)

---

## Reporting a vulnerability

1. **Email:** [qniranjan.dev@gmail.com](mailto:qniranjan.dev@gmail.com)  
   **Subject:** `AuthEngine Security Report`
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected component (`apps/api`, `apps/dashboard`, `data`, `infra`, or `docs`)
   - Impact assessment (if known)
   - GitHub username (optional, for credit)

You should receive an acknowledgement within **72 hours**.

When a fix is ready, we will publish a patched release or document upgrade steps and credit reporters who wish to be named.

---

## Scope

**In scope**

- Authentication bypass, session fixation, privilege escalation
- OIDC/OAuth misconfiguration or token validation flaws
- SQL injection, IDOR, multi-tenant isolation breaks
- Secrets exposure in repository or default configuration
- Infrastructure misconfigurations documented in this project

**Out of scope** (use regular [issues](https://github.com/auth-engine/auth-engine/issues))

- Denial of service without a proven exploit chain
- Social engineering
- Third-party services (AWS, Atlas, Upstash, SendGrid, etc.)
- Upstream dependency CVEs already fixed — open a PR or Dependabot fix instead

---

## Safe deployment reminders

- Strong `SECRET_KEY` and `JWT_SECRET_KEY` (32+ random bytes)
- Restrict EC2 security groups and RDS to the API host
- `/opt/authengine/.env` permissions `600`
- MFA for super-admin and platform operators
- Rotate credentials if ever committed or shared

Details: [Security Overview](security-overview.md)

---

## Language

English is preferred for security reports.
