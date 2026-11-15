"""Vercel ASGI adapter; mount the same application beneath /api."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fastapi import FastAPI
from backend.app import app as backend
app=FastAPI()
app.mount('/api',backend)
