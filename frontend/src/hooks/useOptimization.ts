import { useState, useEffect } from "react";
import { UploadedData, OptimizationResult, ForecastResult, DealerForecastSummary, DemandData } from "../lib/types";
import { api } from "../lib/api";

export const useOptimization = () => {
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isForecasting, setIsForecasting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Forecast");

  // Load sample forecast on mount
  useEffect(() => {
    api.fetchForecastSample()
      .then((data) => setForecast(data))
      .catch((err) => console.log("Initial forecast load deferred:", err));
  }, []);

  const handleFileUpload = async (dealerFile: File, demandFile: File, vehicleFile: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.uploadFiles(dealerFile, demandFile, vehicleFile);
      setUploadedData(data);
    } catch (err: any) {
      setError(err.message || "Failed to upload files");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, forecastData] = await Promise.all([
        api.fetchSampleData(),
        api.fetchForecastSample().catch(() => null)
      ]);
      setUploadedData(data);
      if (forecastData) {
        setForecast(forecastData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load sample data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrainForecast = async () => {
    setIsForecasting(true);
    setError(null);
    try {
      const newForecast = await api.runForecast();
      setForecast(newForecast);
    } catch (err: any) {
      setError(err.message || "Failed to retrain XGBoost forecast");
    } finally {
      setIsForecasting(false);
    }
  };

  const handleApplyForecastToOptimization = async (summaries: DealerForecastSummary[]) => {
    if (!uploadedData) {
      // If sample data wasn't loaded yet, fetch it first
      try {
        const sample = await api.fetchSampleData();
        const updatedDemands: DemandData[] = sample.demands.map((dem) => {
          const match = summaries.find((s) => s.dealer_id === dem.dealer_id);
          if (match) {
            return {
              dealer_id: dem.dealer_id,
              mean_demand: match.predicted_mean_demand,
              std_demand: match.predicted_std_demand
            };
          }
          return dem;
        });
        const updatedData = { ...sample, demands: updatedDemands };
        setUploadedData(updatedData);
        await runOptimizationWithData(updatedData);
      } catch (err: any) {
        setError(err.message || "Failed to apply forecast");
      }
      return;
    }

    // Update current demands with the forecasted values
    const updatedDemands: DemandData[] = uploadedData.demands.map((dem) => {
      const match = summaries.find((s) => s.dealer_id === dem.dealer_id);
      if (match) {
        return {
          dealer_id: dem.dealer_id,
          mean_demand: match.predicted_mean_demand,
          std_demand: match.predicted_std_demand
        };
      }
      return dem;
    });

    const updatedData = { ...uploadedData, demands: updatedDemands };
    setUploadedData(updatedData);
    await runOptimizationWithData(updatedData);
  };

  const runOptimizationWithData = async (data: UploadedData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.runOptimization(data);
      setOptimizationResult(result);
      setActiveTab("Routes");
    } catch (err: any) {
      setError(err.message || "Optimization failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!uploadedData) return;
    await runOptimizationWithData(uploadedData);
  };

  return {
    uploadedData,
    optimizationResult,
    forecast,
    isLoading,
    isForecasting,
    error,
    activeTab,
    handleFileUpload,
    handleLoadSample,
    handleOptimize,
    handleRetrainForecast,
    handleApplyForecastToOptimization,
    setActiveTab,
  };
};
