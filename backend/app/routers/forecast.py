from fastapi import APIRouter, HTTPException, UploadFile, File
import pandas as pd
import io
import logging
from typing import Optional
from app.models.schemas import ForecastResult, DemandData
from app.services.forecasting import train_xgboost_forecast, load_historical_data

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory cache for fast sample forecast retrieval
_cached_forecast: Optional[dict] = None

@router.post("/api/forecast", response_model=ForecastResult)
def run_forecast():
    """
    Train the XGBoost demand forecasting model on historical data
    and return evaluation metrics, feature importances, and dealer forecasts.
    """
    global _cached_forecast
    try:
        logger.info("Executing XGBoost demand forecasting pipeline...")
        result = train_xgboost_forecast()
        _cached_forecast = result
        return result
    except Exception as e:
        logger.exception("XGBoost forecasting failed")
        raise HTTPException(status_code=500, detail=f"Forecasting failed: {str(e)}")

@router.get("/api/forecast/sample", response_model=ForecastResult)
def get_sample_forecast():
    """
    Get sample forecast results (using cached model if available or training once).
    """
    global _cached_forecast
    try:
        if _cached_forecast is None:
            _cached_forecast = train_xgboost_forecast()
        return _cached_forecast
    except Exception as e:
        logger.exception("Failed to get sample forecast")
        raise HTTPException(status_code=500, detail=f"Failed to get sample forecast: {str(e)}")

@router.post("/api/forecast/upload", response_model=ForecastResult)
async def upload_and_forecast(file: UploadFile = File(...)):
    """
    Upload custom historical sales CSV and run XGBoost forecasting.
    Required columns: date, dealer_id, demand
    Optional columns: is_promotion, lead_time_days
    """
    global _cached_forecast
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        df['date'] = pd.to_datetime(df['date'])
        
        required_cols = {'date', 'dealer_id', 'demand'}
        if not required_cols.issubset(df.columns):
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required columns: {required_cols - set(df.columns)}"
            )
            
        if 'dealer_name' not in df.columns:
            df['dealer_name'] = df['dealer_id'].apply(lambda x: f"Dealer {x}")
        if 'is_promotion' not in df.columns:
            df['is_promotion'] = 0
        if 'lead_time_days' not in df.columns:
            df['lead_time_days'] = 1

        result = train_xgboost_forecast(df)
        _cached_forecast = result
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to process custom historical demand file")
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
