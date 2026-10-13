"use client";

import React, { useState } from "react";
import { ForecastResult, DealerForecastSummary } from "../lib/types";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  Cpu, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  BarChart3, 
  Activity, 
  ArrowRight 
} from "lucide-react";

interface DemandForecastProps {
  forecast: ForecastResult;
  onRetrain: () => void;
  onApplyToOptimization: (summaries: DealerForecastSummary[]) => void;
  isTraining: boolean;
}

export default function DemandForecast({
  forecast,
  onRetrain,
  onApplyToOptimization,
  isTraining
}: DemandForecastProps) {
  const [selectedDealerId, setSelectedDealerId] = useState<number>(1);

  // Filter chart series for the selected dealer
  const chartData = forecast.chart_series
    .filter((d) => d.dealer_id === selectedDealerId)
    .map((item) => ({
      date: item.date.slice(5), // mm-dd
      "Actual Demand": item.actual,
      "XGBoost Prediction / Forecast": item.predicted,
      is_forecast: item.is_forecast
    }));

  const selectedDealerSummary = forecast.dealer_summaries.find(
    (d) => d.dealer_id === selectedDealerId
  );

  return (
    <div className="space-y-8">
      {/* Top Banner with Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-700 font-semibold text-sm mb-1">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span>Machine Learning Demand Forecasting</span>
            <span className="bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded-full font-mono">
              XGBoost v3.4
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Spare-Parts Demand Forecast & Uncertainty Analysis
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Trained on multi-dealer historical transaction orders with lag features and rolling statistics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRetrain}
            disabled={isTraining}
            className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isTraining ? "animate-spin text-blue-600" : ""}`} />
            {isTraining ? "Training..." : "Retrain XGBoost"}
          </button>
          <button
            onClick={() => onApplyToOptimization(forecast.dealer_summaries)}
            className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Apply Forecast to Optimization
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase mb-1">
            <span>RMSE (Error)</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{forecast.metrics.rmse} <span className="text-xs font-normal text-gray-500">units</span></p>
          <p className="text-xs text-gray-500 mt-1">Root Mean Squared Error</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase mb-1">
            <span>MAE</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{forecast.metrics.mae} <span className="text-xs font-normal text-gray-500">units</span></p>
          <p className="text-xs text-gray-500 mt-1">Mean Absolute Error</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase mb-1">
            <span>R² Variance</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600">{(forecast.metrics.r2_score * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Coefficient of determination</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase mb-1">
            <span>MAPE</span>
            <BarChart3 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{forecast.metrics.mape}%</p>
          <p className="text-xs text-gray-500 mt-1">Mean Percentage Error</p>
        </div>
      </div>

      {/* Interactive Charts: Actual vs Predicted Time Series & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actual vs Predicted Time Series Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">Historical Actuals vs. 7-Day XGBoost Forecast</h3>
              <p className="text-xs text-gray-500">
                Displaying historical observations, test predictions, and the upcoming 7-day planning horizon.
              </p>
            </div>
            
            {/* Dealer Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Dealer:</label>
              <select
                value={selectedDealerId}
                onChange={(e) => setSelectedDealerId(Number(e.target.value))}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {forecast.dealer_summaries.map((d) => (
                  <option key={d.dealer_id} value={d.dealer_id}>
                    {d.dealer_name} (ID: {d.dealer_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} unit=" u" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    borderRadius: "8px", 
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }} 
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Line 
                  type="monotone" 
                  dataKey="Actual Demand" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="XGBoost Prediction / Forecast" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 2"
                  dot={{ r: 4, fill: "#2563eb" }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {selectedDealerSummary && (
            <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-100 flex flex-wrap items-center justify-between text-xs text-blue-950">
              <span className="font-semibold">{selectedDealerSummary.dealer_name} Forecast:</span>
              <span>Predicted Mean Demand (<em>d<sub>i</sub></em>): <strong>{selectedDealerSummary.predicted_mean_demand} units/day</strong></span>
              <span>Uncertainty (<em>σ<sub>i</sub></em>): <strong>{selectedDealerSummary.predicted_std_demand}</strong></span>
              <span>7-Day Sum: <strong>{selectedDealerSummary.daily_predictions.reduce((a, b) => a + b, 0).toFixed(1)} units</strong></span>
            </div>
          )}
        </div>

        {/* Feature Importance Bar Chart (1 col) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">XGBoost Feature Importance</h3>
            <p className="text-xs text-gray-500">
              Top predictive drivers evaluated by split gain.
            </p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={forecast.feature_importances.slice(0, 7)} 
                layout="vertical"
                margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis dataKey="feature" type="category" tick={{ fill: "#334155", fontSize: 10, fontWeight: 500 }} />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Bar dataKey="importance" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-500 text-center italic">
            *Lag features (e.g. 7-day, 14-day cycles) and rolling averages show highest predictive contribution.
          </p>
        </div>
      </div>

      {/* Dealer Forecast Summary Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Dealer-Wise Demand Forecast Table</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              These values (<em>d<sub>i</sub></em> and <em>σ<sub>i</sub></em>) feed into Safety Stock 
              <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-700 ml-1">SS<sub>if</sub> = z·σ<sub>i</sub>·√f</code> and vehicle routing.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {forecast.dealer_summaries.length} Dealers Forecasted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-medium">
              <tr>
                <th className="px-5 py-3 text-left">Dealer Name</th>
                <th className="px-5 py-3 text-right">Predicted Daily Mean (<em>d<sub>i</sub></em>)</th>
                <th className="px-5 py-3 text-right">Forecast Std Dev (<em>σ<sub>i</sub></em>)</th>
                <th className="px-5 py-3 text-center">7-Day Daily Trajectory</th>
                <th className="px-5 py-3 text-right">7-Day Total Demand</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {forecast.dealer_summaries.map((dealer) => {
                const total7 = dealer.daily_predictions.reduce((a, b) => a + b, 0);
                return (
                  <tr key={dealer.dealer_id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {dealer.dealer_name} <span className="text-gray-400 font-normal">#{dealer.dealer_id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-800">
                      {dealer.predicted_mean_demand.toFixed(2)} units
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-600 font-mono">
                      ±{dealer.predicted_std_demand.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-[11px] text-gray-600">
                      {dealer.daily_predictions.map((p, idx) => (
                        <span 
                          key={idx} 
                          className="inline-block px-1.5 py-0.5 mx-0.5 bg-gray-100 rounded text-slate-700"
                          title={`Day ${idx + 1}: ${p} units`}
                        >
                          {p.toFixed(0)}
                        </span>
                      ))}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-indigo-700">
                      {total7.toFixed(1)} units
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedDealerId(dealer.dealer_id)}
                        className="text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        View Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
