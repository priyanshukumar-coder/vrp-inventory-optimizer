from fastapi import APIRouter, HTTPException
from app.models.schemas import OptimizationInput, OptimizationResult
from app.services.preprocessing import preprocess
from app.services.solver import run_optimization
from app.services.result_parser import parse_results
from app.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/api/optimize", response_model=OptimizationResult)
def optimize(input_data: OptimizationInput):
    """
    Run the VRP Inventory Optimization.
    """
    try:
        dealers = input_data.dealers
        demands = input_data.demands
        vehicles = input_data.vehicles
        
        if not dealers or not demands or not vehicles:
            raise HTTPException(status_code=400, detail="Missing required input data (dealers, demands, or vehicles).")
            
        logger.info(f"Starting optimization with {len(dealers)} dealers, {len(vehicles)} vehicles.")
        
        # 1. Preprocessing
        prep_data = preprocess(dealers, demands, vehicles, settings)
        distance_matrix = prep_data['distance_matrix']
        inventory_data = prep_data['inventory_data']
        
        # 2. Solving
        raw_solution = run_optimization(distance_matrix, dealers, demands, vehicles, inventory_data, settings)
        
        # 3. Parsing Results
        result = parse_results(raw_solution, dealers, demands, vehicles, distance_matrix, inventory_data, settings)
        
        return result
        
    except Exception as e:
        logger.exception("Optimization failed")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")
