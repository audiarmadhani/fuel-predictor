from pathlib import Path
import json
import joblib

MODELS_DIR = Path("models")
METRICS_DIR = Path("metrics")

BEST_MODELS_FILE = METRICS_DIR / "best_models.json"


def load_best_models():
    with open(BEST_MODELS_FILE, "r") as f:
        return json.load(f)


def load_all_models():
    best = load_best_models()
    loaded = {}

    for target, model_type in best.items():
        model_path = MODELS_DIR / f"{target}_{model_type}.pkl"
        meta_path = MODELS_DIR / f"{target}_{model_type}_meta.json"

        # Load main model
        model = joblib.load(model_path)

        # Load metadata (feature order)
        if meta_path.exists():
            with open(meta_path, "r") as f:
                metadata = json.load(f)
            features = metadata.get("features", None)
        else:
            features = None

        # Store in dict (NOT tuple)
        loaded[target] = {
            "model_type": model_type,
            "model": model,
            "features": features,
        }

    return loaded