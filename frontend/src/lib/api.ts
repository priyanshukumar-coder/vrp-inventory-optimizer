import { UploadedData, OptimizationResult, ForecastResult, SimulationInput, SimulationResult } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export const api = {
  fetchSampleData: async (): Promise<UploadedData> => {
    const response = await fetch(`${API_BASE_URL}/api/sample-data`);
    if (!response.ok) {
      throw new Error("Failed to fetch sample data");
    }
    const raw = await response.json();
    // Backend returns { dealers: { csv_base64, data }, demands: { ... }, vehicles: { ... } }
    return {
      dealers: raw.dealers.data,
      demands: raw.demands.data,
      vehicles: raw.vehicles.data,
    };
  },

  uploadFiles: async (
    dealerFile: File,
    demandFile: File,
    vehicleFile: File
  ): Promise<UploadedData> => {
    const formData = new FormData();
    formData.append("dealers_file", dealerFile);
    formData.append("demands_file", demandFile);
    formData.append("vehicles_file", vehicleFile);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload files");
    }
    return response.json();
  },

  runOptimization: async (data: UploadedData): Promise<OptimizationResult> => {
    const response = await fetch(`${API_BASE_URL}/api/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Optimization failed");
    }
    return response.json();
  },

  fetchForecastSample: async (): Promise<ForecastResult> => {
    const response = await fetch(`${API_BASE_URL}/api/forecast/sample`);
    if (!response.ok) {
      throw new Error("Failed to fetch forecast sample");
    }
    return response.json();
  },

  runForecast: async (): Promise<ForecastResult> => {
    const response = await fetch(`${API_BASE_URL}/api/forecast`, {
      method: "POST",
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Forecasting failed");
    }
    return response.json();
  },

  uploadForecastData: async (file: File): Promise<ForecastResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/forecast/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to upload historical data");
    }
    return response.json();
  },

  runSimulation: async (input: SimulationInput): Promise<SimulationResult> => {
    const response = await fetch(`${API_BASE_URL}/api/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Simulation failed");
    }
    return response.json();
  },

  fetchSampleSimulation: async (
    demandMultiplier: number = 1.3,
    leadTimeDays: number = 2,
    serviceLevelZ: number = 1.65,
    fuelCostMultiplier: number = 1.0,
    scenarioName: string = "Sample What-If"
  ): Promise<SimulationResult> => {
    const params = new URLSearchParams({
      demand_multiplier: demandMultiplier.toString(),
      lead_time_days: leadTimeDays.toString(),
      service_level_z: serviceLevelZ.toString(),
      fuel_cost_multiplier: fuelCostMultiplier.toString(),
      scenario_name: scenarioName,
    });
    const response = await fetch(`${API_BASE_URL}/api/simulate/sample?${params.toString()}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to fetch sample simulation");
    }
    return response.json();
  }
};
