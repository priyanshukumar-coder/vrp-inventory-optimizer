import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import SimulationInput, SimulationResult, DealerData, DemandData, VehicleData
from app.services.simulation import run_what_if_simulation
from app.config import settings
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

def load_default_sample_inputs() -> tuple[list[DealerData], list[DemandData], list[VehicleData]]:
    """Helper to load sample dataset from disk."""
    dealers_file = os.path.join(DATA_DIR, "sample_dealers.csv")
    demands_file = os.path.join(DATA_DIR, "sample_demand.csv")
    vehicles_file = os.path.join(DATA_DIR, "sample_vehicles.csv")

    if not (os.path.exists(dealers_file) and os.path.exists(demands_file) and os.path.exists(vehicles_file)):
        raise FileNotFoundError("Sample data files not found in data directory.")

    dealers_df = pd.read_csv(dealers_file)
    demands_df = pd.read_csv(demands_file)
    vehicles_df = pd.read_csv(vehicles_file)

    dealers = [DealerData(**r) for r in dealers_df.to_dict(orient="records")]
    demands = [DemandData(**r) for r in demands_df.to_dict(orient="records")]
    vehicles = [VehicleData(**r) for r in vehicles_df.to_dict(orient="records")]
    return dealers, demands, vehicles

@router.post("/api/simulate", response_model=SimulationResult)
def simulate(input_data: SimulationInput):
    """
    Run What-If Scenario Simulation with user-supplied dealers, demands, and vehicles,
    varying demand multiplier, lead time, service level z, and fuel costs.
    """
    try:
        if not input_data.dealers or not input_data.demands or not input_data.vehicles:
            raise HTTPException(status_code=400, detail="Missing required input data (dealers, demands, or vehicles).")

        logger.info(
            f"Running What-If Simulation: demand_mult={input_data.demand_multiplier}, "
            f"lead_time={input_data.lead_time_days}d, z={input_data.service_level_z}"
        )
        result = run_what_if_simulation(input_data, settings)
        return result
    except Exception as e:
        logger.exception("What-If simulation failed")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@router.get("/api/simulate/sample", response_model=SimulationResult)
def simulate_sample(
    demand_multiplier: float = Query(1.2, ge=0.2, le=3.0, description="Demand multiplier (e.g. 1.2 for +20%)"),
    lead_time_days: int = Query(2, ge=1, le=14, description="Replenishment lead time in days"),
    service_level_z: float = Query(1.65, ge=0.5, le=3.5, description="Z-score for target service level"),
    fuel_cost_multiplier: float = Query(1.0, ge=0.2, le=3.0, description="Fuel / per-km vehicle cost index"),
    scenario_name: str = Query("Sample What-If Scenario", description="Scenario label")
):
    """
    Quick test endpoint using built-in sample data with customizable query parameters.
    """
    try:
        dealers, demands, vehicles = load_default_sample_inputs()
        sim_input = SimulationInput(
            dealers=dealers,
            demands=demands,
            vehicles=vehicles,
            demand_multiplier=demand_multiplier,
            lead_time_days=lead_time_days,
            service_level_z=service_level_z,
            fuel_cost_multiplier=fuel_cost_multiplier,
            scenario_name=scenario_name
        )
        return run_what_if_simulation(sim_input, settings)
    except Exception as e:
        logger.exception("Sample simulation failed")
        raise HTTPException(status_code=500, detail=f"Sample simulation failed: {str(e)}")
