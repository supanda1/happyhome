"""
Absolutely minimal FastAPI app for Railway.
No complex imports, no database, nothing that can fail.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

print("🚀 MINIMAL FASTAPI STARTING")
print(f"PORT: {os.getenv('PORT', 'NOT SET')}")
print("This is the SIMPLE app with NO complex dependencies")

app = FastAPI(title="Happy Homes Simple API")

# CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://happyhome-zeta.vercel.app",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "✅ SIMPLE Happy Homes API Working!",
        "status": "success",
        "app": "minimal_version",
        "port": os.getenv("PORT", "unknown")
    }

@app.get("/health")
def health():
    return {"alive": True, "simple": True}

@app.get("/ping") 
def ping():
    return {"message": "pong", "simple": True}

@app.get("/api/services")
def services():
    return {
        "services": [
            {"id": 1, "name": "Plumbing", "price": "$50"},
            {"id": 2, "name": "Electrical", "price": "$60"},
            {"id": 3, "name": "Cleaning", "price": "$40"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🌟 Starting on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)