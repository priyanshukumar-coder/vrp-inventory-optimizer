import pandas as pd
import io
import base64
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any, List
from app.models.schemas import DealerData, DemandData, VehicleData

router = APIRouter()

import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

@router.get("/api/sample-data")
def get_sample_data():
    """
    Returns sample data as base64-encoded strings and JSON.
    """
    files = {
        "dealers": "sample_dealers.csv",
        "demands": "sample_demand.csv",
        "vehicles": "sample_vehicles.csv"
    }
    
    result = {}
    for key, filename in files.items():
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail=f"Sample file {filename} not found.")
            
        with open(filepath, "r") as f:
            content = f.read()
            
        # Also return as JSON
        df = pd.read_csv(io.StringIO(content))
        
        result[key] = {
            "csv_base64": base64.b64encode(content.encode('utf-8')).decode('utf-8'),
            "data": df.to_dict(orient="records")
        }
        
    return result

@router.post("/api/upload")
async def upload_data(dealers_file: UploadFile = File(...), demands_file: UploadFile = File(...), vehicles_file: UploadFile = File(...)):
    """
    Parse uploaded CSV files and return structured data.
    """
    try:
        dealers_df = pd.read_csv(dealers_file.file)
        demands_df = pd.read_csv(demands_file.file)
        vehicles_df = pd.read_csv(vehicles_file.file)
        
        dealers = [DealerData(**row) for row in dealers_df.to_dict(orient="records")]
        demands = [DemandData(**row) for row in demands_df.to_dict(orient="records")]
        vehicles = [VehicleData(**row) for row in vehicles_df.to_dict(orient="records")]
        
        return {
            "dealers": dealers,
            "demands": demands,
            "vehicles": vehicles
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing files: {str(e)}")
