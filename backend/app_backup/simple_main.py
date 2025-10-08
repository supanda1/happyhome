"""
Ultra-simple FastAPI app for Railway testing.
Use this to verify Railway can deploy basic FastAPI.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create minimal FastAPI app
app = FastAPI(
    title="Happy Homes API Test",
    version="1.0.0",
    description="Minimal test app for Railway deployment"
)

# Basic CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://happyhome-zeta.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Happy Homes API is running!",
        "status": "success",
        "port": os.getenv("PORT", "unknown"),
        "environment": "railway-test"
    }

@app.get("/health")
def health():
    """Health check."""
    return {"alive": True, "status": "ok"}

@app.get("/ping")
def ping():
    """Ping endpoint."""
    return {"message": "pong"}

@app.get("/test")
def test():
    """Test endpoint."""
    return {"test": "working", "railway": "success"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)