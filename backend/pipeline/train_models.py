# pipeline/train_models.py

import pandas as pd
import numpy as np
import os
import json
import joblib

from sklearn.model_selection import TimeSeriesSplit
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor


MERGED_PATH = "data/processed/merged_dataset.csv"
MODEL_DIR = "models"

TARGET_COLS = [
    "pertamina_90","pertamina_92","pertamina_95","pertamina_98",
    "shell_92","shell_95","shell_98",
    "bp_92","bp_95",
    "vivo_90","vivo_92","vivo_95",
]


def build_models():
    return {
        "rf": RandomForestRegressor(
            n_estimators=500, max_depth=12, random_state=42
        ),
        "extratrees": ExtraTreesRegressor(
            n_estimators=600, max_depth=12, random_state=42
        ),
        "xgboost": XGBRegressor(
            n_estimators=500,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            tree_method="hist",
            eval_metric="mae",
        ),
    }


def select_feature_columns(df, target_col):

    forbidden = TARGET_COLS

    feature_cols = [
        c for c in df.columns
        if c not in forbidden and c not in ["date", "month"]
    ]
    return feature_cols


def train_single_target(df, target_col):

    print("\n==============================")
    print(f"[INFO] Training model for {target_col}")
    print("==============================")

    feature_cols = select_feature_columns(df, target_col)
    df_train = df.dropna(subset=[target_col]).copy()

    X = df_train[feature_cols]
    y = df_train[target_col]

    if len(df_train) < 18:
        print(f"[WARN] Not enough data for {target_col}")
        return None, None, None

    tscv = TimeSeriesSplit(n_splits=3)

    best_model = None
    best_name = None
    best_mae = 1e18

    models = build_models()

    for name, model in models.items():
        maes = []

        for tr_idx, val_idx in tscv.split(X):
            Xtr, Xv = X.iloc[tr_idx], X.iloc[val_idx]
            ytr, yv = y.iloc[tr_idx], y.iloc[val_idx]

            model.fit(Xtr, ytr)
            preds = model.predict(Xv)
            mae = mean_absolute_error(yv, preds)
            maes.append(mae)

        avg_mae = float(np.mean(maes))
        print(f"[RESULT] {target_col} | {name}: MAE={avg_mae:.2f}")

        if avg_mae < best_mae:
            best_mae = avg_mae
            best_model = model
            best_name = name

    if best_model is not None:
        outdir = os.path.join(MODEL_DIR, target_col)
        os.makedirs(outdir, exist_ok=True)

        joblib.dump(best_model, os.path.join(outdir, "model.pkl"))

        meta = {
            "model_name": best_name,
            "mae": best_mae,
            "features": feature_cols,
        }

        with open(os.path.join(outdir, "meta.json"), "w") as f:
            json.dump(meta, f, indent=2)

        print(f"[OK] Saved model + meta → {outdir}")

    return best_model, best_name, best_mae


def train_all_models():
    print("\n=========== TRAINING MODELS ==========")

    df = pd.read_csv(MERGED_PATH)
    print(f"[INFO] Loaded merged dataset with {len(df)} rows")

    results = {}

    for col in TARGET_COLS:
        model, name, score = train_single_target(df, col)
        results[col] = {"model": name, "mae": score}

    print("\n[OK] All models trained.")
    return results


if __name__ == "__main__":
    train_all_models()