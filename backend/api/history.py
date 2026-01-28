import os
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter()

MERGED_CANDIDATES = [
    "data/processed/merged_dataset.csv",
    "data/processed/merged_data_clean.csv",
]

@router.get("/history")
def get_history():
    """Returns merged dataset as JSON."""
    try:
        path = None
        for p in MERGED_CANDIDATES:
            if os.path.exists(p):
                path = p
                break

        if not path:
            raise FileNotFoundError("No merged dataset found in data/processed")

        df = pd.read_csv(path)

        if "month" in df.columns:
            df["month"] = df["month"].astype(str)

        return {"status": "ok", "rows": df.to_dict(orient="records")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))