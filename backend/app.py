from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.healthcheck import router as health_router
from api.latest_prediction import router as latest_router
from api.predict_endpoint import router as predict_router

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

# Register API routers
app.include_router(health_router, prefix="/health")
app.include_router(latest_router, prefix="/latest")
app.include_router(predict_router, prefix="/predict")


@app.get("/")
def root():
    return {"message": "Fuel Predictor API is running"}