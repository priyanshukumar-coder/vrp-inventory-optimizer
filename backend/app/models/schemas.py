from pydantic import BaseModel, Field
from typing import List, Optional

class DealerData(BaseModel):
    dealer_id: int
    name: str
    latitude: float
    longitude: float
    holding_cost_per_unit: float

class DemandData(BaseModel):
    dealer_id: int
    mean_demand: float
    std_demand: float

class VehicleData(BaseModel):
    vehicle_id: int
    capacity: float
    cost_per_km: float

class OptimizationInput(BaseModel):
    dealers: List[DealerData]
    demands: List[DemandData]
    vehicles: List[VehicleData]

class RouteInfo(BaseModel):
    day: int
    vehicle_id: int
    dealer_sequence: List[int]
    distance: float

class FrequencyInfo(BaseModel):
    dealer_id: int
    dealer_name: str
    frequency_days: int
    visit_days: List[int]

class FrequencyInventoryDetail(BaseModel):
    frequency: int
    safety_stock: float
    reorder_quantity: float
    total_inventory: float
    holding_cost: float
    is_selected: bool = False

class InventoryInfo(BaseModel):
    dealer_id: int
    dealer_name: str
    mean_demand: float
    safety_stock: float
    reorder_quantity: float
    total_inventory: float
    holding_cost: float
    frequency_breakdown: Optional[List[FrequencyInventoryDetail]] = None

class SolverStats(BaseModel):
    status: str
    gap: Optional[float] = None
    solve_time_seconds: Optional[float] = None
    num_variables: Optional[int] = None
    num_constraints: Optional[int] = None
    solver_used: str

class OptimizationResult(BaseModel):
    total_cost: float
    transportation_cost: float
    inventory_cost: float
    routes: List[RouteInfo]
    frequencies: List[FrequencyInfo]
    inventories: List[InventoryInfo]
    solver_stats: SolverStats

class ForecastMetrics(BaseModel):
    rmse: float
    mae: float
    r2_score: float
    mape: float
    model_type: str
    training_samples: int
    test_samples: int

class FeatureImportance(BaseModel):
    feature: str
    importance: float

class DealerForecastSummary(BaseModel):
    dealer_id: int
    dealer_name: str
    predicted_mean_demand: float
    predicted_std_demand: float
    forecast_period_days: int
    daily_predictions: List[float]

class DailyForecastItem(BaseModel):
    date: str
    day_number: int
    dealer_id: int
    dealer_name: str
    predicted_demand: float

class ChartDataPoint(BaseModel):
    date: str
    dealer_id: int
    dealer_name: str
    actual: Optional[float] = None
    predicted: Optional[float] = None
    is_forecast: bool

class ForecastResult(BaseModel):
    metrics: ForecastMetrics
    feature_importances: List[FeatureImportance]
    dealer_summaries: List[DealerForecastSummary]
    daily_forecasts: List[DailyForecastItem]
    chart_series: List[ChartDataPoint]

class SimulationInput(BaseModel):
    dealers: List[DealerData]
    demands: List[DemandData]
    vehicles: List[VehicleData]
    demand_multiplier: float = Field(default=1.0, ge=0.1, le=5.0)
    lead_time_days: int = Field(default=1, ge=1, le=14)
    service_level_z: float = Field(default=1.65, ge=0.5, le=3.5)
    fuel_cost_multiplier: float = Field(default=1.0, ge=0.2, le=3.0)
    scenario_name: Optional[str] = "Custom What-If"

class FrequencyShiftItem(BaseModel):
    dealer_id: int
    dealer_name: str
    baseline_frequency: int
    simulated_frequency: int
    has_shifted: bool
    baseline_holding_cost: float
    simulated_holding_cost: float
    baseline_safety_stock: float
    simulated_safety_stock: float

class SensitivityPoint(BaseModel):
    demand_multiplier: float
    demand_label: str
    transportation_cost: float
    inventory_cost: float
    total_cost: float
    routes_count: int

class SimulationResult(BaseModel):
    scenario_name: str
    demand_multiplier: float
    lead_time_days: int
    service_level_z: float
    fuel_cost_multiplier: float
    baseline_cost: float
    simulated_cost: float
    baseline_transport_cost: float
    simulated_transport_cost: float
    baseline_inventory_cost: float
    simulated_inventory_cost: float
    delta_total_cost_pct: float
    delta_transport_cost_pct: float
    delta_inventory_cost_pct: float
    routes_count_baseline: int
    routes_count_simulated: int
    frequency_shifts: List[FrequencyShiftItem]
    sensitivity_curve: List[SensitivityPoint]
    simulated_optimization: OptimizationResult

