from fastapi import APIRouter, HTTPException
from supabase import create_client
import os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # secure
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


@router.get("/")
def get_latest_prediction():
    try:
        response = (
            supabase.table("predictions")
            .select("*")
            .order("id", desc=True)
            .limit(1)
            .execute()
        )

        if not response.data:
            return {"error": "No predictions found"}

        row = response.data[0]

        return {
            "month": row["month"],
            "created_at": row["created_at"],
            "predictions": row["model"],
            "confidence": row["confidence"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))