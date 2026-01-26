import pandas as pd
import os

def clean_dataset():

    input_path = "data/processed/merged_data.csv"
    output_path = "data/processed/merged_data_clean.csv"

    print("1. Loading your merged dataset...")
    df = pd.read_csv(input_path)

    # 2. Normalize date
    print("2. Normalizing date column...")
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])
    df = df.sort_values("date")

    # 3. Convert all columns except date to numeric
    print("3. Converting all columns (except date) to numeric...")
    for col in df.columns:
        if col != "date":
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # 4. Check missing values
    print("4. Checking missing values...")
    print(df.isna().sum())

    # 5. Interpolate missing values
    print("5. Filling missing values using interpolation...")
    df = df.interpolate(method="linear")

    # 6. Backfill + Forward fill (pandas 3.0+ syntax)
    df = df.bfill()
    df = df.ffill()

    # 7. Save
    print("6. Saving cleaned dataset...")
    os.makedirs("data/processed", exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"SUCCESS: Cleaned dataset saved to {output_path}")


if __name__ == "__main__":
    clean_dataset()