"use client";

import { useOptimization } from "../hooks/useOptimization";
import FileUpload from "../components/FileUpload";
import OptimizationStatus from "../components/OptimizationStatus";
import Dashboard from "../components/Dashboard";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";

export default function Home() {
  const {
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
  } = useOptimization();

  const [showUploadPanel, setShowUploadPanel] = useState<boolean>(false);

  const handleLaunchForecastOptimization = async () => {
    let currentForecast = forecast;
    if (!currentForecast) {
      try {
        currentForecast = await api.fetchForecastSample();
      } catch (err: any) {
        console.error("Failed to fetch forecast:", err);
      }
    }
    if (currentForecast) {
      await handleApplyForecastToOptimization(currentForecast.dealer_summaries);
    } else {
      await handleLoadSample();
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              🚛 Vehicle Routing & Inventory Optimizer
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              Automotive Spare-Parts OEM
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Joint optimization of delivery routes, frequencies, and dealer inventory powered by XGBoost demand forecasting.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href="/VRP_Inventory_Optimization_Comprehensive_Technical_Report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            title="Download Comprehensive 20-Page PDF Technical Report"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Download PDF Report
          </a>

          {optimizationResult && (
            <button
              onClick={() => setShowUploadPanel(!showUploadPanel)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors"
            >
              {showUploadPanel ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Dashboard
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Modify Input Data
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Upload Section (Visible when no optimization yet, or when toggled) */}
      {(!optimizationResult || showUploadPanel) && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <FileUpload
            onUpload={handleFileUpload}
            onLoadSample={handleLoadSample}
            onOptimize={handleOptimize}
            onOptimizeWithForecast={handleLaunchForecastOptimization}
            uploadedData={uploadedData}
            isLoading={isLoading || isForecasting}
          />
        </section>
      )}

      {/* Loading States */}
      {isLoading && <OptimizationStatus status="loading" />}
      
      {/* Error Alert */}
      {error && <OptimizationStatus status="error" error={error} />}

      {/* Results Dashboard */}
      {optimizationResult && !isLoading && (
        <Dashboard
          result={optimizationResult}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          uploadedData={uploadedData!}
          forecast={forecast}
          onRetrainForecast={handleRetrainForecast}
          onApplyForecast={handleApplyForecastToOptimization}
          isForecasting={isForecasting}
        />
      )}
    </main>
  );
}
