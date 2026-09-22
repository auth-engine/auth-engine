from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from auth_engine.core.config import settings
from auth_engine.core.security import security as security_utils
from auth_engine.models import RoleORM, TenantORM, UserORM, UserRoleORM
from auth_engine.models.tenant import TenantType
from auth_engine.models.tenant_auth_config import TenantAuthConfigORM
from auth_engine.schemas.user import AuthStrategy, UserStatus
from auth_engine.seed.loader import load_json

logger = logging.getLogger(__name__)


def _platform_defaults() -> dict[str, Any]:
    return load_json("platform_config.json")


async def _ensure_platform_auth_config(db: AsyncSession, platform_id: UUID) -> None:
    defaults = _platform_defaults()
    auth_config = await db.scalar(
        select(TenantAuthConfigORM).where(TenantAuthConfigORM.tenant_id == platform_id)
    )
    allowed = list(defaults.get("allowed_methods") or ["email_password"])
    if auth_config:
        if "email_password" not in (auth_config.allowed_methods or []):
            auth_config.allowed_methods = ["email_password", *(auth_config.allowed_methods or [])]
        return

    db.add(
        TenantAuthConfigORM(
            tenant_id=platform_id,
            allowed_methods=allowed,
            mfa_required=bool(defaults.get("mfa_required", False)),
            password_policy=dict(defaults.get("password_policy") or {}),
            session_ttl_seconds=int(defaults.get("session_ttl_seconds") or 3600),
            allowed_domains=list(defaults.get("allowed_domains") or []),
        )
    )


async def seed_super_admin(db: AsyncSession) -> None:
    """Create the super admin user, platform tenant, and role assignment if missing."""
    profile = load_json("super_admin.json")
    email = settings.SUPERADMIN_EMAIL or str(profile.get("email") or "")
    password = settings.SUPERADMIN_PASSWORD
    if not email or not password:
        logger.warning("SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not set — skip super admin seed")
        return

    super_admin_role = await db.scalar(
        select(RoleORM).where(
            RoleORM.name == "SUPER_ADMIN",
            RoleORM.tenant_id.is_(None),
        )
    )
    if not super_admin_role:
        logger.warning("SUPER_ADMIN role not found — run `auth-engine seed roles` first")
        return

    user = await db.scalar(select(UserORM).where(UserORM.email == email))
    platform = await db.scalar(
        select(TenantORM)
        .where(TenantORM.type == TenantType.PLATFORM)
        .order_by(TenantORM.created_at.asc())
        .limit(1)
    )

    if user and platform:
        assignment = await db.scalar(
            select(UserRoleORM.user_id).where(
                UserRoleORM.user_id == user.id,
                UserRoleORM.role_id == super_admin_role.id,
                UserRoleORM.tenant_id == platform.id,
            )
        )
        if assignment:
            await _ensure_platform_auth_config(db, platform.id)
            await db.commit()
            logger.info("Super admin already seeded — skipping")
            return

    logger.info("Seeding super admin...")
    now = datetime.now(UTC)
    tenant_meta = profile.get("platform_tenant") or {}

    if not user:
        user = UserORM(
            email=email,
            is_email_verified=True,
            phone_number=str(profile.get("phone_number") or "+91 9999999999"),
            is_phone_verified=True,
            username=str(profile.get("username") or "super_admin"),
            password_hash=security_utils.hash_password(password),
            first_name=str(profile.get("first_name") or "Super"),
            last_name=str(profile.get("last_name") or "Admin"),
            status=UserStatus.ACTIVE,
            auth_strategies=[AuthStrategy.EMAIL_PASSWORD],
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        await db.flush()
        logger.info("Created super admin user: %s", email)

    if not platform:
        platform = TenantORM(
            name=str(tenant_meta.get("name") or "Platform"),
            type=TenantType.PLATFORM,
            description=str(tenant_meta.get("description") or "System platform tenant"),
            owner_id=user.id,
            created_by=user.id,
        )
        db.add(platform)
        await db.flush()
        logger.info("Created platform tenant")

    await _ensure_platform_auth_config(db, platform.id)

    await db.execute(
        insert(UserRoleORM)
        .values(
            user_id=user.id,
            role_id=super_admin_role.id,
            tenant_id=platform.id,
        )
        .on_conflict_do_nothing()
    )

    await db.commit()
    logger.info("Super admin seed complete")
