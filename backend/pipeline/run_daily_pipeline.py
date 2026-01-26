import os
import json
from datetime import datetime
from util_supabase import supabase

# import your existing modules
from fetch_and_update import update_historical
from exog_loader import update_exog_history
from merge_dataset import merge_monthly_dataset
from train_models import train_all_models
from predict import predict_next_month

DATA_ISIBENS_PATH = "data/isibens"

def store_prediction(pred, conf):
    """Write the prediction + confidence to Supabase."""
    next_month = (datetime.now().replace(day=1) + 
                  datetime.timedelta(days=35)).strftime("%Y-%m")

    supabase.table("predictions").insert({
        "month": next_month,
        "model": pred,
        "confidence": conf,
        "html_snippet": json.dumps(pred)
    }).execute()

def run_pipeline():
    print("=== RUNNING DAILY PIPELINE ===")

    # Step 1: Download today's CSV
    csv_path = f"{DATA_ISIBENS_PATH}/isibens_daily.html"   # or downloaded path
    # You already have fetch_isibens() – call that here if needed
    # csv_path = fetch_isibens()

    # Step 2: Update prices
    update_historical(csv_path)

    # Step 3: Update exogenous history
    update_exog_history()

    # Step 4: Merge dataset
    merge_monthly_dataset()

    # Step 5: Train all models
    train_all_models()

    # Step 6: Predict
    pred, conf = predict_next_month()

    # Step 7: Store in Supabase
    store_prediction(pred, conf)

    print("=== PIPELINE DONE ===")

if __name__ == "__main__":
    run_pipeline()