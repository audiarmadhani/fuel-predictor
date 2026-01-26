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


# --------------------------------------------------------
# LOAD LATEST EXOG ROW
# --------------------------------------------------------
def load_latest_exogs():
    ex = pd.read_csv(EXOG_PATH)
    ex = ex.sort_values("month")
    last = ex.iloc[-1].to_dict()

    # month is needed for return value
    next_month = last["month"]

    # Exclude month from feature inputs
    cleaned = {k: last[k] for k in last if k != "month"}

    return next_month, cleaned


# --------------------------------------------------------
# MAIN PREDICT FUNCTION
# --------------------------------------------------------
def predict_next_month():

    # Load merged data (just for sanity check or future use)
    merged = pd.read_csv(MERGED_PATH).sort_values("month")

    # Load latest exog row + predicted target month
    next_month, latest_exogs = load_latest_exogs()

    # Build a dataframe for model prediction
    next_exog_df = pd.DataFrame([latest_exogs])

    predictions = {}

    for col in TARGET_COLS:

        model_dir = os.path.join(MODEL_DIR, col)
        model_path = os.path.join(model_dir, "model.pkl")
        meta_path = os.path.join(model_dir, "meta.json")

        if not os.path.exists(model_path) or not os.path.exists(meta_path):
            print(f"[WARN] Missing model for {col}, skipping...")
            continue

        # Load model + metadata
        model = joblib.load(model_path)
        meta = json.load(open(meta_path))

        mae = meta["mae"]
        feature_cols = meta["features"]

        # Build X_pred
        X_pred = next_exog_df.reindex(columns=feature_cols)
        X_pred = X_pred.ffill().bfill().fillna(0)

        yhat = float(model.predict(X_pred)[0])

        # Simple confidence
        confidence = max(0.0, 1 - (mae / max(abs(yhat), 1)))
        confidence_pct = round(confidence * 100, 2)

        predictions[col] = {
            "price": yhat,
            "confidence_pct": confidence_pct
        }

    # --------------------------------------------------------
    # PRICE FLOOR RULES:
    # vivo, bp, shell cannot go lower than Pertamina (same RON)
    # --------------------------------------------------------
    def enforce_floor(ron):
        pert = f"pertamina_{ron}"
        if pert not in predictions:
            return

        base_price = predictions[pert]["price"]

        for brand in ["vivo", "bp", "shell"]:
            key = f"{brand}_{ron}"
            if key in predictions and predictions[key]["price"] < base_price:
                predictions[key]["price"] = base_price

    enforce_floor("90")
    enforce_floor("92")
    enforce_floor("95")
    enforce_floor("98")

    # Return both month and predictions in a clean structure
    return next_month, predictions



# --------------------------------------------------------
# Manual test mode
# --------------------------------------------------------
if __name__ == "__main__":
    month, preds = predict_next_month()
    print("Next month:", month)
    print("\n===== FINAL PREDICTION OUTPUT =====")
    print(json.dumps(preds, indent=2))