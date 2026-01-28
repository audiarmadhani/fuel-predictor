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
            os.path.join(base, "merged_data_clean.csv"),
        ]

        path = next((p for p in paths if os.path.exists(p)), None)
        if not path:
            raise FileNotFoundError("No dataset found")

        df = pd.read_csv(path)

        # convert "month" to string
        if "month" in df.columns:
            df["month"] = df["month"].astype(str)

        # 🔥 CRITICAL FIX: force pandas to treat all numbers as Python objects
        df = df.astype(object)

        # Replace all nan/inf values
        df = df.where(pd.notnull(df), None)
        df = df.replace([float("inf"), float("-inf")], None)

        # Now convert to pure Python objects
        data = df.to_dict(orient="records")

        return {"status": "ok", "rows": data}

    except Exception as e:
        print("HISTORY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))