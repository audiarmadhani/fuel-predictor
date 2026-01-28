import os
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/history")
def get_history():
    try:
        # Absolute directory for data/processed (inside backend)
        base = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "data", "processed")
        )

        print("LOOKING IN:", base)
        print("FILES:", os.listdir(base))

        paths = [
            os.path.join(base, "merged_dataset.csv"),
        ]

        path = next((p for p in paths if os.path.exists(p)), None)

        if not path:
            raise FileNotFoundError(f"NO merged dataset found in: {paths}")

        print("USING:", path)

        df = pd.read_csv(path)
        if "month" in df.columns:
            df["month"] = df["month"].astype(str)

        return {"status": "ok", "rows": df.to_dict(orient="records")}

    except Exception as e:
        print("HISTORY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))