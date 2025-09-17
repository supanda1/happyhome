#!/usr/bin/env python3
"""
Minimal test server to verify backend setup
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="Happy Homes Test API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Happy Homes Test API is running!", "status": "success"}

@app.get("/ping")
async def ping():
    return {"message": "pong"}

@app.post("/api/v1/auth/login")
async def test_login(credentials: dict):
    # Simple test login - just return success
    email = credentials.get("email")
    password = credentials.get("password")
    
    if email == "panda.sunil@gmail.com" and password == "Lipu@1934":
        return {
            "data": {
                "user": {
                    "id": "test-user-id",
                    "email": email,
                    "firstName": "Sunil",
                    "lastName": "Panda", 
                    "role": "customer"
                },
                "accessToken": "test-access-token",
                "refreshToken": "test-refresh-token"
            }
        }
    else:
        return {"error": "Invalid credentials"}, 401

@app.post("/api/v1/auth/register") 
async def test_register(userData: dict):
    # Simple test register - just return success
    return {
        "data": {
            "user": {
                "id": "test-user-id-new",
                "email": userData.get("email"),
                "firstName": userData.get("firstName"),
                "lastName": userData.get("lastName"),
                "role": "customer"
            },
            "accessToken": "test-access-token", 
            "refreshToken": "test-refresh-token"
        }
    }

@app.get("/api/v1/users/profile")
async def get_profile():
    return {
        "data": {
            "id": "test-user-id",
            "email": "panda.sunil@gmail.com",
            "firstName": "Sunil", 
            "lastName": "Panda",
            "role": "customer"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)