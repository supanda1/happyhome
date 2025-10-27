"""Insert initial users

Revision ID: 009_insert_initial_users
Revises: 008_create_users_tables
Create Date: 2025-10-27 22:35:00.000000

"""
from typing import Sequence, Union
import uuid
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

# revision identifiers, used by Alembic.
revision: str = '009_insert_initial_users'
down_revision: Union[str, None] = '008_create_users_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Import password hashing function (using bcrypt with basic hashing)
    import bcrypt
    
    def hash_password(password: str) -> str:
        """Hash password using bcrypt."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Define the users table structure for bulk insert
    users_table = table('users',
        column('id', sa.UUID()),
        column('created_at', sa.DateTime(timezone=True)),
        column('updated_at', sa.DateTime(timezone=True)),
        column('email', sa.String(255)),
        column('password_hash', sa.String(255)),
        column('first_name', sa.String(100)),
        column('last_name', sa.String(100)),
        column('phone', sa.String(20)),
        column('role', sa.String(20)),
        column('is_active', sa.Boolean()),
        column('is_verified', sa.Boolean()),
        column('last_login', sa.DateTime(timezone=True)),
        column('failed_login_attempts', sa.Integer()),
        column('locked_until', sa.DateTime(timezone=True)),
        column('profile_completed', sa.Boolean()),
        column('avatar_url', sa.String(500)),
        column('preferences', sa.JSON()),
    )
    
    # Define user addresses table structure for bulk insert
    user_addresses_table = table('user_addresses',
        column('id', sa.UUID()),
        column('created_at', sa.DateTime(timezone=True)),
        column('updated_at', sa.DateTime(timezone=True)),
        column('user_id', sa.UUID()),
        column('type', sa.String(20)),
        column('title', sa.String(100)),
        column('full_address', sa.Text()),
        column('landmark', sa.String(200)),
        column('city', sa.String(100)),
        column('state', sa.String(100)),
        column('postal_code', sa.String(20)),
        column('country', sa.String(100)),
        column('latitude', sa.Float()),
        column('longitude', sa.Float()),
        column('is_default', sa.Boolean()),
        column('is_active', sa.Boolean()),
    )
    
    # Generate UUIDs for users
    super_admin_id = str(uuid.uuid4())
    admin_id = str(uuid.uuid4())
    customer1_id = str(uuid.uuid4())
    customer2_id = str(uuid.uuid4())
    
    now = datetime.utcnow()
    
    # Insert initial users
    users_data = [
        {
            'id': super_admin_id,
            'created_at': now,
            'updated_at': now,
            'email': 'superadmin@happyhomes.com',
            'password_hash': hash_password('superadmin123'),
            'first_name': 'Super',
            'last_name': 'Admin',
            'phone': '+919876543200',
            'role': 'super_admin',
            'is_active': True,
            'is_verified': True,
            'last_login': None,
            'failed_login_attempts': 0,
            'locked_until': None,
            'profile_completed': True,
            'avatar_url': None,
            'preferences': {},
        },
        {
            'id': admin_id,
            'created_at': now,
            'updated_at': now,
            'email': 'admin@happyhomes.com',
            'password_hash': hash_password('admin123'),
            'first_name': 'Admin',
            'last_name': 'User',
            'phone': '+919876543210',
            'role': 'admin',
            'is_active': True,
            'is_verified': True,
            'last_login': None,
            'failed_login_attempts': 0,
            'locked_until': None,
            'profile_completed': True,
            'avatar_url': None,
            'preferences': {},
        },
        {
            'id': customer1_id,
            'created_at': now,
            'updated_at': now,
            'email': 'customer@example.com',
            'password_hash': hash_password('customer123'),
            'first_name': 'John',
            'last_name': 'Doe',
            'phone': '+919876543211',
            'role': 'customer',
            'is_active': True,
            'is_verified': True,
            'last_login': None,
            'failed_login_attempts': 0,
            'locked_until': None,
            'profile_completed': True,
            'avatar_url': None,
            'preferences': {},
        },
        {
            'id': customer2_id,
            'created_at': now,
            'updated_at': now,
            'email': 'jane.smith@example.com',
            'password_hash': hash_password('jane123'),
            'first_name': 'Jane',
            'last_name': 'Smith',
            'phone': '+919876543212',
            'role': 'customer',
            'is_active': True,
            'is_verified': True,
            'last_login': None,
            'failed_login_attempts': 0,
            'locked_until': None,
            'profile_completed': True,
            'avatar_url': None,
            'preferences': {},
        },
    ]
    
    # Insert users
    op.bulk_insert(users_table, users_data)
    
    # Insert sample addresses for customers
    addresses_data = [
        {
            'id': str(uuid.uuid4()),
            'created_at': now,
            'updated_at': now,
            'user_id': customer1_id,
            'type': 'home',
            'title': 'Home',
            'full_address': '123 Main Street, Sector 1, Bhubaneswar',
            'landmark': 'Near City Mall',
            'city': 'Bhubaneswar',
            'state': 'Odisha',
            'postal_code': '751001',
            'country': 'India',
            'latitude': 20.2961,
            'longitude': 85.8245,
            'is_default': True,
            'is_active': True,
        },
        {
            'id': str(uuid.uuid4()),
            'created_at': now,
            'updated_at': now,
            'user_id': customer2_id,
            'type': 'home',
            'title': 'Home',
            'full_address': '456 Garden Road, Sahid Nagar, Bhubaneswar',
            'landmark': 'Opposite Park',
            'city': 'Bhubaneswar',
            'state': 'Odisha',
            'postal_code': '751007',
            'country': 'India',
            'latitude': 20.3019,
            'longitude': 85.8449,
            'is_default': True,
            'is_active': True,
        },
    ]
    
    # Insert addresses
    op.bulk_insert(user_addresses_table, addresses_data)


def downgrade() -> None:
    # Remove the inserted users and addresses
    op.execute("DELETE FROM user_addresses WHERE user_id IN (SELECT id FROM users WHERE email IN ('superadmin@happyhomes.com', 'admin@happyhomes.com', 'customer@example.com', 'jane.smith@example.com'))")
    op.execute("DELETE FROM users WHERE email IN ('superadmin@happyhomes.com', 'admin@happyhomes.com', 'customer@example.com', 'jane.smith@example.com')")