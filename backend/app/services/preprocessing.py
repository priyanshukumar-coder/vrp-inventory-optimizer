import numpy as np
from math import radians, cos, sin, asin, sqrt
from typing import List, Tuple, Dict, Any
from app.models.schemas import DealerData, DemandData, VehicleData
from app.config import Settings

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees).
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles.
    return c * r

def compute_distance_matrix(dealers: List[DealerData]) -> np.ndarray:
    """
    Compute NxN distance matrix for all dealers using haversine formula.
    """
    n = len(dealers)
    dist_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                dist_matrix[i][j] = haversine_distance(
                    dealers[i].latitude, dealers[i].longitude,
                    dealers[j].latitude, dealers[j].longitude
                )
    return dist_matrix

from typing import List, Tuple, Dict, Any, Optional

def compute_safety_stock(std_demand: float, frequency: int, z_score: float, lead_time: int = 1) -> float:
    """
    Compute safety stock based on standard deviation, frequency of visits, lead time, and service level z-score.
    SS = z * sigma * sqrt(f + max(0, lead_time - 1))
    When lead_time = 1, SS = z * sigma * sqrt(f) (baseline poster formulation).
    """
    effective_interval = frequency + max(0, lead_time - 1)
    return float(z_score * std_demand * np.sqrt(effective_interval))

def compute_inventory(mean_demand: float, std_demand: float, frequency: int, z_score: float, lead_time: int = 1) -> Tuple[float, float, float]:
    """
    Compute inventory metrics:
    SS_if = z * sigma_i * sqrt(f + max(0, lead_time - 1))
    I_if = d_i * f + SS_if
    Returns: (safety_stock, reorder_qty, total_inventory)
    """
    safety_stock = compute_safety_stock(std_demand, frequency, z_score, lead_time)
    reorder_qty = mean_demand * frequency
    total_inventory = reorder_qty + safety_stock
    return safety_stock, reorder_qty, total_inventory

def preprocess(
    dealers: List[DealerData], 
    demands: List[DemandData], 
    vehicles: List[VehicleData], 
    settings: Settings,
    demand_multiplier: float = 1.0,
    lead_time_days: int = 1,
    service_level_z: Optional[float] = None
) -> Dict[str, Any]:
    """
    Preprocess data for optimization with optional what-if parameters.
    Returns distance matrix and pre-computed inventory stats for each frequency.
    """
    distance_matrix = compute_distance_matrix(dealers)
    
    demand_map = {d.dealer_id: d for d in demands}
    z_val = service_level_z if service_level_z is not None else settings.service_level_z
    
    # Pre-calculate inventory metrics for each dealer for each possible frequency
    inventory_data = {}
    for dealer in dealers:
        if dealer.dealer_id == 0:
            continue
            
        dem = demand_map.get(dealer.dealer_id)
        mean_d = (dem.mean_demand if dem else 0.0) * demand_multiplier
        std_d = (dem.std_demand if dem else 0.0) * demand_multiplier
        
        freq_data = {}
        for freq in settings.frequencies:
            ss, rq, total_inv = compute_inventory(mean_d, std_d, freq, z_val, lead_time=lead_time_days)
            holding_cost = total_inv * dealer.holding_cost_per_unit
            freq_data[freq] = {
                'safety_stock': round(ss, 2),
                'reorder_qty': round(rq, 2),
                'total_inventory': round(total_inv, 2),
                'holding_cost': round(holding_cost, 2)
            }
        inventory_data[dealer.dealer_id] = freq_data
        
    return {
        'distance_matrix': distance_matrix,
        'inventory_data': inventory_data
    }
