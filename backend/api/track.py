from fastapi import APIRouter, Request
from supabase import create_client
from dotenv import load_dotenv
import hashlib
import os
import time

load_dotenv()

router = APIRouter()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def hash_ip(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()

@router.post("/track")
async def track_visit(request: Request):
    ip = request.client.host or "unknown"
    ip_h = hash_ip(ip)

    user_agent = request.headers.get("user-agent", "unknown")

    # Get fingerprint from frontend if sent
    body = await request.json() if request.method == "POST" else {}
    fp = body.get("fp", None)

    # Check if this visitor already exists
    existing = supabase.table("visits").select("*") \
        .eq("ip_hash", ip_h).maybe_single().execute()

    row = existing.data if existing.data else None

    if row:
        # Update visit counter
        supabase.table("visits").update({
            "visits": row["visits"] + 1,
            "last_seen": "NOW()"
        }).eq("id", row["id"]).execute()
    else:
        # Insert new visitor
        supabase.table("visits").insert({
            "ip_hash": ip_h,
            "fp": fp,
            "user_agent": user_agent,
            "visits": 1
        }).execute()

    return {"status": "ok"}