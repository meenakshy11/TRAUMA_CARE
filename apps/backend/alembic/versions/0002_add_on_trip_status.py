"""Add ON_TRIP to ambulancestatus enum

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-02

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL requires ALTER TYPE to add enum values
    op.execute("ALTER TYPE ambulancestatus ADD VALUE IF NOT EXISTS 'ON_TRIP'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values — downgrade is a no-op
    pass
