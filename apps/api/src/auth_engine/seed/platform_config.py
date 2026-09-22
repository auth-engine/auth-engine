"""Seed platform-tenant email, SMS, social providers, auth methods, and password policy."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth_engine.auth_strategies.constants import AUTHENGINE_OIDC, GOOGLE
from auth_engine.core.config import settings
from auth_engine.core.security import SecurityUtils
from auth_engine.models.email_config import EmailProviderType, TenantEmailConfigORM
from auth_engine.models.sms_config import SMSProviderType, TenantSMSConfigORM
from auth_engine.models.tenant_auth_config import TenantAuthConfigORM
from auth_engine.models.tenant_social_provider import TenantSocialProviderORM
from auth_engine.seed.loader import load_json
from auth_engine.services.social_provider_service import get_canonical_platform_tenant_id

logger = logging.getLogger(__name__)


@dataclass
class PlatformConfigSeedResult:
    email_created: bool = False
    sms_created: bool = False
    social_created: list[str] = field(default_factory=list)
    auth_config_created: bool = False
    allowed_methods_updated: bool = False
    password_policy_updated: bool = False

    @property
    def changed(self) -> bool:
        return (
            self.email_created
            or self.sms_created
            or bool(self.social_created)
            or self.auth_config_created
            or self.allowed_methods_updated
            or self.password_policy_updated
        )


def _secret_prefix(raw: str) -> str:
    return raw[:8] + "****" if len(raw) > 8 else raw[:4] + "****"


def _defaults() -> dict[str, Any]:
    return load_json("platform_config.json")


async def seed_platform_config(session: AsyncSession) -> PlatformConfigSeedResult:
    """Idempotently seed platform tenant operational config from data/ + env secrets."""
    result = PlatformConfigSeedResult()

    platform_id = await get_canonical_platform_tenant_id(session)
    if not platform_id:
        logger.warning("Platform tenant not found — run `auth-engine seed superadmin` first")
        return result

    await _seed_email(session, platform_id, result)
    await _seed_sms(session, platform_id, result)
    await _seed_social(session, platform_id, result)
    await _seed_auth_config(session, platform_id, result)

    await session.commit()
    if result.changed:
        logger.info(
            "Platform config seed applied: email=%s sms=%s social=%s auth_config=%s "
            "allowed_methods=%s password_policy=%s",
            result.email_created,
            result.sms_created,
            result.social_created,
            result.auth_config_created,
            result.allowed_methods_updated,
            result.password_policy_updated,
        )
    else:
        logger.info("Platform config already up to date — no changes needed")
    return result


async def _seed_email(
    session: AsyncSession,
    platform_id: uuid.UUID,
    result: PlatformConfigSeedResult,
) -> None:
    existing = await session.execute(
        select(TenantEmailConfigORM).where(TenantEmailConfigORM.tenant_id == platform_id)
    )
    if existing.scalar_one_or_none():
        return

    provider_name = settings.EMAIL_PROVIDER.lower()
    try:
        provider = EmailProviderType(provider_name)
    except ValueError:
        provider = EmailProviderType.SES

    session.add(
        TenantEmailConfigORM(
            tenant_id=platform_id,
            provider=provider,
            encrypted_credentials=SecurityUtils.encrypt_data(settings.EMAIL_PROVIDER_API_KEY),
            from_email=settings.EMAIL_SENDER,
            is_active=True,
        )
    )
    result.email_created = True
    logger.info("Seeded platform tenant email config (%s)", provider.value)


async def _seed_sms(
    session: AsyncSession,
    platform_id: uuid.UUID,
    result: PlatformConfigSeedResult,
) -> None:
    existing = await session.execute(
        select(TenantSMSConfigORM).where(TenantSMSConfigORM.tenant_id == platform_id)
    )
    if existing.scalar_one_or_none():
        return

    if not settings.SMS_GATEWAY_URL or not settings.SMS_GATEWAY_USERNAME or not settings.SMS_GATEWAY_PASSWORD:
        logger.info("SMS env not set — skipping platform SMS seed")
        return

    provider_name = settings.SMS_PROVIDER.lower()
    try:
        provider = SMSProviderType(provider_name)
    except ValueError:
        provider = SMSProviderType.ANDROID_GATEWAY

    credentials = f"{settings.SMS_GATEWAY_USERNAME}:{settings.SMS_GATEWAY_PASSWORD}"

    session.add(
        TenantSMSConfigORM(
            tenant_id=platform_id,
            provider=provider,
            encrypted_credentials=SecurityUtils.encrypt_data(credentials),
            from_number=settings.SMS_SENDER,
            account_sid=settings.SMS_GATEWAY_URL,
            is_active=True,
        )
    )
    result.sms_created = True
    logger.info("Seeded platform tenant SMS config (%s)", provider.value)


async def _seed_social_provider(
    session: AsyncSession,
    platform_id: uuid.UUID,
    *,
    provider: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str | None,
    oidc_discovery_url: str | None = None,
) -> bool:
    existing = await session.execute(
        select(TenantSocialProviderORM).where(
            TenantSocialProviderORM.tenant_id == platform_id,
            TenantSocialProviderORM.provider == provider,
        )
    )
    if existing.scalar_one_or_none():
        return False

    session.add(
        TenantSocialProviderORM(
            tenant_id=platform_id,
            provider=provider,
            client_id=SecurityUtils.encrypt_data(client_id),
            client_secret=SecurityUtils.encrypt_data(client_secret),
            client_secret_prefix=_secret_prefix(client_secret),
            redirect_uri=redirect_uri,
            oidc_discovery_url=oidc_discovery_url,
            is_active=True,
        )
    )
    return True


async def _seed_social(
    session: AsyncSession,
    platform_id: uuid.UUID,
    result: PlatformConfigSeedResult,
) -> None:
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        if await _seed_social_provider(
            session,
            platform_id,
            provider=GOOGLE,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            redirect_uri=settings.GOOGLE_REDIRECT_URI or None,
        ):
            result.social_created.append(GOOGLE)

    if settings.AUTHENGINE_CLIENT_ID and settings.AUTHENGINE_CLIENT_SECRET:
        if await _seed_social_provider(
            session,
            platform_id,
            provider=AUTHENGINE_OIDC,
            client_id=settings.AUTHENGINE_CLIENT_ID,
            client_secret=settings.AUTHENGINE_CLIENT_SECRET,
            redirect_uri=settings.AUTHENGINE_REDIRECT_URI or None,
            oidc_discovery_url=settings.AUTHENGINE_BASE_URL or None,
        ):
            result.social_created.append(AUTHENGINE_OIDC)

    if result.social_created:
        logger.info("Seeded platform social providers: %s", ", ".join(result.social_created))


async def _seed_auth_config(
    session: AsyncSession,
    platform_id: uuid.UUID,
    result: PlatformConfigSeedResult,
) -> None:
    defaults = _defaults()
    allowed = list(defaults.get("allowed_methods") or ["email_password"])
    policy = dict(defaults.get("password_policy") or {})

    row = await session.execute(
        select(TenantAuthConfigORM).where(TenantAuthConfigORM.tenant_id == platform_id)
    )
    config = row.scalar_one_or_none()

    if not config:
        session.add(
            TenantAuthConfigORM(
                tenant_id=platform_id,
                allowed_methods=allowed,
                mfa_required=bool(defaults.get("mfa_required", False)),
                password_policy=policy,
                session_ttl_seconds=int(defaults.get("session_ttl_seconds") or 3600),
                allowed_domains=list(defaults.get("allowed_domains") or []),
            )
        )
        result.auth_config_created = True
        logger.info("Seeded platform tenant auth config (allowed_methods=%s)", allowed)
        return

    if "email_password" not in (config.allowed_methods or []):
        config.allowed_methods = ["email_password", *(config.allowed_methods or [])]
        result.allowed_methods_updated = True
        logger.info("Enabled email_password login for platform tenant")

    if config.password_policy != policy:
        config.password_policy = policy
        result.password_policy_updated = True
        logger.info("Updated platform tenant password policy")
