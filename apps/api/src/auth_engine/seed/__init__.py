from __future__ import annotations

import logging

from auth_engine.core.postgres import AsyncSessionLocal
from auth_engine.seed.platform_config import seed_platform_config
from auth_engine.seed.rbac import seed_roles
from auth_engine.seed.super_admin import seed_super_admin

logger = logging.getLogger(__name__)


async def run_seed(*, roles: bool, superadmin: bool, platform_config: bool) -> None:
    async with AsyncSessionLocal() as session:
        if roles:
            await seed_roles(session)
        if superadmin:
            await seed_super_admin(session)
        if platform_config:
            await seed_platform_config(session)
    logger.info("Seed run finished")
