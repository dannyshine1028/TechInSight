"""Add CSVFile table and source_file_id to documents

Revision ID: add_csv_file_source
Revises: 554e5f27f80f
Create Date: 2026-02-25 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_csv_file_source'
down_revision = '554e5f27f80f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create csv_files table first (before adding foreign key)
    op.create_table('csv_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('imported_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('total_rows', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('status', sa.String(length=50), nullable=True, server_default='uploaded'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('filename')
    )
    op.create_index(op.f('ix_csv_files_id'), 'csv_files', ['id'], unique=False)
    
    # Add source_file_id column to documents table
    op.add_column('documents', sa.Column('source_file_id', sa.Integer(), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key(
        'fk_documents_source_file_id',
        'documents', 'csv_files',
        ['source_file_id'], ['id']
    )


def downgrade() -> None:
    # Remove foreign key and column
    op.drop_constraint('fk_documents_source_file_id', 'documents', type_='foreignkey')
    op.drop_column('documents', 'source_file_id')
    
    # Drop csv_files table
    op.drop_index(op.f('ix_csv_files_id'), table_name='csv_files')
    op.drop_table('csv_files')
