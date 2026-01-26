import os
import re
import pandas as pd
from bs4 import BeautifulSoup


def extract_number(cell_text: str):
    """
    Extract numeric price from messy strings such as:

    - "12.350Pertamax"
    - "13.190BP ultimate"
    - "13.480V-Power Nitro+"
    - "-"
    - "0Revvo92"
    - "Price: 12.500 IDR"

    Returns integer price in IDR or None.
    """

    if not isinstance(cell_text, str):
        return None

    text = cell_text.strip()
    if text == "" or text == "-" or text.lower() == "na":
        return None

    # Find ANY numeric pattern (first occurrence)
    match = re.search(r"([0-9]+[.,]?[0-9]*)", text)
    if not match:
        return None

    num = match.group(1)

    # Remove separators (12.350 → 12350)
    num = num.replace(".", "").replace(",", "")

    return int(num) if num.isdigit() else None


def isibens_html_to_csv(html_path: str, output_csv: str):
    print(f"[INFO] Loading HTML file: {html_path}")

    if not os.path.exists(html_path):
        raise FileNotFoundError(f"HTML file not found: {html_path}")

    with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()

    print("\n==============================")
    print("STEP 1 — File Loaded Successfully")
    print("==============================")

    soup = BeautifulSoup(html, "html.parser")

    tables = soup.find_all("table")
    print(f"[INFO] Found {len(tables)} tables")

    if len(tables) < 1:
        raise ValueError("No tables found in the HTML file.")

    tbl = tables[0]

    print("\n==============================")
    print("STEP 2 — Extracting Rows")
    print("==============================")

    rows = tbl.find_all("tr")
    print(f"[INFO] Total rows including header: {len(rows)}")

    data_rows = []
    for i, row in enumerate(rows):
        cells = row.find_all(["td", "th"])
        values = [c.get_text(strip=True) for c in cells]
        print(f"\nROW {i}: {values}")
        data_rows.append(values)

    print("\n==============================")
    print("STEP 3 — Parsing Table Structure")
    print("==============================")

    header = data_rows[0]
    print(f"[HEADER RAW]: {header}")

    # Always enforce 5 correct headers
    columns = ["ron", "pertamina", "vivo", "bp", "shell"]
    print(f"[HEADER CLEANED]: {columns}")

    # Body rows
    body = data_rows[1:]

    # Normalize row width (pad or cut)
    fixed_body = []
    for row in body:
        row = (row + [""] * 5)[:5]
        fixed_body.append(row)

    df = pd.DataFrame(fixed_body, columns=columns)

    print("\n==============================")
    print("STEP 4 — RAW DATAFRAME BEFORE CLEANING")
    print(df)
    print("==============================\n")

    # Apply extractor to price columns
    for col in ["pertamina", "vivo", "bp", "shell"]:
        df[col] = df[col].apply(extract_number)

    # Convert RON column
    df["ron"] = df["ron"].apply(lambda x: int(x) if str(x).isdigit() else None)

    print("==============================")
    print("STEP 5 — CLEANED DATAFRAME")
    print(df)
    print("==============================\n")

    out_dir = os.path.dirname(output_csv)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir)

    df.to_csv(output_csv, index=False)
    print(f"[OK] Clean CSV saved → {output_csv}")

    return df


if __name__ == "__main__":
    isibens_html_to_csv(
        html_path="data/isibens/isibens_20260126.csv",
        output_csv="data/isibens/isibens_clean.csv"
    )