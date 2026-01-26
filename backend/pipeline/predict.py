# pipeline/predict.py

import pandas as pd
import joblib
import json
import os

MERGED_PATH = "data/processed/merged_dataset.csv"
EXOG_PATH = "data/processed/exog_history.csv"
MODEL_DIR = "models"

TARGET_COLS = [
    "pertamina_90","pertamina_92","pertamina_95","pertamina_98",
    "shell_92","shell_95","shell_98",
    "bp_92","bp_95",
    "vivo_90","vivo_92","vivo_95",
]


def load_latest_exogs():
    df = pd.read_csv(EXOG_PATH)
    df = df.sort_values("month")
    last = df.iloc[-1].to_dict()

    return {k: last[k] for k in last if k not in ["month"]}


def predict_next_month():

    merged = pd.read_csv(MERGED_PATH)
    merged = merged.sort_values("month")

    latest_exogs = load_latest_exogs()
    next_month = pd.DataFrame([latest_exogs])

    predictions = {}
    fuel_df = merged.copy()

    for col in TARGET_COLS:

        model_dir = os.path.join(MODEL_DIR, col)

        model_path = os.path.join(model_dir, "model.pkl")
        meta_path = os.path.join(model_dir, "meta.json")

        if not os.path.exists(model_path) or not os.path.exists(meta_path):
            print(f"[WARN] Missing model for {col}")
            continue

        model = joblib.load(model_path)
        meta = json.load(open(meta_path))

        mae = meta["mae"]
        feature_cols = meta["features"]

        X_pred = next_month[feature_cols].copy()
        X_pred = X_pred.ffill().bfill().fillna(0)

        yhat = float(model.predict(X_pred)[0])

        confidence = max(0.0, 1 - (mae / max(yhat, 1)))
        confidence_pct = round(confidence * 100, 2)

        predictions[col] = {
            "price": yhat,
            "confidence_pct": confidence_pct,
        }

    # Enforce brand hierarchy
    def enforce_rule(ron):
        p = predictions[f"pertamina_{ron}"]["price"]

        for brand in ["vivo", "bp", "shell"]:
            key = f"{brand}_{ron}"
            if key in predictions:
                if predictions[key]["price"] < p:
                    predictions[key]["price"] = p

    enforce_rule("90")
    enforce_rule("92")
    enforce_rule("95")
    enforce_rule("98")

    return predictions



if __name__ == "__main__":
    preds = predict_next_month()
    print("\n===== FINAL PREDICTION OUTPUT =====")
    print(preds)