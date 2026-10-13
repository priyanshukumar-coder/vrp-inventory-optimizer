import time
import logging
import numpy as np
from typing import List, Dict, Any

try:
    import gurobipy as gp
    from gurobipy import GRB
    GUROBI_AVAILABLE = True
except ImportError:
    GUROBI_AVAILABLE = False

import sys
import os

# Ensure backend root is in sys.path when executed directly
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.models.schemas import DealerData, DemandData, VehicleData
from app.config import Settings

logger = logging.getLogger(__name__)

class GurobiSolver:
    def __init__(self, distance_matrix: np.ndarray, dealers: List[DealerData], demands: List[DemandData], vehicles: List[VehicleData], inventory_data: Dict[int, Dict[int, Any]], settings: Settings):
        self.distance_matrix = distance_matrix
        self.dealers = dealers
        self.demands = demands
        self.vehicles = vehicles
        self.inventory_data = inventory_data
        self.settings = settings
        self.model = None

    def build_model(self):
        if not GUROBI_AVAILABLE:
            raise ImportError("Gurobi is not installed.")
        
        self.model = gp.Model("VRP_Inventory")
        
        N = len(self.dealers)
        V = len(self.vehicles)
        T = self.settings.planning_horizon
        F = self.settings.frequencies
        
        # x_ijvt: 1 if vehicle v travels from i to j on day t
        self.x = self.model.addVars(N, N, V, T, vtype=GRB.BINARY, name="x")
        
        # y_if: 1 if dealer i is assigned frequency f
        self.y = self.model.addVars(N, len(F), vtype=GRB.BINARY, name="y")
        
        # z_it: 1 if dealer i is visited on day t
        self.z = self.model.addVars(N, T, vtype=GRB.BINARY, name="z")
        
        # q_ivt: quantity delivered to dealer i by vehicle v on day t
        self.q = self.model.addVars(N, V, T, vtype=GRB.CONTINUOUS, name="q")
        
        # u_it: MTZ subtour elimination variable for dealer i on day t
        self.u = self.model.addVars(N, T, vtype=GRB.CONTINUOUS, name="u")

        # Objective function
        # Transportation cost
        trans_cost = gp.quicksum(
            self.distance_matrix[i, j] * self.vehicles[v].cost_per_km * self.x[i, j, v, t]
            for i in range(N) for j in range(N) for v in range(V) for t in range(T)
        )
        
        # Inventory holding cost
        inv_cost = gp.quicksum(
            self.y[i, f_idx] * self.inventory_data[self.dealers[i].dealer_id][f]['holding_cost']
            for i in range(1, N) for f_idx, f in enumerate(F)
        )
        
        self.model.setObjective(trans_cost + inv_cost, GRB.MINIMIZE)
        
        # Constraints
        
        # 1. One frequency per dealer
        for i in range(1, N):
            self.model.addConstr(gp.quicksum(self.y[i, f_idx] for f_idx in range(len(F))) == 1, name=f"one_freq_{i}")
            
        # 2. Visit-frequency linking: z_it should be 1 if day t is a multiple of frequency f
        for i in range(1, N):
            for t in range(T):
                expr = gp.quicksum(
                    self.y[i, f_idx] for f_idx, f in enumerate(F) if t % f == 0
                )
                self.model.addConstr(self.z[i, t] == expr, name=f"visit_freq_link_{i}_{t}")

        # 3. Visit implies routing
        for i in range(1, N):
            for t in range(T):
                self.model.addConstr(
                    gp.quicksum(self.x[j, i, v, t] for j in range(N) if j != i for v in range(V)) == self.z[i, t],
                    name=f"visit_routing_in_{i}_{t}"
                )
                self.model.addConstr(
                    gp.quicksum(self.x[i, j, v, t] for j in range(N) if j != i for v in range(V)) == self.z[i, t],
                    name=f"visit_routing_out_{i}_{t}"
                )
                
        # 4. Flow conservation per vehicle
        for i in range(N):
            for v in range(V):
                for t in range(T):
                    self.model.addConstr(
                        gp.quicksum(self.x[j, i, v, t] for j in range(N) if j != i) == 
                        gp.quicksum(self.x[i, k, v, t] for k in range(N) if k != i),
                        name=f"flow_cons_{i}_{v}_{t}"
                    )
        
        # 5. Depot departure/return
        for v in range(V):
            for t in range(T):
                # A vehicle leaves depot at most once per day
                self.model.addConstr(
                    gp.quicksum(self.x[0, j, v, t] for j in range(1, N)) <= 1,
                    name=f"depot_leave_{v}_{t}"
                )
                
        # 6. Vehicle capacity
        for v in range(V):
            for t in range(T):
                self.model.addConstr(
                    gp.quicksum(self.q[i, v, t] for i in range(1, N)) <= self.vehicles[v].capacity,
                    name=f"veh_cap_{v}_{t}"
                )
                
        # 7. Delivery quantity linking
        demand_map = {d.dealer_id: d for d in self.demands}
        for i in range(1, N):
            dem = demand_map.get(self.dealers[i].dealer_id)
            mean_d = dem.mean_demand if dem else 0.0
            
            for t in range(T):
                for v in range(V):
                    # q_ivt can only be > 0 if vehicle visits
                    M = self.vehicles[v].capacity
                    self.model.addConstr(
                        self.q[i, v, t] <= M * gp.quicksum(self.x[j, i, v, t] for j in range(N) if j != i),
                        name=f"q_link_{i}_{v}_{t}"
                    )
                    
                # Total delivered to i on day t should match reorder quantity if visited
                req_qty = gp.quicksum(
                    self.y[i, f_idx] * (mean_d * f) for f_idx, f in enumerate(F)
                )
                self.model.addConstr(
                    gp.quicksum(self.q[i, v, t] for v in range(V)) == req_qty * self.z[i, t],
                    name=f"q_req_{i}_{t}"
                )

        # 8. MTZ subtour elimination
        for t in range(T):
            for i in range(1, N):
                for j in range(1, N):
                    if i != j:
                        for v in range(V):
                            self.model.addConstr(
                                self.u[i, t] - self.u[j, t] + N * self.x[i, j, v, t] <= N - 1,
                                name=f"mtz_{i}_{j}_{v}_{t}"
                            )
                            
        # Set parameters
        self.model.setParam('TimeLimit', self.settings.solver_time_limit)
        self.model.setParam('MIPGap', self.settings.solver_mip_gap)

    def solve(self) -> dict:
        start_time = time.time()
        self.model.optimize()
        solve_time = time.time() - start_time
        
        status = self.model.status
        status_map = {
            GRB.OPTIMAL: 'OPTIMAL',
            GRB.INFEASIBLE: 'INFEASIBLE',
            GRB.TIME_LIMIT: 'TIME_LIMIT',
            GRB.SUBOPTIMAL: 'SUBOPTIMAL'
        }
        status_str = status_map.get(status, f'UNKNOWN ({status})')
        
        if status in [GRB.OPTIMAL, GRB.TIME_LIMIT, GRB.SUBOPTIMAL] and self.model.solCount > 0:
            # Extract solution
            N = len(self.dealers)
            V = len(self.vehicles)
            T = self.settings.planning_horizon
            F = self.settings.frequencies
            
            x_vals = np.zeros((N, N, V, T))
            for i in range(N):
                for j in range(N):
                    for v in range(V):
                        for t in range(T):
                            if self.x[i, j, v, t].X > 0.5:
                                x_vals[i, j, v, t] = 1
            
            y_vals = np.zeros((N, len(F)))
            for i in range(1, N):
                for f_idx in range(len(F)):
                    if self.y[i, f_idx].X > 0.5:
                        y_vals[i, f_idx] = 1
                        
            z_vals = np.zeros((N, T))
            for i in range(1, N):
                for t in range(T):
                    if self.z[i, t].X > 0.5:
                        z_vals[i, t] = 1
                        
            gap = self.model.MIPGap if hasattr(self.model, 'MIPGap') else 0.0
            
            return {
                'x': x_vals.tolist(),
                'y': y_vals.tolist(),
                'z': z_vals.tolist(),
                'status': status_str,
                'gap': gap,
                'solve_time': solve_time,
                'num_vars': self.model.NumVars,
                'num_constrs': self.model.NumConstrs,
                'solver_used': 'Gurobi'
            }
        else:
            return {
                'status': status_str,
                'solve_time': solve_time,
                'solver_used': 'Gurobi'
            }

class HeuristicSolver:
    def __init__(self, distance_matrix: np.ndarray, dealers: List[DealerData], demands: List[DemandData], vehicles: List[VehicleData], inventory_data: Dict[int, Dict[int, Any]], settings: Settings):
        self.distance_matrix = distance_matrix
        self.dealers = dealers
        self.demands = demands
        self.vehicles = vehicles
        self.inventory_data = inventory_data
        self.settings = settings
        
    def solve(self) -> dict:
        start_time = time.time()
        N = len(self.dealers)
        V = len(self.vehicles)
        T = self.settings.planning_horizon
        F = self.settings.frequencies
        
        # 1. Greedy frequency assignment
        y_vals = np.zeros((N, len(F)))
        z_vals = np.zeros((N, T))
        
        for i in range(1, N):
            best_f_idx = -1
            min_cost = float('inf')
            
            for f_idx, f in enumerate(F):
                cost = self.inventory_data[self.dealers[i].dealer_id][f]['holding_cost']
                # Rough estimate of transport cost (avg distance * 2 * f)
                avg_dist = np.mean(self.distance_matrix[i, :])
                cost += avg_dist * 2 * f
                
                if cost < min_cost:
                    min_cost = cost
                    best_f_idx = f_idx
                    
            y_vals[i, best_f_idx] = 1
            for t in range(T):
                if t % F[best_f_idx] == 0:
                    z_vals[i, t] = 1
                    
        # 2. Nearest-neighbor VRP
        x_vals = np.zeros((N, N, V, T))
        demand_map = {d.dealer_id: d for d in self.demands}
        
        for t in range(T):
            # Nodes to visit today
            nodes_to_visit = [i for i in range(1, N) if z_vals[i, t] == 1]
            
            for v in range(V):
                if not nodes_to_visit:
                    break
                    
                cap = self.vehicles[v].capacity
                curr_load = 0
                curr_node = 0
                
                while nodes_to_visit:
                    # Find nearest neighbor
                    best_next = -1
                    min_dist = float('inf')
                    
                    for next_node in nodes_to_visit:
                        # Check capacity
                        dem = demand_map.get(self.dealers[next_node].dealer_id)
                        mean_d = dem.mean_demand if dem else 0.0
                        
                        f_idx = np.argmax(y_vals[next_node])
                        freq = F[f_idx]
                        req_qty = mean_d * freq
                        
                        if curr_load + req_qty <= cap:
                            dist = self.distance_matrix[curr_node, next_node]
                            if dist < min_dist:
                                min_dist = dist
                                best_next = next_node
                                
                    if best_next != -1:
                        x_vals[curr_node, best_next, v, t] = 1
                        curr_node = best_next
                        nodes_to_visit.remove(best_next)
                        
                        dem = demand_map.get(self.dealers[best_next].dealer_id)
                        mean_d = dem.mean_demand if dem else 0.0
                        f_idx = np.argmax(y_vals[best_next])
                        curr_load += mean_d * F[f_idx]
                    else:
                        break # Vehicle full
                        
                # Return to depot
                if curr_node != 0:
                    x_vals[curr_node, 0, v, t] = 1
                    
        solve_time = time.time() - start_time
        return {
            'x': x_vals.tolist(),
            'y': y_vals.tolist(),
            'z': z_vals.tolist(),
            'status': 'HEURISTIC_SUCCESS',
            'gap': 0.0,
            'solve_time': solve_time,
            'num_vars': 0,
            'num_constrs': 0,
            'solver_used': 'Heuristic'
        }

_gurobi_unusable = False

def run_optimization(distance_matrix: np.ndarray, dealers: List[DealerData], demands: List[DemandData], vehicles: List[VehicleData], inventory_data: Dict[int, Dict[int, Any]], settings: Settings, force_heuristic: bool = False) -> dict:
    global _gurobi_unusable
    if GUROBI_AVAILABLE and not force_heuristic and not _gurobi_unusable:
        try:
            logger.info("Running Gurobi Solver...")
            solver = GurobiSolver(distance_matrix, dealers, demands, vehicles, inventory_data, settings)
            solver.build_model()
            result = solver.solve()
            if result['status'] in ['OPTIMAL', 'SUBOPTIMAL', 'TIME_LIMIT']:
                return result
            logger.warning(f"Gurobi failed with status {result['status']}. Falling back to Heuristic.")
        except Exception as e:
            _gurobi_unusable = True
            logger.warning(f"Gurobi error: {e}. Falling back to Heuristic.")
            
    solver = HeuristicSolver(distance_matrix, dealers, demands, vehicles, inventory_data, settings)
    return solver.solve()
