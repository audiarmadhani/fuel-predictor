from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.history import router as history_router
from api.track import router as track_router


app = FastAPI(
    title="Fuel Predictor API",
    description="API for monthly fuel price predictions",
    version="1.0.0",
)

# CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Fuel Predictor API is running"}

app.include_router(history_router, prefix="/api")

app.include_router(track_router, prefix="/api")