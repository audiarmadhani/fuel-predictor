import pandas as pd
import yfinance as yf
import os

EXOG_PATH = "data/processed/exog_history.csv"
START_DATE = "2022-01-01"


# ----------------------------------------------------------
# Fetch full historical daily data
# ----------------------------------------------------------
def fetch_full_daily():
    print("\n[INFO] Fetching full historical EXOG daily data (Jan 2022 → today)…")

    brent = yf.Ticker("BZ=F").history(start=START_DATE)[["Close"]].rename(columns={"Close": "brent"})
    rbob = yf.Ticker("RB=F").history(start=START_DATE)[["Close"]].rename(columns={"Close": "rbob"})
    usd_idr = yf.Ticker("USDIDR=X").history(start=START_DATE)[["Close"]].rename(columns={"Close": "usd_idr"})

    df = brent.join(rbob, how="outer").join(usd_idr, how="outer")
    df = df.dropna(how="all")

    print(f"[OK] Daily rows fetched: {len(df)}")
    return df


# ---------------------------------------------------------- 
# Convert daily → monthly (use last day of month)
# Then convert index to YYYY-MM-01
# ----------------------------------------------------------
def convert_to_monthly(df):

    print("[INFO] Resampling daily → monthly…")

    monthly = df.resample("ME").last()
    monthly.index = monthly.index.to_period("M").to_timestamp()

    # convert to YYYY-MM-01
    monthly.index = pd.to_datetime(monthly.index.strftime("%Y-%m-01"))

    monthly = monthly.sort_index()
    print(f"[OK] Monthly rows: {len(monthly)}")

    return monthly


# ----------------------------------------------------------
# Enrich with RON buckets + RBOB/L
# ----------------------------------------------------------
def enrich_exogs(monthly):

    print("[INFO] Enriching EXOG data…")

    m = monthly.copy()

    m["rbob_liter"] = m["rbob"] / 3.78541
    m["base_mops"] = m["rbob"]

    m["RON92"] = m["rbob_liter"]
    m["RON95"] = m["rbob_liter"] + 0.06
    m["RON98"] = m["rbob_liter"] + 0.12
    m["RON90"] = m["rbob_liter"] - 0.04

    m["month"] = m.index.strftime("%Y-%m")
    m["date"] = m.index.strftime("%Y-%m-01")

    return m


# ----------------------------------------------------------
# Update exog_history.csv
# ----------------------------------------------------------
def update_exog_history():

    print("\n=============== UPDATE EXOG HISTORY ===============")

    df_daily = fetch_full_daily()
    df_monthly = convert_to_monthly(df_daily)
    df_enriched = enrich_exogs(df_monthly)

    if os.path.exists(EXOG_PATH):
        print("[INFO] Loading existing exog_history.csv…")
        old = pd.read_csv(EXOG_PATH)

        merged = pd.concat([old, df_enriched], ignore_index=True)

        merged = merged.drop_duplicates(subset=["month"])
        merged = merged.sort_values("month")
    else:
        print("[INFO] Creating new exog_history.csv…")
        merged = df_enriched.copy()

    merged.to_csv(EXOG_PATH, index=False)

    print(f"[OK] exog_history.csv updated → {EXOG_PATH}")
    print(f"[INFO] Total months stored: {len(merged)}")

    return merged


if __name__ == "__main__":
    update_exog_history()