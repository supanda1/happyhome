"""Create service tables

Revision ID: 000_service_tables
Revises: 
Create Date: 2025-09-13 23:48:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '000_service_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create service_categories table
    op.create_table('service_categories',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('icon', sa.String(length=10), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('image_paths', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for service_categories
    op.create_index(op.f('ix_service_categories_name'), 'service_categories', ['name'], unique=True)
    op.create_index(op.f('ix_service_categories_is_active'), 'service_categories', ['is_active'], unique=False)
    op.create_index(op.f('ix_service_categories_sort_order'), 'service_categories', ['sort_order'], unique=False)
    
    # Create service_subcategories table
    op.create_table('service_subcategories',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('category_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('icon', sa.String(length=10), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['service_categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for service_subcategories
    op.create_index(op.f('ix_service_subcategories_category_id'), 'service_subcategories', ['category_id'], unique=False)
    op.create_index(op.f('ix_service_subcategories_name'), 'service_subcategories', ['name'], unique=False)
    op.create_index(op.f('ix_service_subcategories_is_active'), 'service_subcategories', ['is_active'], unique=False)
    op.create_index(op.f('ix_service_subcategories_sort_order'), 'service_subcategories', ['sort_order'], unique=False)
    
    # Create services table
    op.create_table('services',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('category_id', sa.UUID(), nullable=False),
        sa.Column('subcategory_id', sa.UUID(), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('short_description', sa.String(length=300), nullable=False),
        sa.Column('base_price', sa.Float(), nullable=False),
        sa.Column('discounted_price', sa.Float(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('inclusions', sa.JSON(), nullable=False),
        sa.Column('exclusions', sa.JSON(), nullable=False),
        sa.Column('requirements', sa.JSON(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('review_count', sa.Integer(), nullable=False),
        sa.Column('booking_count', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_featured', sa.Boolean(), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('availability_settings', sa.JSON(), nullable=False),
        sa.Column('image_paths', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['service_categories.id'], ),
        sa.ForeignKeyConstraint(['subcategory_id'], ['service_subcategories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for services
    op.create_index(op.f('ix_services_name'), 'services', ['name'], unique=False)
    op.create_index(op.f('ix_services_category_id'), 'services', ['category_id'], unique=False)
    op.create_index(op.f('ix_services_subcategory_id'), 'services', ['subcategory_id'], unique=False)
    op.create_index(op.f('ix_services_base_price'), 'services', ['base_price'], unique=False)
    op.create_index(op.f('ix_services_rating'), 'services', ['rating'], unique=False)
    op.create_index(op.f('ix_services_is_active'), 'services', ['is_active'], unique=False)
    op.create_index(op.f('ix_services_is_featured'), 'services', ['is_featured'], unique=False)
    
    # Create service_photos table
    op.create_table('service_photos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('service_id', sa.UUID(), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('alt_text', sa.String(length=200), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for service_photos
    op.create_index(op.f('ix_service_photos_service_id'), 'service_photos', ['service_id'], unique=False)
    op.create_index(op.f('ix_service_photos_is_primary'), 'service_photos', ['is_primary'], unique=False)
    op.create_index(op.f('ix_service_photos_sort_order'), 'service_photos', ['sort_order'], unique=False)
    
    # Create service_variants table
    op.create_table('service_variants',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('service_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('base_price', sa.Float(), nullable=False),
        sa.Column('discounted_price', sa.Float(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('inclusions', sa.JSON(), nullable=False),
        sa.Column('exclusions', sa.JSON(), nullable=False),
        sa.Column('features', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for service_variants
    op.create_index(op.f('ix_service_variants_service_id'), 'service_variants', ['service_id'], unique=False)
    op.create_index(op.f('ix_service_variants_is_active'), 'service_variants', ['is_active'], unique=False)


def downgrade() -> None:
    # Drop service_variants table and indexes
    op.drop_index(op.f('ix_service_variants_is_active'), table_name='service_variants')
    op.drop_index(op.f('ix_service_variants_service_id'), table_name='service_variants')
    op.drop_table('service_variants')
    
    # Drop service_photos table and indexes
    op.drop_index(op.f('ix_service_photos_sort_order'), table_name='service_photos')
    op.drop_index(op.f('ix_service_photos_is_primary'), table_name='service_photos')
    op.drop_index(op.f('ix_service_photos_service_id'), table_name='service_photos')
    op.drop_table('service_photos')
    
    # Drop services table and indexes
    op.drop_index(op.f('ix_services_is_featured'), table_name='services')
    op.drop_index(op.f('ix_services_is_active'), table_name='services')
    op.drop_index(op.f('ix_services_rating'), table_name='services')
    op.drop_index(op.f('ix_services_base_price'), table_name='services')
    op.drop_index(op.f('ix_services_subcategory_id'), table_name='services')
    op.drop_index(op.f('ix_services_category_id'), table_name='services')
    op.drop_index(op.f('ix_services_name'), table_name='services')
    op.drop_table('services')
    
    # Drop service_subcategories table and indexes
    op.drop_index(op.f('ix_service_subcategories_sort_order'), table_name='service_subcategories')
    op.drop_index(op.f('ix_service_subcategories_is_active'), table_name='service_subcategories')
    op.drop_index(op.f('ix_service_subcategories_name'), table_name='service_subcategories')
    op.drop_index(op.f('ix_service_subcategories_category_id'), table_name='service_subcategories')
    op.drop_table('service_subcategories')
    
    # Drop service_categories table and indexes
    op.drop_index(op.f('ix_service_categories_sort_order'), table_name='service_categories')
    op.drop_index(op.f('ix_service_categories_is_active'), table_name='service_categories')
    op.drop_index(op.f('ix_service_categories_name'), table_name='service_categories')
    op.drop_table('service_categories')