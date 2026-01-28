import pandas as pd
from fastapi import APIRouter

router = APIRouter()

@router.get("/history")
def get_history():
    """
    Returns merged_dataset.csv as JSON.
    Used by frontend to draw charts.
    """
    try:
        df = pd.read_csv("data/processed/merged_data_clean.csv")

        # Convert month to string (YYYY-MM)
        if "month" in df.columns:
            df["month"] = df["month"].astype(str)

        return {
            "status": "ok",
            "rows": df.to_dict(orient="records")
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}