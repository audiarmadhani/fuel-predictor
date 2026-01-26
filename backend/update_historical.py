import pandas as pd
import os
from isibens_html_to_csv import isibens_html_to_csv

RAW_DIR = "data/isibens"
HIST_PATH = "data/processed/fuel_price_indonesia_clean.csv"

COLUMN_MAP = {
    "90": {"pertamina": "pertamina_90", "vivo": "vivo_90"},
    "92": {"pertamina": "pertamina_92", "vivo": "vivo_92", "bp": "bp_92", "shell": "shell_92"},
    "95": {"pertamina": "pertamina_95", "vivo": "vivo_95", "bp": "bp_95", "shell": "shell_95"},
    "98": {"pertamina": "pertamina_98", "shell": "shell_98"},
}

def clean_val(v):
    """Convert invalid numbers (0, NaN, '-', empty) to None."""
    if pd.isna(v):
        return None
    s = str(v).strip()
    if s == "" or s == "-" or s == "0":
        return None
    try:
        num = float(s)
        if num == 0:
            return None
        return num
    except:
        return None


def extract_date_from_filename(path):
    fname = os.path.basename(path)
    print(f"[DEBUG] Extracting date from filename: {fname}")

    digits = "".join(c for c in fname if c.isdigit())
    print(f"[DEBUG] Digits detected: {digits}")

    if len(digits) < 8:
        raise ValueError(f"[ERROR] Cannot parse date from filename: {fname}")

    date = f"{digits[:4]}-{digits[4:6]}-{digits[6:8]}"
    print(f"[DEBUG] Extracted Date = {date}")
    return date


def update_historical(raw_html_path):
    print("\n================= UPDATE START =================")

    clean_csv_path = os.path.join(RAW_DIR, "isibens_clean.csv")

    # STEP 1 — PARSE DATE
    date = extract_date_from_filename(raw_html_path)
    month = date[:7]
    print(f"[INFO] Parsed date: {date} → month: {month}")

    # STEP 2 — CONVERT HTML-WRAPPED CSV → CLEAN CSV
    print("[INFO] Converting HTML wrapper → clean CSV…")
    isibens_html_to_csv(raw_html_path, clean_csv_path)

    # STEP 3 — LOAD CLEAN CSV
    print("[INFO] Loading cleaned CSV…")
    df_clean = pd.read_csv(clean_csv_path)
    print("\n[DEBUG] Clean CSV Loaded:")
    print(df_clean)

    # STEP 4 — LOAD HISTORICAL
    print("\n[INFO] Loading historical dataset…")
    df_hist = pd.read_csv(HIST_PATH)
    print(f"[DEBUG] Historical rows before update: {len(df_hist)}")

    df_hist["month"] = df_hist["date"].str[:7]
    print(f"[DEBUG] Existing months in historical:")
    print(sorted(df_hist['month'].unique()))

    # STEP 5 — CHECK IF MONTH ALREADY EXISTS
    if month in df_hist["month"].values:
        print(f"\n[SKIP] Month {month} already exists — NOT updating.\n")
        print("================== UPDATE END ==================\n")
        return False

    print(f"\n[INFO] Month {month} not found — APPENDING new row.")

    # STEP 6 — BUILD NEW ROW
    new_row = {col: None for col in df_hist.columns if col != "month"}
    new_row["date"] = date

    for _, r in df_clean.iterrows():
        ron = str(int(float(r["ron"])))
        print(f"[DEBUG] Row for RON {ron}")

        if ron not in COLUMN_MAP:
            print(f"[WARN] Unsupported RON {ron}")
            continue

        for provider_src, col_hist in COLUMN_MAP[ron].items():
            value = clean_val(r.get(provider_src))
            print(f"   • {provider_src} → {col_hist} = {value}")
            new_row[col_hist] = value

    print("\n[INFO] Final row to append:")
    print(new_row)

    # STEP 7 — APPEND ROW
    df_hist = df_hist.drop(columns=["month"])
    df_hist.loc[len(df_hist)] = new_row
    df_hist.to_csv(HIST_PATH, index=False)

    print("\n[OK] Historical dataset updated successfully.")
    print(f"[DEBUG] Historical rows after update: {len(df_hist)}")
    print("================== UPDATE END ==================\n")

    return True


if __name__ == "__main__":
    # Find RAW HTML-wrapped CSVs with a date inside filename
    files = [
        f for f in os.listdir(RAW_DIR)
        if f.startswith("isibens_") and f.endswith(".csv") and f != "isibens_clean.csv"
    ]

    if not files:
        print("[ERROR] No RAW isibens_*.csv file found in data/isibens/")
    else:
        latest = sorted(files)[-1]
        path = os.path.join(RAW_DIR, latest)
        print(f"[INFO] Running update_historical on RAW file: {path}")
        update_historical(path)