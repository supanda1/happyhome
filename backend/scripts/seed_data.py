"""
Database seeder script for Household Services API.

This script populates the database with sample data including:
- Service categories and subcategories
- Sample services with variants
- Admin and customer users
- Sample bookings and reviews
- Coupons and promotional offers
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List

# Add the project root to the path
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings
from app.database.connection import Database
from app.models import *
from app.core.security import get_password_hash

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataSeeder:
    """Database seeder for sample data."""
    
    def __init__(self):
        self.categories = {}
        self.subcategories = {}
        self.services = {}
        self.users = {}
    
    async def seed_all(self):
        """Seed all sample data."""
        logger.info("Starting database seeding...")
        
        # Connect to database
        await Database.connect_db()
        
        try:
            async with Database.get_session() as session:
                # Seed in order due to dependencies
                await self.seed_users(session)
                await self.seed_service_categories(session)
                await self.seed_service_subcategories(session)
                await self.seed_services(session)
                await self.seed_service_variants(session)
                await self.seed_coupons(session)
                await self.seed_bookings(session)
                await self.seed_reviews(session)
                
                await session.commit()
                logger.info("Database seeding completed successfully!")
                
        except Exception as e:
            logger.error(f"Error during seeding: {e}")
            raise
        finally:
            await Database.close_db()
    
    async def seed_users(self, session):
        """Seed sample users."""
        logger.info("Seeding users...")
        
        users_data = [
            {
                "email": "admin@happyhomes.com",
                "password": "admin123",
                "first_name": "Admin",
                "last_name": "User",
                "phone": "+919876543210",
                "role": UserRole.ADMIN,
                "is_verified": True,
                "profile_completed": True,
            },
            {
                "email": "customer@example.com",
                "password": "customer123",
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+919876543211",
                "role": UserRole.CUSTOMER,
                "is_verified": True,
                "profile_completed": True,
            },
            {
                "email": "jane.smith@example.com",
                "password": "jane123",
                "first_name": "Jane",
                "last_name": "Smith",
                "phone": "+919876543212",
                "role": UserRole.CUSTOMER,
                "is_verified": True,
                "profile_completed": True,
            },
        ]
        
        for user_data in users_data:
            password = user_data.pop("password")
            user = User(
                **user_data,
                password_hash=get_password_hash(password)
            )
            session.add(user)
            await session.flush()  # Get the user ID
            self.users[user_data["email"]] = user
            
            # Add sample address for customers
            if user.role == UserRole.CUSTOMER:
                address = UserAddress(
                    user_id=user.id,
                    type="home",
                    title="Home",
                    full_address="123 Main Street, Sector 1",
                    landmark="Near City Mall",
                    city="Bhubaneswar",
                    state="Odisha",
                    postal_code="751001",
                    country="India",
                    is_default=True
                )
                session.add(address)
        
        logger.info(f"Seeded {len(users_data)} users")
    
    async def seed_service_categories(self, session):
        """Seed service categories matching frontend."""
        logger.info("Seeding service categories...")
        
        categories_data = [
            {"name": "Plumbing", "description": "Professional plumbing services for your home", "icon": "🔧", "sort_order": 1},
            {"name": "Electrical", "description": "Expert electrical installation and repair services", "icon": "⚡", "sort_order": 2},
            {"name": "Cleaning", "description": "Professional cleaning services for home and office", "icon": "🧹", "sort_order": 3},
            {"name": "Call A Service", "description": "On-demand service booking and courier services", "icon": "📞", "sort_order": 4},
            {"name": "Finance & Insurance", "description": "Financial services and documentation support", "icon": "💰", "sort_order": 5},
            {"name": "Personal Care", "description": "Personal care and wellness services", "icon": "💄", "sort_order": 6},
            {"name": "Civil Work", "description": "Construction and renovation services", "icon": "🏗️", "sort_order": 7},
        ]
        
        for cat_data in categories_data:
            category = ServiceCategory(**cat_data)
            session.add(category)
            await session.flush()
            self.categories[cat_data["name"]] = category
        
        logger.info(f"Seeded {len(categories_data)} service categories")
    
    async def seed_service_subcategories(self, session):
        """Seed service subcategories."""
        logger.info("Seeding service subcategories...")
        
        subcategories_data = {
            "Plumbing": [
                {"name": "Bath Fittings", "description": "Installation and repair of bathroom fixtures", "icon": "🚿", "sort_order": 1},
                {"name": "Basin, Sink & Drainage", "description": "Kitchen and bathroom sink services", "icon": "🚰", "sort_order": 2},
                {"name": "Grouting", "description": "Tile grouting and sealing services", "icon": "🔧", "sort_order": 3},
                {"name": "Toilets", "description": "Toilet installation and repair", "icon": "🚽", "sort_order": 4},
                {"name": "Pipe & Connector", "description": "Pipe fitting and connector services", "icon": "⚙️", "sort_order": 5},
                {"name": "Water Tank", "description": "Water tank installation and maintenance", "icon": "💧", "sort_order": 6},
                {"name": "Others", "description": "Other plumbing services", "icon": "🔧", "sort_order": 7},
            ],
            "Electrical": [
                {"name": "Wiring & Installation", "description": "Electrical wiring and installation services", "icon": "⚡", "sort_order": 1},
                {"name": "Appliance Repair", "description": "Home appliance repair services", "icon": "🔌", "sort_order": 2},
                {"name": "Switch & Socket", "description": "Switch and socket installation", "icon": "💡", "sort_order": 3},
                {"name": "Fan Installation", "description": "Ceiling and wall fan installation", "icon": "🌀", "sort_order": 4},
                {"name": "Lighting Solutions", "description": "LED and lighting installation", "icon": "💡", "sort_order": 5},
                {"name": "Electrical Safety Check", "description": "Electrical system safety inspection", "icon": "⚡", "sort_order": 6},
            ],
            "Cleaning": [
                {"name": "Bathroom Cleaning", "description": "Deep bathroom cleaning services", "icon": "🚿", "sort_order": 1},
                {"name": "AC Cleaning", "description": "Air conditioner cleaning and maintenance", "icon": "❄️", "sort_order": 2},
                {"name": "Water Tank Cleaning", "description": "Water tank cleaning and sanitization", "icon": "💧", "sort_order": 3},
                {"name": "Septic Tank Cleaning", "description": "Septic tank cleaning services", "icon": "🚽", "sort_order": 4},
                {"name": "Water Purifier Cleaning", "description": "Water purifier maintenance", "icon": "💧", "sort_order": 5},
                {"name": "Car Wash", "description": "Professional car washing services", "icon": "🚗", "sort_order": 6},
            ],
        }
        
        for category_name, subcats in subcategories_data.items():
            category = self.categories[category_name]
            for subcat_data in subcats:
                subcategory = ServiceSubcategory(
                    category_id=category.id,
                    **subcat_data
                )
                session.add(subcategory)
                await session.flush()
                self.subcategories[f"{category_name}:{subcat_data['name']}"] = subcategory
        
        total_subcategories = sum(len(subcats) for subcats in subcategories_data.values())
        logger.info(f"Seeded {total_subcategories} service subcategories")
    
    async def seed_services(self, session):
        """Seed sample services."""
        logger.info("Seeding services...")
        
        services_data = [
            {
                "name": "Bath Fittings Installation & Repair",
                "category": "Plumbing",
                "subcategory": "Bath Fittings",
                "description": "Professional installation and repair of bathroom fittings including taps, showerheads, and accessories.",
                "short_description": "Expert bathroom fitting services with warranty",
                "base_price": 99.0,
                "discounted_price": 99.0,
                "duration": 60,
                "inclusions": ["Professional technician", "Basic tools", "Installation service", "30-day warranty"],
                "exclusions": ["Fitting materials", "Plumbing materials", "Painting work"],
                "requirements": ["Customer to arrange fittings", "Water connection availability", "Clear workspace"],
                "rating": 4.8,
                "review_count": 1247,
                "booking_count": 324,
                "is_featured": True,
                "tags": ["plumbing", "bathroom", "installation", "repair"],
            },
            {
                "name": "Kitchen Sink Installation",
                "category": "Plumbing", 
                "subcategory": "Basin, Sink & Drainage",
                "description": "Complete kitchen sink installation service including drainage connection and testing.",
                "short_description": "Professional kitchen sink installation service",
                "base_price": 149.0,
                "discounted_price": 129.0,
                "duration": 90,
                "inclusions": ["Professional plumber", "Installation service", "Drainage connection", "Testing"],
                "exclusions": ["Sink and fixtures", "Plumbing pipes", "Electrical work"],
                "requirements": ["Customer to arrange sink", "Plumbing connections ready"],
                "rating": 4.6,
                "review_count": 856,
                "booking_count": 198,
                "is_featured": False,
                "tags": ["plumbing", "kitchen", "sink", "installation"],
            },
            {
                "name": "Electrical Wiring Installation",
                "category": "Electrical",
                "subcategory": "Wiring & Installation", 
                "description": "Complete electrical wiring installation for new construction or renovation projects.",
                "short_description": "Professional electrical wiring services",
                "base_price": 299.0,
                "discounted_price": None,
                "duration": 180,
                "inclusions": ["Certified electrician", "Wiring installation", "Testing", "Safety check"],
                "exclusions": ["Electrical materials", "Switches and sockets", "Permit fees"],
                "requirements": ["Electrical plan ready", "Materials arranged", "Clear access"],
                "rating": 4.7,
                "review_count": 623,
                "booking_count": 142,
                "is_featured": True,
                "tags": ["electrical", "wiring", "installation", "safety"],
            },
        ]
        
        for service_data in services_data:
            category_name = service_data.pop("category")
            subcategory_name = service_data.pop("subcategory")
            
            category = self.categories[category_name]
            subcategory = self.subcategories[f"{category_name}:{subcategory_name}"]
            
            service = Service(
                category_id=category.id,
                subcategory_id=subcategory.id,
                **service_data
            )
            session.add(service)
            await session.flush()
            self.services[service_data["name"]] = service
        
        logger.info(f"Seeded {len(services_data)} services")
    
    async def seed_service_variants(self, session):
        """Seed service variants."""
        logger.info("Seeding service variants...")
        
        # Bath Fittings variants
        bath_fittings_service = self.services["Bath Fittings Installation & Repair"]
        
        variants_data = [
            {
                "service_id": bath_fittings_service.id,
                "name": "Classic",
                "description": "Basic installation and repair service",
                "base_price": 99.0,
                "discounted_price": None,
                "duration": 60,
                "inclusions": [
                    "Installation of 1-2 fittings",
                    "Basic repair work",
                    "30-day service warranty",
                    "Professional technician"
                ],
                "exclusions": [
                    "Fitting materials",
                    "Plumbing materials",
                    "Major pipe work"
                ],
                "features": {
                    "warranty_days": 30,
                    "max_fittings": 2,
                    "emergency_support": False
                },
                "sort_order": 1,
            },
            {
                "service_id": bath_fittings_service.id,
                "name": "Premium",
                "description": "Advanced installation with premium features",
                "base_price": 149.0,
                "discounted_price": None,
                "duration": 90,
                "inclusions": [
                    "Installation of up to 5 fittings",
                    "Advanced repair work",
                    "1-year extended warranty",
                    "Premium technician",
                    "Quality testing"
                ],
                "exclusions": [
                    "Premium fitting materials",
                    "Structural modifications"
                ],
                "features": {
                    "warranty_days": 365,
                    "max_fittings": 5,
                    "emergency_support": True,
                    "quality_guarantee": True
                },
                "sort_order": 2,
            },
        ]
        
        for variant_data in variants_data:
            variant = ServiceVariant(**variant_data)
            session.add(variant)
        
        logger.info(f"Seeded {len(variants_data)} service variants")
    
    async def seed_coupons(self, session):
        """Seed sample coupons."""
        logger.info("Seeding coupons...")
        
        admin_user = self.users["admin@happyhomes.com"]
        now = datetime.utcnow()
        
        coupons_data = [
            {
                "code": "WELCOME10",
                "name": "Welcome Offer",
                "description": "Get 10% off on your first booking",
                "type": CouponType.PERCENTAGE,
                "value": 10.0,
                "minimum_order_amount": 50.0,
                "maximum_discount_amount": 100.0,
                "usage_limit": 1000,
                "per_user_limit": 1,
                "valid_from": now,
                "valid_until": now + timedelta(days=30),
                "created_by": admin_user.id,
                "marketing_message": "Save 10% on your first service booking!",
            },
            {
                "code": "SAVE50",
                "name": "Flat Rs.50 Off",
                "description": "Get flat Rs.50 off on bookings above Rs.200",
                "type": CouponType.FIXED,
                "value": 50.0,
                "minimum_order_amount": 200.0,
                "usage_limit": 500,
                "per_user_limit": 3,
                "valid_from": now,
                "valid_until": now + timedelta(days=15),
                "created_by": admin_user.id,
                "marketing_message": "Flat Rs.50 savings on your service!",
            },
            {
                "code": "PREMIUM20",
                "name": "Premium Service Discount",
                "description": "20% off on premium service variants",
                "type": CouponType.PERCENTAGE,
                "value": 20.0,
                "minimum_order_amount": 100.0,
                "maximum_discount_amount": 200.0,
                "usage_limit": 200,
                "per_user_limit": 2,
                "valid_from": now,
                "valid_until": now + timedelta(days=45),
                "applicable_categories": [str(self.categories["Plumbing"].id)],
                "created_by": admin_user.id,
                "marketing_message": "Special discount on premium plumbing services!",
            },
        ]
        
        for coupon_data in coupons_data:
            coupon = Coupon(**coupon_data)
            session.add(coupon)
        
        logger.info(f"Seeded {len(coupons_data)} coupons")
    
    async def seed_bookings(self, session):
        """Seed sample bookings."""
        logger.info("Seeding bookings...")
        
        customer = self.users["customer@example.com"]
        service = self.services["Bath Fittings Installation & Repair"]
        
        # Get customer's address
        customer_address = session.query(UserAddress).filter_by(user_id=customer.id).first()
        
        bookings_data = [
            {
                "user_id": customer.id,
                "service_id": service.id,
                "address_id": customer_address.id,
                "scheduled_date": datetime.utcnow() + timedelta(days=3),
                "scheduled_time_start": "10:00",
                "scheduled_time_end": "11:00",
                "status": BookingStatus.CONFIRMED,
                "quantity": 1,
                "unit_price": 99.0,
                "subtotal_amount": 99.0,
                "tax_amount": 17.82,  # 18% GST
                "total_amount": 116.82,
                "customer_notes": "Please install the new shower head in the master bathroom",
                "payment_status": PaymentStatus.PAID,
                "payment_method": "online",
                "transaction_id": "TXN123456789",
            },
            {
                "user_id": customer.id,
                "service_id": service.id,
                "address_id": customer_address.id,
                "scheduled_date": datetime.utcnow() - timedelta(days=5),
                "scheduled_time_start": "14:00",
                "scheduled_time_end": "15:00",
                "status": BookingStatus.COMPLETED,
                "quantity": 1,
                "unit_price": 99.0,
                "subtotal_amount": 99.0,
                "tax_amount": 17.82,
                "total_amount": 116.82,
                "customer_notes": "Kitchen tap repair needed urgently",
                "payment_status": PaymentStatus.PAID,
                "payment_method": "cash",
                "completed_at": datetime.utcnow() - timedelta(days=5, hours=1),
            },
        ]
        
        for booking_data in bookings_data:
            booking = Booking(**booking_data)
            session.add(booking)
        
        logger.info(f"Seeded {len(bookings_data)} bookings")
    
    async def seed_reviews(self, session):
        """Seed sample reviews."""
        logger.info("Seeding reviews...")
        
        customer = self.users["customer@example.com"]
        jane = self.users["jane.smith@example.com"]
        service = self.services["Bath Fittings Installation & Repair"]
        
        reviews_data = [
            {
                "service_id": service.id,
                "user_id": customer.id,
                "rating": 5,
                "title": "Excellent Service!",
                "comment": "The technician was very professional and completed the work efficiently. The shower head is working perfectly now. Highly recommended!",
                "is_verified": True,
                "is_approved": True,
                "helpful_count": 12,
                "not_helpful_count": 1,
            },
            {
                "service_id": service.id,
                "user_id": jane.id,
                "rating": 4,
                "title": "Good work, timely service",
                "comment": "Satisfied with the service quality. The plumber arrived on time and fixed the tap issue quickly. Could have been cleaner in work area.",
                "is_verified": True,
                "is_approved": True,
                "helpful_count": 8,
                "not_helpful_count": 0,
            },
        ]
        
        for review_data in reviews_data:
            review = Review(**review_data)
            session.add(review)
        
        logger.info(f"Seeded {len(reviews_data)} reviews")


async def main():
    """Main seeder function."""
    seeder = DataSeeder()
    await seeder.seed_all()


if __name__ == "__main__":
    asyncio.run(main())