# pipeline/merge_dataset.py

import pandas as pd

FUEL_PATH = "data/processed/fuel_price_indonesia_clean.csv"
EXOG_PATH = "data/processed/exog_history.csv"
OUT_PATH = "data/processed/merged_dataset.csv"


def merge_monthly_dataset():
    print("\n=========== MERGE DATASET (Fuel + Exogs) ===========")

    # Load fuel dataset
    print("[INFO] Loading fuel price dataset…")
    fuel = pd.read_csv(FUEL_PATH)

    # Ensure 'date'
    if "date" not in fuel.columns:
        print("[FIX] Fuel missing 'date'. Rebuilding from 'month'…")
        if "month" in fuel.columns:
            fuel["date"] = fuel["month"].astype(str) + "-01"
        else:
            raise ValueError("Fuel dataset must contain either 'date' or 'month'.")

    # Ensure 'month'
    if "month" not in fuel.columns:
        fuel["month"] = fuel["date"].str[:7]

    # Load EXOG dataset
    print("[INFO] Loading EXOG history…")
    exog = pd.read_csv(EXOG_PATH)

    if "month" not in exog.columns:
        raise ValueError("EXOG history missing 'month'")

    exog["month"] = exog["month"].astype(str)

    # Merge
    print("[INFO] Merging on 'month'…")
    merged = pd.merge(fuel, exog, on="month", how="inner")

    # ---------------------------------------------------
    # CLEAN EXCESS DATE COLUMNS
    # ---------------------------------------------------
    # Keep only the newest "date" column
    date_cols = [c for c in merged.columns if c.startswith("date")]

    if len(date_cols) > 1:
        print(f"[FIX] Removing redundant date columns: {date_cols}")

        # Keep the main one called "date"
        if "date" not in merged.columns:
            # If not exist, create one from exog
            merged["date"] = merged["month"].astype(str) + "-01"

        # Drop date_x and date_y
        for dc in date_cols:
            if dc != "date":
                merged = merged.drop(columns=[dc], errors="ignore")

    # Ensure date column is datetime
    merged["date"] = pd.to_datetime(merged["date"])

    # Sort
    merged = merged.sort_values("date").reset_index(drop=True)

    # Save
    merged.to_csv(OUT_PATH, index=False)
    print(f"[OK] Merged dataset created → {OUT_PATH}")
    print(f"[INFO] Final columns: {merged.columns.tolist()}")
    print(f"[INFO] Total rows: {len(merged)}")

    return merged


if __name__ == "__main__":
    merge_monthly_dataset()