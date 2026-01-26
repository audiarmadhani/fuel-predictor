import os
import requests
from datetime import datetime

BASE_DIR = "data/isibens"
os.makedirs(BASE_DIR, exist_ok=True)


def fetch_isibens_file():
    """
    Downloads the ISIBENS CSV-wrapped HTML file.
    Returns the local file path.
    """

    url = "https://isibens.in/unduh/harga-bbm.csv"   # same URL you used
    today_str = datetime.today().strftime("%Y%m%d")
    filename = f"isibens_{today_str}.csv"
    filepath = os.path.join(BASE_DIR, filename)

    print(f"[INFO] Downloading CSV → {filepath}")

    response = requests.get(url, timeout=10)
    response.raise_for_status()

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(response.text)

    print("[OK] CSV downloaded successfully.")
    return filepath


if __name__ == "__main__":
    print(fetch_isibens_file())