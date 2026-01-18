from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.test_session import router

app = FastAPI(
    title="IELTS Test API - Enhanced",
    description="Enhanced API for IELTS Test with Gemini AI",
    version="2.0.0",
)

# CORS middleware
# Get allowed origins from environment or use defaults
import os

# Check if we should allow all origins (for development/deployment)
allow_all_origins = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"

if allow_all_origins:
    # For Railway/deployment: allow all origins
    # Note: When using allow_origins=["*"], allow_credentials must be False
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    # Get specific origins from environment
    cors_origins = (
        os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []
    )
    # Add default localhost origins
    default_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    # Combine and filter empty strings
    allowed_origins = [
        origin.strip() for origin in cors_origins + default_origins if origin.strip()
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

# Include routers
app.include_router(router, prefix="/api", tags=["test-session"])


@app.get("/")
def read_root():
    return {"message": "IELTS Test API - Enhanced Version", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}
