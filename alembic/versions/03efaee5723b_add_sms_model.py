"""add sms model

Revision ID: 03efaee5723b
Revises: e0f528e68aa9
Create Date: 2026-02-27 18:49:32.125994

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "03efaee5723b"  # pragma: allowlist secret
down_revision: str | Sequence[str] | None = "e0f528e68aa9"  # pragma: allowlist secret
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "tenant_sms_configs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tenant_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("encrypted_credentials", sa.String(), nullable=False),
        sa.Column("from_number", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("tenant_sms_configs")
