import os
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/history")
def get_history():
    try:
        base = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "data", "processed")
        )

        paths = [
            os.path.join(base, "merged_dataset.csv"),
            # os.path.join(base, "merged_data_clean.csv"),
        ]

        path = next((p for p in paths if os.path.exists(p)), None)
        if not path:
            raise FileNotFoundError(f"Dataset missing: {paths}")

        df = pd.read_csv(path)

        # Convert month to string
        if "month" in df.columns:
            df["month"] = df["month"].astype(str)

        # 🚀 FIX: Replace NaN, inf, -inf with None (JSON safe)
        df = df.replace([float("inf"), float("-inf")], None)
        df = df.where(pd.notnull(df), None)

        return {
            "status": "ok",
            "rows": df.to_dict(orient="records")
        }

    except Exception as e:
        print("[HISTORY ERROR]", e)
        raise HTTPException(status_code=500, detail=str(e))