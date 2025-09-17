"""Create employees table

Revision ID: 001_employees
Revises: 
Create Date: 2025-09-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_employees'
down_revision: Union[str, None] = '000_service_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create employees table
    op.create_table('employees',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('expertise_areas', sa.JSON(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('completed_jobs', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_available', sa.Boolean(), nullable=False),
        sa.Column('location', sa.String(length=200), nullable=False),
        sa.Column('service_areas', sa.JSON(), nullable=False),
        sa.Column('employee_id', sa.String(length=50), nullable=True),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('position', sa.String(length=100), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=100), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('work_schedule', sa.JSON(), nullable=False),
        sa.Column('skills', sa.JSON(), nullable=False),
        sa.Column('certifications', sa.JSON(), nullable=False),
        sa.Column('average_job_time', sa.Float(), nullable=True),
        sa.Column('customer_satisfaction_score', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_employees_name'), 'employees', ['name'], unique=False)
    op.create_index(op.f('ix_employees_email'), 'employees', ['email'], unique=True)
    op.create_index(op.f('ix_employees_phone'), 'employees', ['phone'], unique=False)
    op.create_index(op.f('ix_employees_rating'), 'employees', ['rating'], unique=False)
    op.create_index(op.f('ix_employees_is_active'), 'employees', ['is_active'], unique=False)
    op.create_index(op.f('ix_employees_is_available'), 'employees', ['is_available'], unique=False)
    op.create_index(op.f('ix_employees_employee_id'), 'employees', ['employee_id'], unique=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_employees_employee_id'), table_name='employees')
    op.drop_index(op.f('ix_employees_is_available'), table_name='employees')
    op.drop_index(op.f('ix_employees_is_active'), table_name='employees')
    op.drop_index(op.f('ix_employees_rating'), table_name='employees')
    op.drop_index(op.f('ix_employees_phone'), table_name='employees')
    op.drop_index(op.f('ix_employees_email'), table_name='employees')
    op.drop_index(op.f('ix_employees_name'), table_name='employees')
    
    # Drop table
    op.drop_table('employees')