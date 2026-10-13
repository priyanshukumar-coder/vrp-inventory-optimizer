from typing import List, Dict, Any
from app.models.schemas import (
    DealerData, DemandData, VehicleData, 
    OptimizationResult, RouteInfo, FrequencyInfo, InventoryInfo, SolverStats
)
from app.config import Settings

def parse_results(raw_solution: dict, dealers: List[DealerData], demands: List[DemandData], vehicles: List[VehicleData], distance_matrix: Any, inventory_data: Dict[int, Dict[int, Any]], settings: Settings) -> OptimizationResult:
    if 'x' not in raw_solution:
        raise ValueError(f"Solver failed: {raw_solution.get('status')}")
        
    N = len(dealers)
    V = len(vehicles)
    T = settings.planning_horizon
    F = settings.frequencies
    
    x_vals = raw_solution['x']
    y_vals = raw_solution['y']
    z_vals = raw_solution['z']
    
    demand_map = {d.dealer_id: d for d in demands}
    
    # Extract routes
    routes = []
    transport_cost = 0.0
    
    for t in range(T):
        for v in range(V):
            # Reconstruct route
            curr_node = 0
            route_seq = [0]
            route_dist = 0.0
            
            while True:
                next_node = -1
                for j in range(N):
                    if x_vals[curr_node][j][v][t] > 0.5:
                        next_node = j
                        break
                        
                if next_node != -1:
                    route_seq.append(next_node)
                    route_dist += distance_matrix[curr_node][next_node]
                    curr_node = next_node
                    if curr_node == 0:
                        break
                else:
                    break
                    
            if len(route_seq) > 1: # More than just depot
                if route_seq[-1] != 0: # Ensure it ends at depot
                    route_seq.append(0)
                    route_dist += distance_matrix[route_seq[-2]][0]
                    
                routes.append(RouteInfo(
                    day=t,
                    vehicle_id=vehicles[v].vehicle_id,
                    dealer_sequence=route_seq,
                    distance=route_dist
                ))
                transport_cost += route_dist * vehicles[v].cost_per_km

    # Extract frequencies and inventory
    frequencies = []
    inventories = []
    inventory_cost = 0.0
    
    for i in range(1, N):
        dealer = dealers[i]
        
        # Find assigned frequency
        assigned_f_idx = -1
        for f_idx in range(len(F)):
            if y_vals[i][f_idx] > 0.5:
                assigned_f_idx = f_idx
                break
                
        if assigned_f_idx != -1:
            freq = F[assigned_f_idx]
            visit_days = [t for t in range(T) if z_vals[i][t] > 0.5]
            
            frequencies.append(FrequencyInfo(
                dealer_id=dealer.dealer_id,
                dealer_name=dealer.name,
                frequency_days=freq,
                visit_days=visit_days
            ))
            
            inv_stats = inventory_data[dealer.dealer_id][freq]
            dem = demand_map.get(dealer.dealer_id)
            mean_d = dem.mean_demand if dem else 0.0
            
            inventory_cost += inv_stats['holding_cost']
            
            # Build frequency breakdown matrix for all f in F
            breakdown = []
            for f_val in F:
                f_stat = inventory_data[dealer.dealer_id][f_val]
                breakdown.append({
                    "frequency": f_val,
                    "safety_stock": f_stat['safety_stock'],
                    "reorder_quantity": f_stat['reorder_qty'],
                    "total_inventory": f_stat['total_inventory'],
                    "holding_cost": f_stat['holding_cost'],
                    "is_selected": (f_val == freq)
                })

            inventories.append(InventoryInfo(
                dealer_id=dealer.dealer_id,
                dealer_name=dealer.name,
                mean_demand=mean_d,
                safety_stock=inv_stats['safety_stock'],
                reorder_quantity=inv_stats['reorder_qty'],
                total_inventory=inv_stats['total_inventory'],
                holding_cost=inv_stats['holding_cost'],
                frequency_breakdown=breakdown
            ))
            
    total_cost = transport_cost + inventory_cost
    
    stats = SolverStats(
        status=raw_solution['status'],
        gap=raw_solution.get('gap'),
        solve_time_seconds=raw_solution.get('solve_time'),
        num_variables=raw_solution.get('num_vars'),
        num_constraints=raw_solution.get('num_constrs'),
        solver_used=raw_solution.get('solver_used')
    )
    
    return OptimizationResult(
        total_cost=total_cost,
        transportation_cost=transport_cost,
        inventory_cost=inventory_cost,
        routes=routes,
        frequencies=frequencies,
        inventories=inventories,
        solver_stats=stats
    )
