from fastapi import APIRouter, Request
from supabase import create_client
import hashlib
from dotenv import load_dotenv

load_dotenv()  # ensures local .env works

import os

router = APIRouter()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

@router.post("/track")
async def track_visit(request: Request):
    ip = request.client.host or "unknown"
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()

    supabase.table("visits").insert({"ip_hash": ip_hash}).execute()

    return {"status": "ok"}