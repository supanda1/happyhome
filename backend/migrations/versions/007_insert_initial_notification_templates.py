"""Insert initial notification templates

Revision ID: 007_notification_templates
Revises: 006_notifications
Create Date: 2025-09-13 14:45:00.000000

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = '007_notification_templates'
down_revision: Union[str, None] = '006_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get connection
    connection = op.get_bind()
    
    # Insert SMS notification templates
    sms_templates = [
        {
            'id': str(uuid.uuid4()),
            'name': 'order_placed_sms',
            'event_type': 'ORDER_PLACED',
            'notification_type': 'SMS',
            'subject_template': None,
            'message_template': 'Hi {customer_name}! Your order {order_number} has been placed successfully. Total: ₹{final_amount}. We will contact you soon to schedule the service. - Happy Homes',
            'description': 'SMS sent when customer places an order',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'final_amount', 'service_names'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'final_amount': '1500',
                'service_names': 'Plumbing Repair, Electrical Work'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'engineer_assigned_sms',
            'event_type': 'ENGINEER_ASSIGNED',
            'notification_type': 'SMS',
            'subject_template': None,
            'message_template': 'Good news {customer_name}! Engineer {engineer_name} has been assigned to your order {order_number}. Contact: {engineer_phone}. - Happy Homes',
            'description': 'SMS sent when engineer is assigned to order',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'engineer_name', 'engineer_phone', 'service_name'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'engineer_name': 'Amit Sharma',
                'engineer_phone': '+91 9876543210',
                'service_name': 'Plumbing Repair'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'service_scheduled_sms',
            'event_type': 'SERVICE_SCHEDULED',
            'notification_type': 'SMS',
            'subject_template': None,
            'message_template': 'Hi {customer_name}! Your service for order {order_number} is scheduled on {scheduled_date} between {time_slot}. Engineer: {engineer_name} - Happy Homes',
            'description': 'SMS sent when service is scheduled',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'scheduled_date', 'time_slot', 'engineer_name'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'scheduled_date': '15 Sep 2025',
                'time_slot': '10:00 AM - 12:00 PM',
                'engineer_name': 'Amit Sharma'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'engineer_en_route_sms',
            'event_type': 'ENGINEER_EN_ROUTE',
            'notification_type': 'SMS',
            'subject_template': None,
            'message_template': 'Hi {customer_name}! Engineer {engineer_name} is on the way to your location for order {order_number}. ETA: {eta} minutes. Contact: {engineer_phone} - Happy Homes',
            'description': 'SMS sent when engineer is en route',
            'is_active': True,
            'available_variables': ['customer_name', 'engineer_name', 'order_number', 'eta', 'engineer_phone'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'engineer_name': 'Amit Sharma',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'eta': '15',
                'engineer_phone': '+91 9876543210'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'service_started_sms',
            'event_type': 'SERVICE_STARTED',
            'notification_type': 'SMS',
            'subject_template': None,
            'message_template': 'Hi {customer_name}! Service work has started for order {order_number}. Engineer {engineer_name} is working on {service_name}. - Happy Homes',
            'description': 'SMS sent when service work begins',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'engineer_name', 'service_name'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'engineer_name': 'Amit Sharma',
                'service_name': 'Plumbing Repair'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'service_completed_sms',
            'event_type': 'SERVICE_COMPLETED',
            'notification_type': 'SMS',
            'subject_template': None,
            'message_template': 'Great news {customer_name}! Your service for order {order_number} is completed. Please rate our service. Total: ₹{final_amount}. Thank you! - Happy Homes',
            'description': 'SMS sent when service is completed',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'final_amount', 'service_name'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'final_amount': '1500',
                'service_name': 'Plumbing Repair'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'order_cancelled_sms',
            'event_type': 'ORDER_CANCELLED',
            'notification_type': 'SMS',
            'subject_template': None,
            'message_template': 'Hi {customer_name}, your order {order_number} has been cancelled as requested. Refund will be processed within 3-5 business days. - Happy Homes',
            'description': 'SMS sent when order is cancelled',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'cancellation_reason'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'cancellation_reason': 'Customer request'
            }
        }
    ]
    
    # Insert email notification templates
    email_templates = [
        {
            'id': str(uuid.uuid4()),
            'name': 'order_placed_email',
            'event_type': 'ORDER_PLACED',
            'notification_type': 'EMAIL',
            'subject_template': 'Order Confirmation - {order_number} | Happy Homes',
            'message_template': '''
Dear {customer_name},

Thank you for choosing Happy Homes! Your order has been successfully placed.

Order Details:
- Order Number: {order_number}
- Services: {service_names}
- Total Amount: ₹{final_amount}
- Address: {service_address}

What's Next:
1. Our team will review your order
2. We will assign the best engineer for your service
3. You will receive SMS/email updates about the progress

Need help? Contact us at support@happyhomes.com or call +91 9999888877

Best regards,
Happy Homes Team
            ''',
            'description': 'Email sent when customer places an order',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'service_names', 'final_amount', 'service_address'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'service_names': 'Plumbing Repair, Electrical Work',
                'final_amount': '1500',
                'service_address': '123 MG Road, Bangalore'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'engineer_assigned_email',
            'event_type': 'ENGINEER_ASSIGNED',
            'notification_type': 'EMAIL',
            'subject_template': 'Engineer Assigned - {order_number} | Happy Homes',
            'message_template': '''
Dear {customer_name},

Great news! We have assigned an expert engineer to your order.

Engineer Details:
- Name: {engineer_name}
- Contact: {engineer_phone}
- Expertise: {engineer_expertise}
- Rating: {engineer_rating}/5

Order Details:
- Order Number: {order_number}
- Service: {service_name}

The engineer will contact you soon to schedule the service at your convenience.

Best regards,
Happy Homes Team
            ''',
            'description': 'Email sent when engineer is assigned to order',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'engineer_name', 'engineer_phone', 'engineer_expertise', 'engineer_rating', 'service_name'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'engineer_name': 'Amit Sharma',
                'engineer_phone': '+91 9876543210',
                'engineer_expertise': 'Plumbing Specialist',
                'engineer_rating': '4.8',
                'service_name': 'Plumbing Repair'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'service_completed_email',
            'event_type': 'SERVICE_COMPLETED',
            'notification_type': 'EMAIL',
            'subject_template': 'Service Completed - {order_number} | Happy Homes',
            'message_template': '''
Dear {customer_name},

We're happy to inform you that your service has been successfully completed!

Service Summary:
- Order Number: {order_number}
- Service: {service_name}
- Engineer: {engineer_name}
- Completion Date: {completion_date}
- Total Amount: ₹{final_amount}

Service Warranty:
- 30-day service warranty included
- ₹10,000 damage protection
- Free follow-up if needed

Please rate our service and share your feedback:
[Rate Service Button - 5 Stars]

Need another service? Book now and get 10% off!

Thank you for choosing Happy Homes!

Best regards,
Happy Homes Team
            ''',
            'description': 'Email sent when service is completed',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'service_name', 'engineer_name', 'completion_date', 'final_amount'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'service_name': 'Plumbing Repair',
                'engineer_name': 'Amit Sharma',
                'completion_date': '15 Sep 2025',
                'final_amount': '1500'
            }
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'feedback_request_email',
            'event_type': 'FEEDBACK_REQUEST',
            'notification_type': 'EMAIL',
            'subject_template': 'How was your service experience? | Happy Homes',
            'message_template': '''
Dear {customer_name},

We hope you're satisfied with the service we provided for order {order_number}.

Your feedback helps us improve and serve you better.

Service Details:
- Service: {service_name}
- Engineer: {engineer_name}
- Completed on: {completion_date}

Please take a moment to:
1. Rate your service experience (1-5 stars)
2. Share any comments or suggestions
3. Let us know if everything is working properly

[Rate & Review Button]

Special Offer: Book your next service within 30 days and get 15% off!

Thank you for choosing Happy Homes!

Best regards,
Happy Homes Team
            ''',
            'description': 'Email requesting customer feedback after service completion',
            'is_active': True,
            'available_variables': ['customer_name', 'order_number', 'service_name', 'engineer_name', 'completion_date'],
            'sample_data': {
                'customer_name': 'Rajesh Kumar',
                'order_number': 'HH-20250913143000-A1B2C3D4',
                'service_name': 'Plumbing Repair',
                'engineer_name': 'Amit Sharma',
                'completion_date': '15 Sep 2025'
            }
        }
    ]
    
    # Combine all templates
    all_templates = sms_templates + email_templates
    
    # Insert templates
    for template in all_templates:
        connection.execute(
            text("""
                INSERT INTO notification_templates 
                (id, name, event_type, notification_type, subject_template, message_template, 
                 description, is_active, available_variables, sample_data, created_at, updated_at)
                VALUES 
                (:id, :name, :event_type, :notification_type, :subject_template, :message_template,
                 :description, :is_active, :available_variables, :sample_data, now(), now())
            """),
            {
                'id': template['id'],
                'name': template['name'],
                'event_type': template['event_type'],
                'notification_type': template['notification_type'],
                'subject_template': template['subject_template'],
                'message_template': template['message_template'],
                'description': template['description'],
                'is_active': template['is_active'],
                'available_variables': str(template['available_variables']).replace("'", '"'),
                'sample_data': str(template['sample_data']).replace("'", '"') if template['sample_data'] else None
            }
        )


def downgrade() -> None:
    # Get connection
    connection = op.get_bind()
    
    # Delete all notification templates
    connection.execute(text("DELETE FROM notification_templates WHERE name LIKE '%_sms' OR name LIKE '%_email'"))