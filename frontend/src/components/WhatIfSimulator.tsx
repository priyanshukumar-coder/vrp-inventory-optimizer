"use client";

import React, { useState, useEffect, useMemo } from "react";
import { UploadedData, SimulationResult, SimulationInput } from "../lib/types";
import { api } from "../lib/api";
import {
  Sliders,
  TrendingUp,
  Truck,
  Package,
  IndianRupee,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Calendar,
  Layers,
  HelpCircle
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

interface WhatIfSimulatorProps {
  data: UploadedData | null;
}

export default function WhatIfSimulator({ data }: WhatIfSimulatorProps) {
  // Simulator Levers State
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.3);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(2);
  const [serviceLevelZ, setServiceLevelZ] = useState<number>(1.65);
  const [fuelMultiplier, setFuelMultiplier] = useState<number>(1.0);
  const [scenarioName, setScenarioName] = useState<string>("Festive Surge + Transit Delay");

  // Output State
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Preset Scenarios
  const presets = [
    {
      name: "Normal Baseline",
      icon: "🟢",
      demand: 1.0,
      leadTime: 1,
      z: 1.65,
      fuel: 1.0,
      label: "Baseline Ops",
      desc: "Standard weekly demand & 1-day local dispatch"
    },
    {
      name: "Festive Season Surge",
      icon: "⚡",
      demand: 1.4,
      leadTime: 1,
      z: 1.65,
      fuel: 1.0,
      label: "Demand +40%",
      desc: "Diwali/Pongal rush tests truck capacity"
    },
    {
      name: "Port & Transit Delay",
      icon: "🚢",
      demand: 1.0,
      leadTime: 3,
      z: 1.65,
      fuel: 1.0,
      label: "Lead Time = 3 Days",
      desc: "Supplier congestion expands safety stocks"
    },
    {
      name: "High-Stress Disruption",
      icon: "🌪️",
      demand: 1.35,
      leadTime: 3,
      z: 2.33,
      fuel: 1.15,
      label: "Demand +35%, L=3d, 99% SL",
      desc: "Severe supply shock with zero-stockout mandate"
    },
    {
      name: "Market Slump",
      icon: "📉",
      demand: 0.7,
      leadTime: 1,
      z: 1.28,
      fuel: 0.95,
      label: "Demand -30%",
      desc: "Consolidation into fewer weekly dispatches"
    }
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setDemandMultiplier(preset.demand);
    setLeadTimeDays(preset.leadTime);
    setServiceLevelZ(preset.z);
    setFuelMultiplier(preset.fuel);
    setScenarioName(preset.name);
  };

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      let simResult: SimulationResult;
      if (data && data.dealers.length > 0) {
        const payload: SimulationInput = {
          dealers: data.dealers,
          demands: data.demands,
          vehicles: data.vehicles,
          demand_multiplier: demandMultiplier,
          lead_time_days: leadTimeDays,
          service_level_z: serviceLevelZ,
          fuel_cost_multiplier: fuelMultiplier,
          scenario_name: scenarioName
        };
        simResult = await api.runSimulation(payload);
      } else {
        simResult = await api.fetchSampleSimulation(
          demandMultiplier,
          leadTimeDays,
          serviceLevelZ,
          fuelMultiplier,
          scenarioName
        );
      }
      setResult(simResult);
    } catch (err: any) {
      setError(err.message || "Failed to execute simulation.");
    } finally {
      setLoading(false);
    }
  };

  // Run on initial mount or when data changes
  useEffect(() => {
    runSimulation();
  }, [data]);

  // Derived comparative data for charts
  const costComparisonData = useMemo(() => {
    if (!result) return [];
    return [
      {
        category: "Transportation",
        Baseline: result.baseline_transport_cost,
        Simulated: result.simulated_transport_cost
      },
      {
        category: "Inventory Holding",
        Baseline: result.baseline_inventory_cost,
        Simulated: result.simulated_inventory_cost
      },
      {
        category: "Total System Cost",
        Baseline: result.baseline_cost,
        Simulated: result.simulated_cost
      }
    ];
  }, [result]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Scenario Sensitivity Engine
              </span>
              <span className="text-xs text-gray-400">Weekly Planning Horizon (T=7)</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              What-If Logistics & Policy Simulator
            </h2>
            <p className="text-sm text-gray-300 max-w-2xl mt-1">
              Simulate the impact of market demand surges, supplier transit delays, target service levels, 
              and diesel prices on fleet dispatch frequencies, required safety stocks, and total distribution expenditure.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 max-w-sm text-xs space-y-1.5 text-gray-200">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" /> Active Mathematical Formulation
            </div>
            <p className="font-mono text-blue-200">SS = z · σ_i · √(f + max(0, L - 1))</p>
            <p className="font-mono text-emerald-200">I_if = d_i · f + SS_if</p>
            <p className="text-gray-300 text-[11px] pt-1 border-t border-white/10">
              When L=1, matches baseline poster formula. Increasing L expands safety stock over replenishment delay.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scenario Shortcuts */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick-Click Scenario Presets
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((p) => {
            const isSelected = scenarioName === p.name;
            return (
              <button
                key={p.name}
                onClick={() => {
                  applyPreset(p);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{p.icon}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.label}
                  </span>
                </div>
                <p className="font-semibold text-xs text-gray-900 line-clamp-1">{p.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Levers Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" /> Simulation Levers & Sensitivity Parameters
            </h3>
            <p className="text-xs text-gray-500">Adjust the sliders below and click Run to recalculate the optimal routing and inventory policy.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Simulating..." : "⚡ Run Simulation"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {/* Lever 1: Demand Multiplier */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Demand Multiplier
              </label>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  demandMultiplier > 1.0
                    ? "bg-rose-100 text-rose-700"
                    : demandMultiplier < 1.0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {demandMultiplier > 1.0 ? `+${Math.round((demandMultiplier - 1) * 100)}%` : demandMultiplier < 1.0 ? `${Math.round((demandMultiplier - 1) * 100)}%` : "Baseline (1.0x)"}
              </span>
            </div>
            <div className="flex items-center justify-between text-2xl font-black text-gray-900">
              <span>{demandMultiplier.toFixed(2)}x</span>
              <span className="text-xs font-normal text-gray-500">{(demandMultiplier * 100).toFixed(0)}% of Base</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={demandMultiplier}
              onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>0.5x (-50%)</span>
              <span>1.0x</span>
              <span>2.0x (+100%)</span>
            </div>
          </div>

          {/* Lever 2: Lead Time Days */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Replenishment Lead Time
              </label>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  leadTimeDays > 1 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {leadTimeDays === 1 ? "Normal (1d)" : `+${leadTimeDays - 1}d Delay`}
              </span>
            </div>
            <div className="flex items-center justify-between text-2xl font-black text-gray-900">
              <span>{leadTimeDays} {leadTimeDays === 1 ? "Day" : "Days"}</span>
              <span className="text-xs font-normal text-gray-500">Supplier to PDC</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              step="1"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>1 Day (Local)</span>
              <span>4 Days</span>
              <span>7 Days (Max)</span>
            </div>
          </div>

          {/* Lever 3: Service Level Z */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Target Service Level (z)
              </label>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                z = {serviceLevelZ.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: "90%", z: 1.28 },
                { label: "95%", z: 1.65 },
                { label: "98%", z: 2.05 },
                { label: "99%", z: 2.33 }
              ].map((tier) => (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => setServiceLevelZ(tier.z)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    Math.abs(serviceLevelZ - tier.z) < 0.05
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500">
              Higher service level exponentially inflates safety buffer to eliminate stockout risks.
            </p>
          </div>

          {/* Lever 4: Fuel Cost Multiplier */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600" /> Fuel / Km Cost Index
              </label>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  fuelMultiplier > 1.0
                    ? "bg-amber-100 text-amber-800"
                    : fuelMultiplier < 1.0
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {fuelMultiplier > 1.0 ? `+${Math.round((fuelMultiplier - 1) * 100)}%` : fuelMultiplier < 1.0 ? `${Math.round((fuelMultiplier - 1) * 100)}%` : "Standard"}
              </span>
            </div>
            <div className="flex items-center justify-between text-2xl font-black text-gray-900">
              <span>{fuelMultiplier.toFixed(2)}x</span>
              <span className="text-xs font-normal text-gray-500">Diesel Price Scale</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={fuelMultiplier}
              onChange={(e) => setFuelMultiplier(parseFloat(e.target.value))}
              className="w-full accent-amber-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>0.8x (-20%)</span>
              <span>1.0x</span>
              <span>1.5x (+50%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Callout if any */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Delta Cards */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Cost */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-blue-600" /> Total Weekly Cost
              </span>
              <span
                className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  result.delta_total_cost_pct > 0
                    ? "bg-rose-100 text-rose-700"
                    : result.delta_total_cost_pct < 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {result.delta_total_cost_pct > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : result.delta_total_cost_pct < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : null}
                {result.delta_total_cost_pct > 0 ? `+${result.delta_total_cost_pct}%` : `${result.delta_total_cost_pct}%`}
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                ₹{result.simulated_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Baseline: ₹{result.baseline_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="font-semibold text-gray-700 ml-1">
                  (Δ ₹{Math.abs(result.simulated_cost - result.baseline_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                </span>
              </p>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${result.delta_total_cost_pct > 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, Math.max(10, (result.simulated_cost / (result.baseline_cost * 1.5)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Transportation Cost */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-600" /> Fleet Transport Cost
              </span>
              <span
                className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  result.delta_transport_cost_pct > 0
                    ? "bg-rose-100 text-rose-700"
                    : result.delta_transport_cost_pct < 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {result.delta_transport_cost_pct > 0 ? `+${result.delta_transport_cost_pct}%` : `${result.delta_transport_cost_pct}%`}
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                ₹{result.simulated_transport_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Baseline: ₹{result.baseline_transport_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Fuel, distance, and per-km vehicle operation across all daily dispatches.
            </p>
          </div>

          {/* Inventory Holding Cost */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" /> Inventory Holding Cost
              </span>
              <span
                className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  result.delta_inventory_cost_pct > 0
                    ? "bg-rose-100 text-rose-700"
                    : result.delta_inventory_cost_pct < 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {result.delta_inventory_cost_pct > 0 ? `+${result.delta_inventory_cost_pct}%` : `${result.delta_inventory_cost_pct}%`}
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                ₹{result.simulated_inventory_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Baseline: ₹{result.baseline_inventory_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Holding cost for safety stock buffer and cycle stock at all 15 dealerships.
            </p>
          </div>

          {/* Vehicle Routes / Trips */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" /> Active Fleet Routes
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {result.routes_count_simulated} Trips / Week
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">
                {result.routes_count_simulated} <span className="text-base font-semibold text-gray-500">routes</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Baseline: {result.routes_count_baseline} routes
                <span className="font-semibold text-purple-700 ml-1">
                  ({result.routes_count_simulated - result.routes_count_baseline >= 0 ? `+${result.routes_count_simulated - result.routes_count_baseline}` : `${result.routes_count_simulated - result.routes_count_baseline}`} trips)
                </span>
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Trip count expands when demand batches exceed truck capacity limits.
            </p>
          </div>
        </div>
      )}

      {/* Visual Sensitivity & Comparison Charts */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Sensitivity Curve across Demand Variation */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Cost Sensitivity Sweep Curve
                </h4>
                <p className="text-xs text-gray-500">
                  How Total, Transport, and Inventory costs scale as demand changes from -40% to +100% under Lead Time = {leadTimeDays}d.
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.sensitivity_curve} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="demand_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => [`₹${val.toLocaleString()}`, '']}
                    labelFormatter={(label) => `Demand: ${label}`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <ReferenceLine
                    x={
                      demandMultiplier === 1.0
                        ? "Baseline (100%)"
                        : `${demandMultiplier > 1.0 ? `+${Math.round((demandMultiplier - 1) * 100)}%` : `${Math.round((demandMultiplier - 1) * 100)}%`}`
                    }
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Current Lever', position: 'top', fill: '#ef4444', fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_cost"
                    name="Total System Cost"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="transportation_cost"
                    name="Transportation Cost"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="inventory_cost"
                    name="Inventory Holding Cost"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Tipping Point:</strong> As demand rises beyond +40%, transportation cost surges non-linearly because truck capacities saturate, forcing additional vehicle runs.
              </span>
            </div>
          </div>

          {/* Chart 2: Cost Breakdown Baseline vs. Simulated */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" /> Baseline vs. Scenario Cost Split
                </h4>
                <p className="text-xs text-gray-500">
                  Direct component-level comparison of weekly logistics budget (₹).
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costComparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => [`₹${val.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Baseline" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={36} />
                  <Bar dataKey="Simulated" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/80">
                <span className="text-gray-500 font-medium">Baseline Distribution:</span>
                <p className="font-bold text-gray-800 mt-0.5">
                  Transport {((result.baseline_transport_cost / result.baseline_cost) * 100).toFixed(1)}% | Inventory {((result.baseline_inventory_cost / result.baseline_cost) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200/80">
                <span className="text-blue-700 font-medium">Simulated Distribution:</span>
                <p className="font-bold text-blue-900 mt-0.5">
                  Transport {((result.simulated_transport_cost / result.simulated_cost) * 100).toFixed(1)}% | Inventory {((result.simulated_inventory_cost / result.simulated_cost) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Frequency Shift & Dealer Impact Table */}
      {result && result.frequency_shifts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> Dealer Replenishment Frequency & Inventory Shifts
              </h4>
              <p className="text-xs text-gray-500">
                Shows optimal delivery frequency changes ($y_{'{if}'}$) and required safety stock buffer adjustments across all 15 dealerships.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {result.frequency_shifts.filter(f => f.has_shifted).length} of 15 Dealers Shifted Cadence
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Dealer Node</th>
                  <th className="py-3 px-4 text-center">Baseline Frequency</th>
                  <th className="py-3 px-4 text-center">Simulated Frequency</th>
                  <th className="py-3 px-4 text-center">Policy Status</th>
                  <th className="py-3 px-4 text-right">Baseline Safety Stock</th>
                  <th className="py-3 px-4 text-right">Simulated Safety Stock</th>
                  <th className="py-3 px-4 text-right">Holding Cost Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {result.frequency_shifts.map((d) => (
                  <tr key={d.dealer_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{d.dealer_name}</div>
                      <div className="text-[10px] text-gray-400">Node ID: {d.dealer_id}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-mono font-semibold">
                        Every {d.baseline_frequency} {d.baseline_frequency === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md font-mono font-semibold ${
                          d.has_shifted
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        Every {d.simulated_frequency} {d.simulated_frequency === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {d.has_shifted ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Frequency Changed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px]">
                          Unchanged
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 font-mono">
                      {d.baseline_safety_stock.toFixed(1)} units
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      {d.simulated_safety_stock.toFixed(1)} units
                      <span className="text-[10px] font-normal text-gray-400 ml-1">
                        ({d.simulated_safety_stock >= d.baseline_safety_stock ? '+' : ''}
                        {(d.simulated_safety_stock - d.baseline_safety_stock).toFixed(1)})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={d.simulated_holding_cost > d.baseline_holding_cost ? "text-rose-600" : "text-emerald-600"}>
                        ₹{d.simulated_holding_cost.toFixed(1)}
                      </span>
                      <div className="text-[10px] text-gray-400 font-normal">
                        Base: ₹{d.baseline_holding_cost.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategic Managerial Summary Box */}
      {result && (
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-start gap-4">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl flex-shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-sm text-blue-950">Executive Takeaway for Scenario: &quot;{scenarioName}&quot;</h5>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              Under this scenario, total distribution expenditure changes by{" "}
              <strong>{result.delta_total_cost_pct > 0 ? `+${result.delta_total_cost_pct}%` : `${result.delta_total_cost_pct}%`}</strong>{" "}
              (₹{result.simulated_cost.toLocaleString()} vs ₹{result.baseline_cost.toLocaleString()}).{" "}
              {result.routes_count_simulated > result.routes_count_baseline ? (
                <span>
                  Fleet capacity becomes congested, requiring{" "}
                  <strong>{result.routes_count_simulated - result.routes_count_baseline} additional dispatch trips</strong> per week.{" "}
                </span>
              ) : (
                <span>Existing vehicle fleet capacity remains within operational thresholds. </span>
              )}
              {leadTimeDays > 1 && (
                <span>
                  The {leadTimeDays}-day lead time increases dealer safety buffers by{" "}
                  <strong>+{result.delta_inventory_cost_pct}%</strong> holding value to safeguard 
                  the target {(serviceLevelZ === 1.65 ? "95%" : serviceLevelZ === 2.33 ? "99%" : `${Math.round(serviceLevelZ * 50)}%`)} service level.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
