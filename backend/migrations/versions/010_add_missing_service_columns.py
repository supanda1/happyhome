"""Add missing service columns for backend compatibility

Revision ID: 010_add_service_columns
Revises: 009_insert_initial_users
Create Date: 2025-10-27 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '010_add_service_columns'
down_revision: Union[str, None] = '009_insert_initial_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to services table that the Node.js backend expects
    
    # Add GST percentage column
    op.add_column('services', sa.Column('gst_percentage', sa.Numeric(5, 2), nullable=False, server_default='18.00'))
    
    # Add service charge column  
    op.add_column('services', sa.Column('service_charge', sa.Numeric(10, 2), nullable=False, server_default='0.00'))
    
    # Add is_combo_eligible column
    op.add_column('services', sa.Column('is_combo_eligible', sa.Boolean(), nullable=False, server_default='true'))
    
    # Create indexes for the new columns
    op.create_index(op.f('ix_services_gst_percentage'), 'services', ['gst_percentage'], unique=False)
    op.create_index(op.f('ix_services_is_combo_eligible'), 'services', ['is_combo_eligible'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_services_is_combo_eligible'), table_name='services')
    op.drop_index(op.f('ix_services_gst_percentage'), table_name='services')
    
    # Drop columns
    op.drop_column('services', 'is_combo_eligible')
    op.drop_column('services', 'service_charge')
    op.drop_column('services', 'gst_percentage')