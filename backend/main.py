from fastapi import FastAPI
from util_supabase import supabase

app = FastAPI()

@app.get("/")
def health():
    return {"status": "ok"}

@app.get("/latest")
def latest_prediction():
    resp = supabase.table("predictions").select("*").order("id", desc=True).limit(1).execute()
    if resp.data:
        return resp.data[0]
    return {"error": "No prediction available yet"}