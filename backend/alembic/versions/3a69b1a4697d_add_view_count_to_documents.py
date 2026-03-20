"""add_view_count_to_documents

Revision ID: 3a69b1a4697d
Revises: 5bab4c3950f5
Create Date: 2026-02-26 10:03:16.909932

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3a69b1a4697d'
down_revision = '5bab4c3950f5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add view_count column to documents table
    op.add_column('documents', sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Remove view_count column from documents table
    op.drop_column('documents', 'view_count')
