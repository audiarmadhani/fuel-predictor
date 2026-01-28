from fastapi import APIRouter, Request
from supabase import create_client
from dotenv import load_dotenv
import hashlib
import os

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

    # Try reading JSON body safely
    try:
        body = await request.json()
    except Exception:
        body = {}

    fp = body.get("fp")

    # ----- READ EXISTING VISITOR -----
    existing = supabase.table("visits") \
        .select("*") \
        .eq("ip_hash", ip_h) \
        .maybe_single() \
        .execute()

    # Safely extract data (could be None)
    row = None
    if existing and hasattr(existing, "data") and existing.data:
        row = existing.data

    # ----- UPDATE OR INSERT -----
    if row:
        # Update returning visitor
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