export interface DealerData {
  dealer_id: number;
  name: string;
  latitude: number;
  longitude: number;
  holding_cost_per_unit: number;
}

export interface DemandData {
  dealer_id: number;
  mean_demand: number;
  std_demand: number;
}

export interface VehicleData {
  vehicle_id: number;
  capacity: number;
  cost_per_km: number;
}

export interface RouteInfo {
  day: number;
  vehicle_id: number;
  dealer_sequence: number[];
  distance: number;
}

export interface FrequencyInfo {
  dealer_id: number;
  dealer_name: string;
  frequency_days: number;
  visit_days: number[];
}

export interface FrequencyInventoryDetail {
  frequency: number;
  safety_stock: number;
  reorder_quantity: number;
  total_inventory: number;
  holding_cost: number;
  is_selected: boolean;
}

export interface InventoryInfo {
  dealer_id: number;
  dealer_name: string;
  mean_demand: number;
  safety_stock: number;
  reorder_quantity: number;
  total_inventory: number;
  holding_cost: number;
  frequency_breakdown?: FrequencyInventoryDetail[];
}

export interface SolverStats {
  status: string;
  gap: number | null;
  solve_time_seconds: number;
  num_variables: number;
  num_constraints: number;
  solver_used: string;
}

export interface OptimizationResult {
  total_cost: number;
  transportation_cost: number;
  inventory_cost: number;
  routes: RouteInfo[];
  frequencies: FrequencyInfo[];
  inventories: InventoryInfo[];
  solver_stats: SolverStats;
}

export interface UploadedData {
  dealers: DealerData[];
  demands: DemandData[];
  vehicles: VehicleData[];
}

export interface ForecastMetrics {
  rmse: number;
  mae: number;
  r2_score: number;
  mape: number;
  model_type: string;
  training_samples: number;
  test_samples: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface DealerForecastSummary {
  dealer_id: number;
  dealer_name: string;
  predicted_mean_demand: number;
  predicted_std_demand: number;
  forecast_period_days: number;
  daily_predictions: number[];
}

export interface DailyForecastItem {
  date: string;
  day_number: number;
  dealer_id: number;
  dealer_name: string;
  predicted_demand: number;
}

export interface ChartDataPoint {
  date: string;
  dealer_id: number;
  dealer_name: string;
  actual: number | null;
  predicted: number | null;
  is_forecast: boolean;
}

export interface ForecastResult {
  metrics: ForecastMetrics;
  feature_importances: FeatureImportance[];
  dealer_summaries: DealerForecastSummary[];
  daily_forecasts: DailyForecastItem[];
  chart_series: ChartDataPoint[];
}

export interface SimulationInput {
  dealers: DealerData[];
  demands: DemandData[];
  vehicles: VehicleData[];
  demand_multiplier: number;
  lead_time_days: number;
  service_level_z: number;
  fuel_cost_multiplier: number;
  scenario_name?: string;
}

export interface FrequencyShiftItem {
  dealer_id: number;
  dealer_name: string;
  baseline_frequency: number;
  simulated_frequency: number;
  has_shifted: boolean;
  baseline_holding_cost: number;
  simulated_holding_cost: number;
  baseline_safety_stock: number;
  simulated_safety_stock: number;
}

export interface SensitivityPoint {
  demand_multiplier: number;
  demand_label: string;
  transportation_cost: number;
  inventory_cost: number;
  total_cost: number;
  routes_count: number;
}

export interface SimulationResult {
  scenario_name: string;
  demand_multiplier: number;
  lead_time_days: number;
  service_level_z: number;
  fuel_cost_multiplier: number;
  baseline_cost: number;
  simulated_cost: number;
  baseline_transport_cost: number;
  simulated_transport_cost: number;
  baseline_inventory_cost: number;
  simulated_inventory_cost: number;
  delta_total_cost_pct: number;
  delta_transport_cost_pct: number;
  delta_inventory_cost_pct: number;
  routes_count_baseline: number;
  routes_count_simulated: number;
  frequency_shifts: FrequencyShiftItem[];
  sensitivity_curve: SensitivityPoint[];
  simulated_optimization: OptimizationResult;
}
