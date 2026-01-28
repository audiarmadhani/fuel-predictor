from fastapi import APIRouter, Request
from supabase import create_client
import hashlib
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

router = APIRouter()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

@router.post("/track")
async def track_visit(request: Request):
    ip = request.client.host or "unknown"
    ua = request.headers.get("user-agent", "unknown")

    # create hash based on IP + UA + day
    today = datetime.utcnow().strftime("%Y-%m-%d")
    raw = f"{ip}-{ua}-{today}"
    fingerprint = hashlib.sha256(raw.encode()).hexdigest()

    supabase.table("visits").insert({"fp": fingerprint}).execute()

    return {"status": "ok"}