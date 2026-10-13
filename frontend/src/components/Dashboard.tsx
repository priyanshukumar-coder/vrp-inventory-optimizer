"use client";

import dynamic from "next/dynamic";
import { OptimizationResult, UploadedData, ForecastResult, DealerForecastSummary } from "../lib/types";
import RouteResults from "./RouteResults";
import FrequencyResults from "./FrequencyResults";
import InventoryResults from "./InventoryResults";
import CostSummary from "./CostSummary";
import DemandForecast from "./DemandForecast";
import ModelFormulation from "./ModelFormulation";
import WhatIfSimulator from "./WhatIfSimulator";
import { 
  Map, 
  Calendar, 
  PackageOpen, 
  CreditCard, 
  TrendingUp, 
  BookOpen,
  Sliders
} from "lucide-react";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

interface DashboardProps {
  result: OptimizationResult;
  uploadedData: UploadedData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  forecast: ForecastResult | null;
  onRetrainForecast: () => void;
  onApplyForecast: (summaries: DealerForecastSummary[]) => void;
  isForecasting: boolean;
}

export default function Dashboard({ 
  result, 
  uploadedData, 
  activeTab, 
  setActiveTab,
  forecast,
  onRetrainForecast,
  onApplyForecast,
  isForecasting
}: DashboardProps) {
  const tabs = [
    { id: "Forecast", label: "Demand Forecast (XGBoost)", icon: <TrendingUp className="w-4 h-4 mr-2" /> },
    { id: "Simulator", label: "What-If Simulator", icon: <Sliders className="w-4 h-4 mr-2" /> },
    { id: "Formulation", label: "Mathematical Model", icon: <BookOpen className="w-4 h-4 mr-2" /> },
    { id: "Routes", label: "Route Schedules & Map", icon: <Map className="w-4 h-4 mr-2" /> },
    { id: "Frequency", label: "Delivery Frequencies", icon: <Calendar className="w-4 h-4 mr-2" /> },
    { id: "Inventory", label: "Safety Stock & Inventory", icon: <PackageOpen className="w-4 h-4 mr-2" /> },
    { id: "Cost Summary", label: "Executive Cost Summary", icon: <CreditCard className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Top Navigation Tabs */}
      <div className="border-b border-gray-200 bg-gray-50/80">
        <nav className="flex -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-5 font-medium text-sm border-b-2 whitespace-nowrap transition-colors
                ${activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs font-semibold' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="p-6 md:p-8">
        {activeTab === "Forecast" && forecast && (
          <DemandForecast
            forecast={forecast}
            onRetrain={onRetrainForecast}
            onApplyToOptimization={onApplyForecast}
            isTraining={isForecasting}
          />
        )}

        {activeTab === "Simulator" && (
          <WhatIfSimulator data={uploadedData} />
        )}

        {activeTab === "Formulation" && (
          <ModelFormulation />
        )}

        {activeTab === "Routes" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Schedules</h3>
              <RouteResults routes={result.routes} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Interactive Chennai Road Network Map</h3>
              <RouteMap routes={result.routes} dealers={uploadedData.dealers} />
            </div>
          </div>
        )}

        {activeTab === "Frequency" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Optimal Delivery Frequencies (y<sub>if</sub>)</h3>
            <FrequencyResults frequencies={result.frequencies} />
          </div>
        )}

        {activeTab === "Inventory" && (
          <div>
            <InventoryResults inventories={result.inventories} />
          </div>
        )}

        {activeTab === "Cost Summary" && (
          <div>
            <CostSummary result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
