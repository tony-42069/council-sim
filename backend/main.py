import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from config import get_settings

load_dotenv()

app = FastAPI(
    title="Council Simulator",
    description="AI-powered city council meeting simulator for data center proposal debates",
    version="0.1.0",
)

settings = get_settings()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        settings.frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "project": "Council Simulator",
        "environment": settings.environment,
    }
