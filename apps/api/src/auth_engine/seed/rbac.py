from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from auth_engine.models.permission import PermissionORM
from auth_engine.models.role import RoleORM, RoleScope
from auth_engine.models.role_permission import RolePermissionORM
from auth_engine.seed.loader import load_json

logger = logging.getLogger(__name__)


async def _upsert_role(
    db: AsyncSession,
    *,
    name: str,
    description: str,
    scope: RoleScope,
    level: int,
    is_template: bool,
) -> RoleORM:
    if scope == RoleScope.PLATFORM:
        result = await db.execute(
            select(RoleORM).where(
                RoleORM.name == name,
                RoleORM.scope == RoleScope.PLATFORM,
                RoleORM.tenant_id.is_(None),
            )
        )
    else:
        result = await db.execute(
            select(RoleORM).where(
                RoleORM.name == name,
                RoleORM.is_template.is_(True),
                RoleORM.tenant_id.is_(None),
            )
        )

    role = result.scalar_one_or_none()
    if role:
        role.description = description
        role.level = level
        role.is_template = is_template
        return role

    role = RoleORM(
        name=name,
        description=description,
        scope=scope,
        level=level,
        is_template=is_template,
        tenant_id=None,
    )
    db.add(role)
    await db.flush()
    return role


def _permission_names(role_name: str, mapping: dict[str, Any], all_names: list[str]) -> list[str]:
    assigned = mapping.get(role_name, [])
    if assigned == ["*"] or assigned == "*":
        return all_names
    return list(assigned)


async def seed_roles(db: AsyncSession) -> None:
    payload = load_json("rbac.json")
    roles_data: list[dict[str, Any]] = payload["roles"]
    permissions_data: list[dict[str, Any]] = payload["permissions"]
    role_permissions: dict[str, Any] = payload["role_permissions"]
    all_perm_names = [p["name"] for p in permissions_data]

    for row in roles_data:
        await _upsert_role(
            db,
            name=row["name"],
            description=row["description"],
            scope=RoleScope(row["scope"]),
            level=int(row["level"]),
            is_template=bool(row["is_template"]),
        )

    await db.execute(
        insert(PermissionORM)
        .values([{"name": p["name"], "description": p["description"]} for p in permissions_data])
        .on_conflict_do_update(
            index_elements=["name"],
            set_={"description": insert(PermissionORM).excluded.description},
        )
    )
    await db.flush()

    roles = {
        r.name: r
        for r in (await db.execute(select(RoleORM).where(RoleORM.tenant_id.is_(None))))
        .scalars()
        .all()
    }
    perms = {p.name: p for p in (await db.execute(select(PermissionORM))).scalars().all()}

    assoc_rows = [
        {"role_id": roles[role_name].id, "permission_id": perms[perm_name].id}
        for role_name in role_permissions
        for perm_name in _permission_names(role_name, role_permissions, all_perm_names)
        if role_name in roles and perm_name in perms
    ]

    if assoc_rows:
        await db.execute(insert(RolePermissionORM).values(assoc_rows).on_conflict_do_nothing())

    await db.commit()
    logger.info("Roles and permissions seeded from data/rbac.json")
