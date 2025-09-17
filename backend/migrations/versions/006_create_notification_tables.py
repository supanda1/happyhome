"""Create notification system tables

Revision ID: 006_notifications
Revises: 005_insert_initial_coupons
Create Date: 2025-09-13 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '006_notifications'
down_revision: Union[str, None] = '005_initial_coupons'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create notification templates table
    op.create_table('notification_templates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('event_type', sa.Enum('ORDER_PLACED', 'ORDER_CONFIRMED', 'ENGINEER_ASSIGNED', 'SERVICE_SCHEDULED', 'ENGINEER_EN_ROUTE', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'PAYMENT_REMINDER', 'FEEDBACK_REQUEST', 'ORDER_CANCELLED', 'SERVICE_RESCHEDULED', name='notificationevent'), nullable=False),
        sa.Column('notification_type', sa.Enum('SMS', 'EMAIL', 'PUSH', name='notificationtype'), nullable=False),
        sa.Column('subject_template', sa.String(length=200), nullable=True),
        sa.Column('message_template', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('available_variables', sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column('sample_data', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create notification templates indexes
    op.create_index(op.f('ix_notification_templates_name'), 'notification_templates', ['name'], unique=True)
    op.create_index(op.f('ix_notification_templates_event_type'), 'notification_templates', ['event_type'], unique=False)
    op.create_index(op.f('ix_notification_templates_notification_type'), 'notification_templates', ['notification_type'], unique=False)
    op.create_index(op.f('ix_notification_templates_is_active'), 'notification_templates', ['is_active'], unique=False)

    # Create user notification preferences table
    op.create_table('user_notification_preferences',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('sms_enabled', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('email_enabled', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('order_updates', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('engineer_updates', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('marketing_notifications', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('promotional_offers', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('quiet_hours_start', sa.String(length=5), nullable=True, server_default=sa.text("'22:00'")),
        sa.Column('quiet_hours_end', sa.String(length=5), nullable=True, server_default=sa.text("'08:00'")),
        sa.Column('preferred_phone', sa.String(length=20), nullable=True),
        sa.Column('preferred_email', sa.String(length=100), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=False, server_default=sa.text("'Asia/Kolkata'")),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user notification preferences indexes
    op.create_index(op.f('ix_user_notification_preferences_user_id'), 'user_notification_preferences', ['user_id'], unique=False)

    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('customer_id', sa.String(length=255), nullable=False),
        sa.Column('customer_name', sa.String(length=100), nullable=False),
        sa.Column('customer_phone', sa.String(length=20), nullable=True),
        sa.Column('customer_email', sa.String(length=100), nullable=True),
        sa.Column('notification_type', sa.Enum('SMS', 'EMAIL', 'PUSH', name='notificationtype'), nullable=False),
        sa.Column('event_type', sa.Enum('ORDER_PLACED', 'ORDER_CONFIRMED', 'ENGINEER_ASSIGNED', 'SERVICE_SCHEDULED', 'ENGINEER_EN_ROUTE', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'PAYMENT_REMINDER', 'FEEDBACK_REQUEST', 'ORDER_CANCELLED', 'SERVICE_RESCHEDULED', name='notificationevent'), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'NORMAL', 'HIGH', 'URGENT', name='notificationpriority'), nullable=False, server_default=sa.text("'NORMAL'")),
        sa.Column('subject', sa.String(length=200), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=True),
        sa.Column('order_number', sa.String(length=50), nullable=True),
        sa.Column('template_id', sa.UUID(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED', name='notificationstatus'), nullable=False, server_default=sa.text("'PENDING'")),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('provider', sa.String(length=50), nullable=True),
        sa.Column('provider_message_id', sa.String(length=100), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('max_retries', sa.Integer(), nullable=False, server_default=sa.text('3')),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['notification_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create notifications indexes
    op.create_index(op.f('ix_notifications_customer_id'), 'notifications', ['customer_id'], unique=False)
    op.create_index(op.f('ix_notifications_notification_type'), 'notifications', ['notification_type'], unique=False)
    op.create_index(op.f('ix_notifications_event_type'), 'notifications', ['event_type'], unique=False)
    op.create_index(op.f('ix_notifications_order_id'), 'notifications', ['order_id'], unique=False)
    op.create_index(op.f('ix_notifications_order_number'), 'notifications', ['order_number'], unique=False)
    op.create_index(op.f('ix_notifications_status'), 'notifications', ['status'], unique=False)

    # Create notification logs table
    op.create_table('notification_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('notification_id', sa.UUID(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('provider_response', sa.JSON(), nullable=True),
        sa.Column('error_details', sa.Text(), nullable=True),
        sa.Column('logged_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['notification_id'], ['notifications.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create notification logs indexes
    op.create_index(op.f('ix_notification_logs_notification_id'), 'notification_logs', ['notification_id'], unique=False)


def downgrade() -> None:
    # Drop notification logs indexes
    op.drop_index(op.f('ix_notification_logs_notification_id'), table_name='notification_logs')
    
    # Drop notification logs table
    op.drop_table('notification_logs')
    
    # Drop notifications indexes
    op.drop_index(op.f('ix_notifications_status'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_order_number'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_order_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_event_type'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_notification_type'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_customer_id'), table_name='notifications')
    
    # Drop notifications table
    op.drop_table('notifications')
    
    # Drop user notification preferences indexes
    op.drop_index(op.f('ix_user_notification_preferences_user_id'), table_name='user_notification_preferences')
    
    # Drop user notification preferences table
    op.drop_table('user_notification_preferences')
    
    # Drop notification templates indexes
    op.drop_index(op.f('ix_notification_templates_is_active'), table_name='notification_templates')
    op.drop_index(op.f('ix_notification_templates_notification_type'), table_name='notification_templates')
    op.drop_index(op.f('ix_notification_templates_event_type'), table_name='notification_templates')
    op.drop_index(op.f('ix_notification_templates_name'), table_name='notification_templates')
    
    # Drop notification templates table
    op.drop_table('notification_templates')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS notificationtype CASCADE')
    op.execute('DROP TYPE IF EXISTS notificationevent CASCADE')
    op.execute('DROP TYPE IF EXISTS notificationpriority CASCADE')
    op.execute('DROP TYPE IF EXISTS notificationstatus CASCADE')