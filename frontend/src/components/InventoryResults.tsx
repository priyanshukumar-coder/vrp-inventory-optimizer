"use client";

import React, { useState } from "react";
import { InventoryInfo } from "../lib/types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { ShieldCheck, Info, CheckCircle2 } from "lucide-react";

export default function InventoryResults({ inventories }: { inventories: InventoryInfo[] }) {
  const [viewMode, setViewMode] = useState<"summary" | "matrix">("summary");

  const chartData = inventories.map((inv) => ({
    name: `D${inv.dealer_id}`,
    fullName: inv.dealer_name,
    "Safety Stock (SS)": Number(inv.safety_stock.toFixed(1)),
    "Reorder Quantity (d·f)": Number(inv.reorder_quantity.toFixed(1)),
  }));

  const totalHoldingCost = inventories.reduce((sum, inv) => sum + inv.holding_cost, 0);

  return (
    <div className="space-y-8">
      {/* Mathematical Formula Callout */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">
              Safety Stock & Inventory Calculation (Poster Section 5)
            </h4>
            <p className="text-xs text-amber-800 mt-1">
              Safety stock increases with delivery interval <em>f</em>: &nbsp;
              <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-semibold">SS<sub>if</sub> = z · σ<sub>i</sub> · √f</code>
              &nbsp; | &nbsp; Total inventory: &nbsp;
              <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-semibold">I<sub>if</sub> = d<sub>i</sub> · f + SS<sub>if</sub></code>
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white rounded-lg border border-amber-300 p-1 self-end md:self-auto text-xs font-medium">
          <button
            onClick={() => setViewMode("summary")}
            className={`px-3 py-1 rounded-md transition-colors ${
              viewMode === "summary"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-amber-900 hover:bg-amber-50"
            }`}
          >
            Optimal Policy Summary
          </button>
          <button
            onClick={() => setViewMode("matrix")}
            className={`px-3 py-1 rounded-md transition-colors ${
              viewMode === "matrix"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-amber-900 hover:bg-amber-50"
            }`}
          >
            All Frequencies Matrix (f ∈ F)
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[380px] w-full bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-800">
            Optimal Total Inventory Breakdown (Cycle Stock + Safety Stock)
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            Units per dealer
          </span>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} unit=" u" />
            <Tooltip 
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Legend wrapperStyle={{ paddingTop: "12px", fontSize: 12 }} />
            <Bar dataKey="Safety Stock (SS)" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Reorder Quantity (d·f)" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table: View 1: Optimal Policy Summary */}
      {viewMode === "summary" && (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-medium">
              <tr>
                <th className="px-6 py-3 text-left">Dealer</th>
                <th className="px-6 py-3 text-right">Daily Demand (<em>d<sub>i</sub></em>)</th>
                <th className="px-6 py-3 text-right">Safety Stock (<em>SS<sub>if</sub></em>)</th>
                <th className="px-6 py-3 text-right">Cycle Stock (<em>d<sub>i</sub>·f</em>)</th>
                <th className="px-6 py-3 text-right">Total Inventory (<em>I<sub>if</sub></em>)</th>
                <th className="px-6 py-3 text-right">Holding Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {inventories.map((inv) => (
                <tr key={inv.dealer_id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap font-medium text-gray-900">
                    {inv.dealer_name} <span className="text-gray-400 font-normal">#{inv.dealer_id}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-gray-700">{inv.mean_demand.toFixed(1)} u/day</td>
                  <td className="px-6 py-3.5 text-right font-medium text-amber-700">{inv.safety_stock.toFixed(1)} u</td>
                  <td className="px-6 py-3.5 text-right text-blue-700 font-medium">{inv.reorder_quantity.toFixed(1)} u</td>
                  <td className="px-6 py-3.5 text-right font-bold text-gray-900">{inv.total_inventory.toFixed(1)} u</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-emerald-700">
                    ₹{inv.holding_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
              <tr>
                <td colSpan={5} className="px-6 py-4 text-right">Total Holding Cost (∑ h<sub>i</sub> · I<sub>if</sub> · y<sub>if</sub>)</td>
                <td className="px-6 py-4 text-right text-emerald-700 text-sm">
                  ₹{totalHoldingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Table: View 2: All Frequencies Matrix (f ∈ F = {1, 3, 5, 7}) */}
      {viewMode === "matrix" && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center space-x-2">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              Values of <em>I<sub>if</sub></em> and <em>SS<sub>if</sub></em> precalculated for each candidate frequency interval 
              <em>f</em> ∈ &#123;1, 3, 5, 7&#125; days. The frequency selected by the optimization model (<code className="font-semibold text-emerald-800">y<sub>if</sub> = 1</code>) is highlighted.
            </span>
          </div>

          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-medium">
                <tr>
                  <th className="px-4 py-3 text-left">Dealer</th>
                  <th className="px-3 py-3 text-center">Interval (f)</th>
                  <th className="px-4 py-3 text-right">Safety Stock (z·σ·√f)</th>
                  <th className="px-4 py-3 text-right">Cycle Stock (d·f)</th>
                  <th className="px-4 py-3 text-right">Total Inventory (I<sub>if</sub>)</th>
                  <th className="px-4 py-3 text-right">Holding Cost (₹)</th>
                  <th className="px-4 py-3 text-center">Model Decision</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {inventories.map((inv) => (
                  <React.Fragment key={inv.dealer_id}>
                    {inv.frequency_breakdown ? (
                      inv.frequency_breakdown.map((fDetail, fIdx) => (
                        <tr 
                          key={`${inv.dealer_id}-${fDetail.frequency}`}
                          className={`transition-colors ${
                            fDetail.is_selected 
                              ? "bg-emerald-50/70 font-semibold" 
                              : "hover:bg-gray-50/50"
                          } ${fIdx === 0 ? "border-t border-gray-200" : ""}`}
                        >
                          {fIdx === 0 && (
                            <td 
                              rowSpan={inv.frequency_breakdown!.length} 
                              className="px-4 py-3 font-semibold text-gray-900 bg-white border-r border-gray-200 align-top"
                            >
                              {inv.dealer_name}
                              <div className="text-[11px] text-gray-400 font-normal">ID: {inv.dealer_id}</div>
                            </td>
                          )}
                          <td className="px-3 py-2.5 text-center font-mono">
                            Every {fDetail.frequency} {fDetail.frequency === 1 ? "day" : "days"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-amber-700">
                            {fDetail.safety_stock.toFixed(1)} u
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-blue-700">
                            {fDetail.reorder_quantity.toFixed(1)} u
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">
                            {fDetail.total_inventory.toFixed(1)} u
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-emerald-700">
                            ₹{fDetail.holding_cost.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {fDetail.is_selected ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Selected (y<sub>if</sub>=1)
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3">{inv.dealer_name}</td>
                        <td colSpan={6} className="px-4 py-3 text-gray-400">Detailed breakdown loading...</td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
