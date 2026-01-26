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


def get_current_month_prices():
    import pandas as pd
    df = pd.read_csv("data/processed/merged_dataset.csv")
    df = df.sort_values("month")

    latest = df.iloc[-1]

    result = {}
    for col in latest.index:
        if any(prefix in col for prefix in ["pertamina", "shell", "bp", "vivo"]):
            result[col] = float(latest[col])
    return result


from pipeline.predict import predict_next_month
from pipeline.supabase_writer import get_current_month_prices

def write_prediction_to_supabase(month, predictions):

    supabase = get_supabase()

    current_prices = get_current_month_prices()

    record = {
        "month": month,
        "model": {k: v["price"] for k, v in predictions.items()},
        "confidence": {k: v["confidence_pct"] for k, v in predictions.items()},
        "current_prices": current_prices
    }

    res = supabase.table("predictions").insert(record).execute()
    print("[OK] Supabase insert response:", res)