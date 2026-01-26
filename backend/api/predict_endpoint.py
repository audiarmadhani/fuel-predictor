from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import json

from pipeline.predict import prepare_input_row, predict_single_model

router = APIRouter()

MODEL_DIR = "backend/models"


class PredictRequest(BaseModel):
    exog: dict  # brent, rbob, usd_idr, RON92, etc.


@router.post("/")
def manual_predict(payload: PredictRequest):
    try:
        # Convert to DataFrame
        df = pd.DataFrame([payload.exog])

        # Build final feature vector
        prepared = prepare_input_row(df)

        # Load all models dynamically
        results = {}

        for fuel in os.listdir(MODEL_DIR):
            folder = os.path.join(MODEL_DIR, fuel)

            if not os.path.isdir(folder):
                continue

            # load model
            model_path = None
            features_path = None

            for f in os.listdir(folder):
                if f.endswith(".pkl"):
                    model_path = os.path.join(folder, f)
                if f == "features.json":
                    features_path = os.path.join(folder, f)

            if not model_path or not features_path:
                continue

            model = joblib.load(model_path)
            features = json.load(open(features_path))

            # select only required columns
            X = prepared[features]

            # predict
            pred_value = float(model.predict(X)[0])
            results[fuel] = pred_value

        return {"predictions": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))