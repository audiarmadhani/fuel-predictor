import os
from dotenv import load_dotenv
load_dotenv()
from pipeline.fetch_and_update import update_historical
from pipeline.exog_loader import update_exog_history
from pipeline.merge_dataset import merge_monthly_dataset
from pipeline.train_models import train_all_models
from pipeline.predict import predict_next_month
from pipeline.fetch_isibens import fetch_isibens_file
from pipeline.supabase_writer import write_prediction_to_supabase
import traceback


def run_pipeline():

    print("\n==============================================")
    print("        FUEL PRICE PREDICTION PIPELINE")
    print("==============================================\n")

    try:
        # ------------------------------------------------------
        # STEP 1 – Download latest raw file
        # ------------------------------------------------------
        print("\n[ STEP 1 ] Downloading latest fuel price file…")

        csv_path = fetch_isibens_file()  # must return path of downloaded CSV
        print(f"[OK] Downloaded: {csv_path}")

        # ------------------------------------------------------
        # STEP 2 – Update historical fuel database
        # ------------------------------------------------------
        print("\n[ STEP 2 ] Updating historical fuel dataset…")
        update_historical(csv_path)

        # ------------------------------------------------------
        # STEP 3 – Update EXOG monthly history
        # ------------------------------------------------------
        print("\n[ STEP 3 ] Updating monthly exogenous variable history…")
        update_exog_history()

        # ------------------------------------------------------
        # STEP 4 – Merge datasets
        # ------------------------------------------------------
        print("\n[ STEP 4 ] Merging master dataset…")
        merge_monthly_dataset()

        # --------------------------------------------------------
        # STEP 5: TRAIN MODELS
        # --------------------------------------------------------
        print("\n[ STEP 5 ] Training models…")
        train_all_models()

        # --------------------------------------------------------
        # STEP 6: PREDICT NEXT MONTH
        # --------------------------------------------------------
        print("\n[ STEP 6 ] Predicting next month’s fuel prices…")

        month, results = predict_next_month()

        # Save results to Supabase
        write_prediction_to_supabase(month, results)

        print("\n===== FINAL PREDICTION OUTPUT =====")
        for brand_ron, obj in results.items():
            price = round(obj["price"], 2)
            conf = obj["confidence_pct"]
            print(f"{brand_ron}: {price}  (confidence {conf}%)")

        print("====================================")

    except Exception as e:
        print("\n[ERROR] Pipeline failed:")
        print(str(e))
        print(traceback.format_exc())


if __name__ == "__main__":
    run_pipeline()