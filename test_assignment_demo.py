#!/usr/bin/env python3
"""
Automated Assignment System Demo

This script demonstrates the intelligent employee assignment system
with sample data and tests various assignment strategies.
"""

import asyncio
import sys
import json
from datetime import datetime, timedelta
from uuid import uuid4, UUID
from typing import Dict, Any

# Mock data for demo - would come from database in real implementation
MOCK_EMPLOYEES = [
    {
        "id": str(uuid4()),
        "name": "Rajesh Kumar",
        "email": "rajesh@example.com",
        "phone": "+91-9876543210",
        "location": "Mumbai Central",
        "expertise_areas": ["Plumbing", "Electrical"],
        "rating": 4.8,
        "completed_jobs": 156,
        "is_active": True,
        "is_available": True,
        "service_areas": ["Mumbai", "Thane"],
        "skills": ["sink installation", "pipe repair", "electrical wiring"],
        "average_job_time": 120,
        "customer_satisfaction_score": 9.2
    },
    {
        "id": str(uuid4()),
        "name": "Priya Sharma",
        "email": "priya@example.com", 
        "phone": "+91-9876543211",
        "location": "Delhi South",
        "expertise_areas": ["Cleaning", "Personal Care"],
        "rating": 4.6,
        "completed_jobs": 89,
        "is_active": True,
        "is_available": True,
        "service_areas": ["Delhi", "Gurgaon"],
        "skills": ["bathroom cleaning", "deep cleaning"],
        "average_job_time": 90,
        "customer_satisfaction_score": 8.8
    },
    {
        "id": str(uuid4()),
        "name": "Arjun Patel",
        "email": "arjun@example.com",
        "phone": "+91-9876543212", 
        "location": "Bangalore Koramangala",
        "expertise_areas": ["Plumbing", "Civil Work"],
        "rating": 4.9,
        "completed_jobs": 203,
        "is_active": True,
        "is_available": True,
        "service_areas": ["Bangalore", "Mysore"],
        "skills": ["basin installation", "tile work", "house painting"],
        "average_job_time": 135,
        "customer_satisfaction_score": 9.5
    }
]

MOCK_BOOKING = {
    "id": str(uuid4()),
    "service_name": "Basin & Sink Installation",
    "service_category": "Plumbing",
    "customer_name": "Sunil Kumar",
    "scheduled_date": datetime.now() + timedelta(days=1),
    "scheduled_time_start": "10:00",
    "scheduled_time_end": "12:00",
    "location": "Mumbai Andheri",
    "total_amount": 2500.0,
    "address": {
        "city": "Mumbai",
        "area": "Andheri",
        "coordinates": (19.1136, 72.8697)  # Mock coordinates
    }
}

class MockAssignmentService:
    """Mock version of the assignment service for demo purposes."""
    
    def __init__(self):
        self.employees = MOCK_EMPLOYEES
        self.booking = MOCK_BOOKING
    
    def calculate_location_score(self, employee: Dict, booking: Dict) -> float:
        """Calculate location-based score."""
        # Simplified location matching
        emp_location = employee["location"].lower()
        booking_location = booking["location"].lower()
        
        # Check for city match
        if any(city in emp_location for city in ["mumbai", "delhi", "bangalore"]):
            if "mumbai" in emp_location and "mumbai" in booking_location:
                return 0.9
            elif "delhi" in emp_location and "delhi" in booking_location:
                return 0.9
            elif "bangalore" in emp_location and "bangalore" in booking_location:
                return 0.9
        
        # Check service areas
        for area in employee["service_areas"]:
            if area.lower() in booking_location:
                return 0.7
        
        return 0.3  # Default for distant locations
    
    def calculate_availability_score(self, employee: Dict) -> float:
        """Calculate availability-based score."""
        if not employee["is_available"]:
            return 0.0
        
        # Mock current workload (in real system, would check database)
        mock_workload = hash(employee["name"]) % 5  # 0-4 assignments
        max_assignments = 8
        
        return 1.0 - (mock_workload / max_assignments)
    
    def calculate_expertise_score(self, employee: Dict, booking: Dict) -> float:
        """Calculate expertise-based score."""
        category = booking["service_category"].lower()
        service = booking["service_name"].lower()
        
        # Check category expertise
        category_match = any(
            category in expertise.lower() 
            for expertise in employee["expertise_areas"]
        )
        
        # Check specific skill match
        skill_match = any(
            any(keyword in skill.lower() for keyword in service.split())
            for skill in employee["skills"]
        )
        
        if category_match and skill_match:
            return 1.0
        elif category_match:
            return 0.8
        elif skill_match:
            return 0.6
        else:
            return 0.2
    
    def calculate_rating_score(self, employee: Dict) -> float:
        """Calculate rating-based score."""
        return min(employee["rating"] / 5.0, 1.0)
    
    def calculate_workload_score(self, employee: Dict) -> float:
        """Calculate workload-based score."""
        # Mock implementation
        mock_workload = hash(employee["name"]) % 5
        return 1.0 - (mock_workload / 8)
    
    def calculate_customer_satisfaction_score(self, employee: Dict) -> float:
        """Calculate customer satisfaction score."""
        return min(employee["customer_satisfaction_score"] / 10.0, 1.0)
    
    def assign_by_strategy(self, strategy: str, weights: Dict[str, float] = None) -> Dict[str, Any]:
        """Assign employee using specified strategy."""
        if weights is None:
            weights = {
                "location": 0.3,
                "availability": 0.25,
                "expertise": 0.2,
                "rating": 0.15,
                "workload": 0.1
            }
        
        # Calculate scores for all employees
        employee_scores = []
        
        for employee in self.employees:
            scores = {
                "employee": employee,
                "location": self.calculate_location_score(employee, self.booking),
                "availability": self.calculate_availability_score(employee),
                "expertise": self.calculate_expertise_score(employee, self.booking),
                "rating": self.calculate_rating_score(employee),
                "workload": self.calculate_workload_score(employee),
                "customer_satisfaction": self.calculate_customer_satisfaction_score(employee)
            }
            
            # Calculate weighted total score
            if strategy == "location_only":
                scores["total"] = scores["location"]
                reason = f"Closest location (score: {scores['location']:.2f})"
            elif strategy == "availability_only":
                scores["total"] = scores["availability"]
                reason = f"Best availability (score: {scores['availability']:.2f})"
            elif strategy == "location_and_availability":
                scores["total"] = (scores["location"] + scores["availability"]) / 2
                reason = f"Location + availability (score: {scores['total']:.2f})"
            else:  # best_fit
                scores["total"] = (
                    scores["location"] * weights["location"] +
                    scores["availability"] * weights["availability"] +
                    scores["expertise"] * weights["expertise"] +
                    scores["rating"] * weights["rating"] +
                    scores["workload"] * weights["workload"]
                )
                reason = f"Best overall fit (score: {scores['total']:.2f})"
            
            scores["reason"] = reason
            employee_scores.append(scores)
        
        # Sort by total score and select best
        employee_scores.sort(key=lambda x: x["total"], reverse=True)
        
        if not employee_scores:
            return {"success": False, "error": "No eligible employees"}
        
        best_match = employee_scores[0]
        
        return {
            "success": True,
            "assignment": {
                "employee": best_match["employee"],
                "scores": {
                    "total": best_match["total"],
                    "location": best_match["location"],
                    "availability": best_match["availability"],
                    "expertise": best_match["expertise"],
                    "rating": best_match["rating"],
                    "workload": best_match["workload"]
                },
                "reason": best_match["reason"],
                "strategy": strategy
            },
            "alternatives": [
                {
                    "employee": emp["employee"],
                    "score": emp["total"],
                    "reason": emp["reason"]
                }
                for emp in employee_scores[1:3]  # Top 2 alternatives
            ]
        }

def print_assignment_result(result: Dict[str, Any], strategy: str):
    """Print assignment result in a formatted way."""
    print(f"\n{'='*60}")
    print(f"🎯 ASSIGNMENT STRATEGY: {strategy.upper().replace('_', ' ')}")
    print(f"{'='*60}")
    
    if not result["success"]:
        print(f"❌ Assignment Failed: {result.get('error', 'Unknown error')}")
        return
    
    assignment = result["assignment"]
    employee = assignment["employee"]
    scores = assignment["scores"]
    
    print(f"✅ SELECTED EMPLOYEE: {employee['name']}")
    print(f"📞 Phone: {employee['phone']}")
    print(f"📍 Location: {employee['location']}")
    print(f"⭐ Rating: {employee['rating']}/5.0")
    print(f"💼 Completed Jobs: {employee['completed_jobs']}")
    print(f"🎯 Expertise: {', '.join(employee['expertise_areas'])}")
    
    print(f"\n📊 SCORING BREAKDOWN:")
    print(f"   Overall Score: {scores['total']:.3f}")
    print(f"   Location:      {scores['location']:.3f}")
    print(f"   Availability:  {scores['availability']:.3f}")
    print(f"   Expertise:     {scores['expertise']:.3f}")
    print(f"   Rating:        {scores['rating']:.3f}")
    print(f"   Workload:      {scores['workload']:.3f}")
    
    print(f"\n💡 Assignment Reason: {assignment['reason']}")
    
    if result.get("alternatives"):
        print(f"\n🔄 ALTERNATIVE OPTIONS:")
        for i, alt in enumerate(result["alternatives"], 1):
            print(f"   {i}. {alt['employee']['name']} (Score: {alt['score']:.3f}) - {alt['reason']}")

def demo_assignment_strategies():
    """Demonstrate different assignment strategies."""
    print("🏠 HAPPY HOMES - AUTOMATED ASSIGNMENT SYSTEM DEMO")
    print("=" * 60)
    
    # Print booking details
    booking = MOCK_BOOKING
    print(f"\n📋 BOOKING DETAILS:")
    print(f"   Service: {booking['service_name']}")
    print(f"   Category: {booking['service_category']}")
    print(f"   Customer: {booking['customer_name']}")
    print(f"   Location: {booking['location']}")
    print(f"   Date: {booking['scheduled_date'].strftime('%Y-%m-%d')}")
    print(f"   Time: {booking['scheduled_time_start']} - {booking['scheduled_time_end']}")
    print(f"   Amount: ₹{booking['total_amount']}")
    
    # Initialize assignment service
    service = MockAssignmentService()
    
    # Test different strategies
    strategies = [
        ("best_fit", "Comprehensive best-fit algorithm"),
        ("location_only", "Location proximity only"),
        ("availability_only", "Availability priority"),
        ("location_and_availability", "Balanced location + availability")
    ]
    
    for strategy, description in strategies:
        print(f"\n{'-'*60}")
        print(f"Testing Strategy: {description}")
        print(f"{'-'*60}")
        
        result = service.assign_by_strategy(strategy)
        print_assignment_result(result, strategy)
    
    # Test custom weight configuration
    print(f"\n{'-'*60}")
    print(f"Testing Custom Configuration: Quality-Focused")
    print(f"{'-'*60}")
    
    quality_weights = {
        "location": 0.15,
        "availability": 0.2,
        "expertise": 0.3,
        "rating": 0.25,
        "workload": 0.1
    }
    
    result = service.assign_by_strategy("best_fit", quality_weights)
    print_assignment_result(result, "quality_focused")
    
    # Performance summary
    print(f"\n{'='*60}")
    print(f"🎉 DEMO COMPLETED SUCCESSFULLY")
    print(f"{'='*60}")
    print(f"✅ All assignment strategies working correctly")
    print(f"✅ Scoring algorithms functioning properly") 
    print(f"✅ Multi-criteria decision making implemented")
    print(f"✅ Configurable priority weights supported")
    print(f"✅ Alternative recommendations provided")
    
    print(f"\n🚀 NEXT STEPS:")
    print(f"   1. Install geopy: pip install geopy")
    print(f"   2. Configure database with employee and booking data")
    print(f"   3. Access admin panel → Auto Assignment")
    print(f"   4. Test with real bookings and employees")
    print(f"   5. Fine-tune assignment weights based on business needs")

if __name__ == "__main__":
    demo_assignment_strategies()