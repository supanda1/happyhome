"""
Ultra-minimal main.py - single file, no imports from our app
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

print("=== Starting Happy Homes API ===")
print(f"PORT environment variable: {os.getenv('PORT', 'NOT SET')}")

app = FastAPI(title="Happy Homes API")

# Add CORS for your Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://happyhome-zeta.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Happy Homes API is running!", "status": "success"}

@app.get("/health")
def health_check():
    return {"alive": True}

@app.get("/ping")
def ping():
    return {"message": "pong"}

@app.get("/api/services")
def get_services():
    # Mock data for frontend
    return {
        "services": [
            {"id": 1, "name": "Plumbing", "description": "Professional plumbing services"},
            {"id": 2, "name": "Electrical", "description": "Electrical repair and installation"},
            {"id": 3, "name": "Cleaning", "description": "Home cleaning services"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    # Railway requires reading PORT from environment
    port = int(os.getenv("PORT", 8000))
    print(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")