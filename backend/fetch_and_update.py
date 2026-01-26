import os
import pandas as pd
import re
from datetime import datetime
from bs4 import BeautifulSoup

RAW_CLEAN_PATH = "data/isibens/isibens_clean.csv"
HIST_PATH = "data/processed/fuel_price_indonesia_clean.csv"


# --------------------------------------------------------
# Extract date from filename (YYYYMMDD)
# --------------------------------------------------------
def extract_date_from_filename(path):
    fname = os.path.basename(path)
    digits = re.findall(r"\d{8}", fname)
    if not digits:
        raise ValueError(f"Could not extract YYYYMMDD from filename: {fname}")

    d = datetime.strptime(digits[0], "%Y%m%d")
    return d.date()


# --------------------------------------------------------
# Parse ISIBENS HTML-wrapped CSV
# --------------------------------------------------------
def parse_isibens_html(html_path: str):
    """
    Fully safe parser that extracts numeric prices from ISIBENS HTML/CSV wrapper.
    This version replaces all unsafe .astype(float) logic.
    """

    import pandas as pd
    import re
    from bs4 import BeautifulSoup

    def extract_number(cell_text: str):
        if not isinstance(cell_text, str):
            return None

        text = cell_text.strip()
        if text == "" or text == "-" or text.lower() == "na":
            return None

        # Find ANY numeric segment (ex: "13.480+", "12.500BP", "Revvo95 0", etc.)
        m = re.search(r"([0-9]+[.,]?[0-9]*)", text)
        if not m:
            return None

        num = m.group(1)
        num = num.replace(".", "").replace(",", "")

        return int(num) if num.isdigit() else None

    print(f"[INFO] Loading HTML file: {html_path}")

    with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")

    if len(tables) < 1:
        raise ValueError("No tables found in the HTML file.")

    tbl = tables[0]
    rows = tbl.find_all("tr")

    data = []
    for row in rows:
        cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
        data.append(cells)

    # First row is header
    body = data[1:]

    # Normalize width to 5 columns
    fixed_body = [(r + [""] * 5)[:5] for r in body]

    df = pd.DataFrame(fixed_body, columns=["ron", "pertamina", "vivo", "bp", "shell"])

    # Safe numeric extraction
    df["ron"] = df["ron"].apply(lambda x: int(x) if str(x).isdigit() else None)

    for col in ["pertamina", "vivo", "bp", "shell"]:
        df[col] = df[col].apply(extract_number)

    return df


# --------------------------------------------------------
# Update historical monthly fuel dataset
# --------------------------------------------------------
def update_historical(raw_csv_path):
    print("\n================= UPDATE START =================")

    # Extract date from filename
    d = extract_date_from_filename(raw_csv_path)
    print(f"[DEBUG] Extracted Date = {d}")
    month_str = d.strftime("%Y-%m")
    date_str = d.strftime("%Y-%m-01")

    print(f"[INFO] Parsed date: {d} → month: {month_str}")

    # Parse HTML → DataFrame
    clean_df = parse_isibens_html(raw_csv_path)

    # Add metadata columns
    clean_df["date"] = date_str
    clean_df["month"] = month_str

    # Load existing historical file or create new
    if os.path.exists(HIST_PATH):
        print("[INFO] Loading historical dataset…")
        hist = pd.read_csv(HIST_PATH)

        # --- ONE-TIME SCHEMA FIX ---
        if "month" not in hist.columns:
            print("[FIX] Adding missing 'month' column to historical dataset…")
            hist["month"] = hist["date"].str[:7]

        existing_months = hist["month"].unique().tolist()
        print(f"[DEBUG] Existing months in historical:\n{existing_months}\n")

        # Idempotent: if month exists, do nothing
        if month_str in existing_months:
            print(f"[SKIP] Month {month_str} already exists — NOT updating.")
            print("================== UPDATE END ==================\n")
            return hist

        # Append and save
        updated = pd.concat([hist, clean_df], ignore_index=True)
        updated = updated.sort_values("date")
        updated.to_csv(HIST_PATH, index=False)
        print(f"[OK] Updated historical saved → {HIST_PATH}")
        print("================== UPDATE END ==================\n")
        return updated

    else:
        # Initialize new historical dataset
        print("[INFO] Creating new historical dataset…")
        clean_df.to_csv(HIST_PATH, index=False)
        print(f"[OK] Created → {HIST_PATH}")
        print("================== UPDATE END ==================\n")
        return clean_df


if __name__ == "__main__":
    test_path = "data/isibens/isibens_test.csv"
    update_historical(test_path)