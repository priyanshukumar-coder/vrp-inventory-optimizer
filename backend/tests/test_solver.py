import numpy as np
from app.models.schemas import DealerData, DemandData, VehicleData
from app.config import Settings
from app.services.solver import HeuristicSolver

def test_heuristic_solver_execution():
    settings = Settings()
    
    dealers = [
        DealerData(dealer_id=0, name="Central Depot", latitude=13.0827, longitude=80.2707, holding_cost_per_unit=0.0),
        DealerData(dealer_id=1, name="Dealer A", latitude=13.0900, longitude=80.2800, holding_cost_per_unit=2.0),
        DealerData(dealer_id=2, name="Dealer B", latitude=13.0700, longitude=80.2600, holding_cost_per_unit=2.5)
    ]
    
    demands = [
        DemandData(dealer_id=1, mean_demand=25.0, std_demand=5.0),
        DemandData(dealer_id=2, mean_demand=40.0, std_demand=8.0)
    ]
    
    vehicles = [
        VehicleData(vehicle_id=1, capacity=300.0, cost_per_km=15.0),
        VehicleData(vehicle_id=2, capacity=300.0, cost_per_km=15.0)
    ]
    
    distance_matrix = np.array([
        [0.0, 5.0, 6.0],
        [5.0, 0.0, 7.0],
        [6.0, 7.0, 0.0]
    ])
    
    # Mock inventory data for candidate frequencies [1, 3, 5, 7]
    inventory_data = {
        1: {f: {"delivery_qty": 25.0 * f, "safety_stock": 1.65 * 5.0 * np.sqrt(f), "avg_inventory": 25.0 * f + 1.65 * 5.0 * np.sqrt(f), "holding_cost": 2.0 * (25.0 * f + 1.65 * 5.0 * np.sqrt(f))} for f in [1, 3, 5, 7]},
        2: {f: {"delivery_qty": 40.0 * f, "safety_stock": 1.65 * 8.0 * np.sqrt(f), "avg_inventory": 40.0 * f + 1.65 * 8.0 * np.sqrt(f), "holding_cost": 2.5 * (40.0 * f + 1.65 * 8.0 * np.sqrt(f))} for f in [1, 3, 5, 7]}
    }
    
    solver = HeuristicSolver(distance_matrix, dealers, demands, vehicles, inventory_data, settings)
    result = solver.solve()
    
    assert result["solver_used"] == "Heuristic"
    assert result["status"] == "HEURISTIC_SUCCESS"
    assert "x" in result
    assert "y" in result
    assert "z" in result
    assert result["solve_time"] >= 0
