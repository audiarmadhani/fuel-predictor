import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()  # ensures local .env works

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_supabase() -> Client:
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL environment variable is missing")

    if not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is missing")

    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def write_prediction_to_supabase(month: str, predictions: dict):

    supabase = get_supabase()

    record = {
        "month": month,
        "model": {k: v["price"] for k, v in predictions.items()},
        "confidence": {k: v["confidence_pct"] for k, v in predictions.items()},
    }

    res = supabase.table("predictions").insert(record).execute()
    print("[OK] Supabase insert response:", res)