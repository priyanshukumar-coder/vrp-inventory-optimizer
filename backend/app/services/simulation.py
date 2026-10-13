import logging
from typing import List, Dict, Any
from app.models.schemas import (
    SimulationInput, SimulationResult, FrequencyShiftItem, SensitivityPoint,
    DealerData, DemandData, VehicleData, OptimizationResult
)
from app.services.preprocessing import preprocess
from app.services.solver import run_optimization
from app.services.result_parser import parse_results
from app.config import Settings

logger = logging.getLogger(__name__)

def run_what_if_simulation(sim_input: SimulationInput, settings: Settings) -> SimulationResult:
    """
    Executes a high-speed What-If simulation comparing baseline logistics parameters
    against modified demand, lead time, service level, and fuel costs.
    Generates comparative deltas, frequency shift migrations, and a sensitivity sweep curve.
    """
    dealers = sim_input.dealers
    demands = sim_input.demands
    vehicles = sim_input.vehicles

    # 1. Baseline Evaluation (Demand 1.0x, Lead Time 1 day, Baseline Z, Fuel 1.0x)
    prep_base = preprocess(
        dealers=dealers,
        demands=demands,
        vehicles=vehicles,
        settings=settings,
        demand_multiplier=1.0,
        lead_time_days=1,
        service_level_z=settings.service_level_z
    )
    raw_base = run_optimization(
        distance_matrix=prep_base['distance_matrix'],
        dealers=dealers,
        demands=demands,
        vehicles=vehicles,
        inventory_data=prep_base['inventory_data'],
        settings=settings,
        force_heuristic=True
    )
    res_base = parse_results(
        raw_solution=raw_base,
        dealers=dealers,
        demands=demands,
        vehicles=vehicles,
        distance_matrix=prep_base['distance_matrix'],
        inventory_data=prep_base['inventory_data'],
        settings=settings
    )

    # 2. Simulated Scenario Evaluation
    demands_sim = [
        DemandData(
            dealer_id=d.dealer_id,
            mean_demand=round(d.mean_demand * sim_input.demand_multiplier, 2),
            std_demand=round(d.std_demand * sim_input.demand_multiplier, 2)
        )
        for d in demands
    ]
    vehicles_sim = [
        VehicleData(
            vehicle_id=v.vehicle_id,
            capacity=v.capacity,
            cost_per_km=round(v.cost_per_km * sim_input.fuel_cost_multiplier, 2)
        )
        for v in vehicles
    ]

    prep_sim = preprocess(
        dealers=dealers,
        demands=demands_sim,
        vehicles=vehicles_sim,
        settings=settings,
        demand_multiplier=1.0,
        lead_time_days=sim_input.lead_time_days,
        service_level_z=sim_input.service_level_z
    )
    raw_sim = run_optimization(
        distance_matrix=prep_sim['distance_matrix'],
        dealers=dealers,
        demands=demands_sim,
        vehicles=vehicles_sim,
        inventory_data=prep_sim['inventory_data'],
        settings=settings,
        force_heuristic=True
    )
    res_sim = parse_results(
        raw_solution=raw_sim,
        dealers=dealers,
        demands=demands_sim,
        vehicles=vehicles_sim,
        distance_matrix=prep_sim['distance_matrix'],
        inventory_data=prep_sim['inventory_data'],
        settings=settings
    )

    # 3. Analyze Frequency Shifts
    base_freq_map = {f.dealer_id: f.frequency_days for f in res_base.frequencies}
    sim_freq_map = {f.dealer_id: f.frequency_days for f in res_sim.frequencies}

    base_inv_map = {inv.dealer_id: inv for inv in res_base.inventories}
    sim_inv_map = {inv.dealer_id: inv for inv in res_sim.inventories}

    frequency_shifts: List[FrequencyShiftItem] = []
    for dealer in dealers:
        if dealer.dealer_id == 0:
            continue
        d_id = dealer.dealer_id
        b_freq = base_freq_map.get(d_id, 1)
        s_freq = sim_freq_map.get(d_id, 1)

        b_inv = base_inv_map.get(d_id)
        s_inv = sim_inv_map.get(d_id)

        frequency_shifts.append(FrequencyShiftItem(
            dealer_id=d_id,
            dealer_name=dealer.name,
            baseline_frequency=b_freq,
            simulated_frequency=s_freq,
            has_shifted=(b_freq != s_freq),
            baseline_holding_cost=b_inv.holding_cost if b_inv else 0.0,
            simulated_holding_cost=s_inv.holding_cost if s_inv else 0.0,
            baseline_safety_stock=b_inv.safety_stock if b_inv else 0.0,
            simulated_safety_stock=s_inv.safety_stock if s_inv else 0.0
        ))

    # 4. Compute Sensitivity Sweep Curve across Demand Variation [-40% to +80%]
    sweep_multipliers = [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0]
    sensitivity_curve: List[SensitivityPoint] = []

    for mult in sweep_multipliers:
        d_sweep = [
            DemandData(
                dealer_id=d.dealer_id,
                mean_demand=round(d.mean_demand * mult, 2),
                std_demand=round(d.std_demand * mult, 2)
            )
            for d in demands
        ]
        prep_sw = preprocess(
            dealers=dealers,
            demands=d_sweep,
            vehicles=vehicles_sim,
            settings=settings,
            demand_multiplier=1.0,
            lead_time_days=sim_input.lead_time_days,
            service_level_z=sim_input.service_level_z
        )
        raw_sw = run_optimization(
            distance_matrix=prep_sw['distance_matrix'],
            dealers=dealers,
            demands=d_sweep,
            vehicles=vehicles_sim,
            inventory_data=prep_sw['inventory_data'],
            settings=settings,
            force_heuristic=True
        )
        res_sw = parse_results(
            raw_solution=raw_sw,
            dealers=dealers,
            demands=d_sweep,
            vehicles=vehicles_sim,
            distance_matrix=prep_sw['distance_matrix'],
            inventory_data=prep_sw['inventory_data'],
            settings=settings
        )

        pct_label = f"{int(round((mult - 1.0) * 100)):+d}%" if mult != 1.0 else "Baseline (100%)"
        sensitivity_curve.append(SensitivityPoint(
            demand_multiplier=mult,
            demand_label=pct_label,
            transportation_cost=round(res_sw.transportation_cost, 2),
            inventory_cost=round(res_sw.inventory_cost, 2),
            total_cost=round(res_sw.total_cost, 2),
            routes_count=len(res_sw.routes)
        ))

    # 5. Cost Deltas
    base_cost = res_base.total_cost
    sim_cost = res_sim.total_cost
    delta_total_pct = round(((sim_cost - base_cost) / max(1.0, base_cost)) * 100, 2)
    delta_trans_pct = round(((res_sim.transportation_cost - res_base.transportation_cost) / max(1.0, res_base.transportation_cost)) * 100, 2)
    delta_inv_pct = round(((res_sim.inventory_cost - res_base.inventory_cost) / max(1.0, res_base.inventory_cost)) * 100, 2)

    return SimulationResult(
        scenario_name=sim_input.scenario_name or "What-If Scenario",
        demand_multiplier=sim_input.demand_multiplier,
        lead_time_days=sim_input.lead_time_days,
        service_level_z=sim_input.service_level_z,
        fuel_cost_multiplier=sim_input.fuel_cost_multiplier,
        baseline_cost=round(base_cost, 2),
        simulated_cost=round(sim_cost, 2),
        baseline_transport_cost=round(res_base.transportation_cost, 2),
        simulated_transport_cost=round(res_sim.transportation_cost, 2),
        baseline_inventory_cost=round(res_base.inventory_cost, 2),
        simulated_inventory_cost=round(res_sim.inventory_cost, 2),
        delta_total_cost_pct=delta_total_pct,
        delta_transport_cost_pct=delta_trans_pct,
        delta_inventory_cost_pct=delta_inv_pct,
        routes_count_baseline=len(res_base.routes),
        routes_count_simulated=len(res_sim.routes),
        frequency_shifts=frequency_shifts,
        sensitivity_curve=sensitivity_curve,
        simulated_optimization=res_sim
    )
