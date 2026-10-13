"use client";

import React from "react";
import { 
  BookOpen, 
  Layers, 
  Settings2, 
  Binary, 
  ShieldCheck, 
  Calculator, 
  Network, 
  Cpu, 
  CheckCircle2 
} from "lucide-react";

export default function ModelFormulation() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-2xl shadow-md border border-blue-800">
        <div className="flex items-center space-x-3 mb-2 text-blue-300">
          <BookOpen className="w-6 h-6" />
          <span className="text-xs uppercase tracking-widest font-semibold">Automotive OEM Decision-Support</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Integrated Vehicle Routing and Inventory Optimization for Automotive Spare-Parts Distribution
        </h2>
        <p className="text-blue-200 mt-2 text-sm md:text-base">
          Mathematical Model & Exact Formulation Reference
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-blue-800/80">
          <p className="text-xs text-blue-200">
            📄 An exhaustive 20-page engineering technical report detailing all assumptions, algorithms, parameter matrices, equations, and proofs is available.
          </p>
          <a
            href="/VRP_Inventory_Optimization_Comprehensive_Technical_Report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg shadow transition-colors shrink-0"
          >
            Download Full PDF Report (20 Pages) &rarr;
          </a>
        </div>
      </div>

      {/* Grid: Overview & Sets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Problem Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3 text-blue-600">
            <Layers className="w-5 h-5" />
            <h3 className="font-semibold text-gray-900">1. Problem Overview</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            The goal is to jointly optimize <strong>delivery routes</strong>, <strong>delivery frequency</strong>, and 
            <strong>dealer inventory levels</strong> for an automotive spare-parts distribution network. An exact Mixed-Integer 
            Linear Programming (MILP) model is formulated and solved using Gurobi (with heuristic fallback) to minimize the 
            total distribution cost, which includes both transportation and inventory holding costs.
          </p>
        </div>

        {/* 2. Sets and Indices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3 text-indigo-600">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-semibold text-gray-900">2. Sets and Indices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-medium">
                  <th className="py-2 pr-3">Symbol</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr><td className="py-1.5 font-mono font-bold text-blue-600">N</td><td>Set of all locations (0 = depot, 1..N = dealers)</td></tr>
                <tr><td className="py-1.5 font-mono font-bold text-blue-600">D</td><td>Set of dealers (subset of N, excluding depot)</td></tr>
                <tr><td className="py-1.5 font-mono font-bold text-blue-600">V</td><td>Set of vehicles</td></tr>
                <tr><td className="py-1.5 font-mono font-bold text-blue-600">T</td><td>Set of planning days (e.g., 1, ..., 7)</td></tr>
                <tr><td className="py-1.5 font-mono font-bold text-blue-600">F</td><td>Set of possible delivery intervals (1, 3, 5, 7 days)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Parameters & Decision Variables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3 text-emerald-600">
            <Calculator className="w-5 h-5" />
            <h3 className="font-semibold text-gray-900">3. Parameters (Input Data)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-medium">
                  <th className="py-2 pr-2">Symbol</th>
                  <th className="py-2">Description & Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr><td className="py-1.5 font-mono font-semibold text-emerald-700">d_i</td><td>Average daily demand at dealer i (units/day from XGBoost)</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-emerald-700">σ_i</td><td>Standard deviation of demand at dealer i (uncertainty)</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-emerald-700">z</td><td>Service level factor (1.65 for 95% service level)</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-emerald-700">c_ij</td><td>Transportation cost from i to j (₹/km)</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-emerald-700">h_i</td><td>Inventory holding cost at dealer i (₹/unit/day)</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-emerald-700">Q_v</td><td>Capacity of vehicle v (units)</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-emerald-700">S_i</td><td>Storage capacity at dealer i (units)</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-emerald-700">L_i</td><td>Lead time from depot to dealer i (days)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Decision Variables */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-3 text-purple-600">
            <Binary className="w-5 h-5" />
            <h3 className="font-semibold text-gray-900">4. Decision Variables</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-medium">
                  <th className="py-2 pr-2">Symbol</th>
                  <th className="py-2">Definition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr><td className="py-1.5 font-mono font-semibold text-purple-700">x_ijvt</td><td>Binary: 1 if vehicle v travels i → j on day t</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-purple-700">y_if</td><td>Binary: 1 if dealer i is served every f days</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-purple-700">z_it</td><td>Binary: 1 if dealer i is visited (delivered) on day t</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-purple-700">I_if</td><td>Continuous: Total inventory level required at dealer i for frequency f</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-purple-700">q_ivt</td><td>Continuous: Quantity delivered to dealer i by vehicle v on day t</td></tr>
                <tr><td className="py-1.5 font-mono font-semibold text-purple-700">u_it</td><td>Continuous: Auxiliary MTZ subtour elimination variable</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Safety Stock and Inventory Calculation */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
        <div className="flex items-center space-x-2 mb-3 text-amber-800">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-semibold text-base">5. Safety Stock and Inventory Calculation (Section 5)</h3>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Safety stock depends on the delivery interval (<em>f</em>) because a longer interval increases the risk of demand uncertainty:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Safety Stock Formula</p>
            <div className="text-lg font-mono font-bold text-amber-900 bg-amber-50 py-2 px-3 rounded inline-block">
              SS<sub>if</sub> = z · σ<sub>i</sub> · √f
            </div>
            <p className="text-xs text-gray-500 mt-2">Where z = 1.65 (95% service level) and σ<sub>i</sub> is forecast uncertainty</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Required Dealer Inventory</p>
            <div className="text-lg font-mono font-bold text-amber-900 bg-amber-50 py-2 px-3 rounded inline-block">
              I<sub>if</sub> = d<sub>i</sub> · f + SS<sub>if</sub> = d<sub>i</sub> · f + z · σ<sub>i</sub> · √f
            </div>
            <p className="text-xs text-gray-500 mt-2">Sum of cycle stock (d<sub>i</sub> · f) and safety stock buffer</p>
          </div>
        </div>
        <p className="text-xs text-amber-800 mt-4 italic">
          ★ For a linear MILP model, the values of I<sub>if</sub> and SS<sub>if</sub> are pre-calculated for each f ∈ &#123;1, 3, 5, 7&#125; and treated as parameters.
        </p>
      </div>

      {/* 6. Objective Function */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-3 text-blue-700">
          <Calculator className="w-5 h-5" />
          <h3 className="font-semibold text-gray-900">6. Objective Function (Section 6)</h3>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-xl text-center font-mono my-2 overflow-x-auto text-sm md:text-base">
          min Z = ∑<sub>t∈T</sub> ∑<sub>v∈V</sub> ∑<sub>i∈N</sub> ∑<sub>j∈N</sub> c<sub>ij</sub> · x<sub>ijvt</sub> + ∑<sub>i∈D</sub> ∑<sub>f∈F</sub> h<sub>i</sub> · I<sub>if</sub> · y<sub>if</sub>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs text-gray-600">
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <strong className="text-blue-700">Transportation Cost:</strong> Sum of distance traveled by all vehicles v on day t multiplied by unit road cost c<sub>ij</sub> (₹/km).
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-100">
            <strong className="text-green-700">Inventory Holding Cost:</strong> Holding cost h<sub>i</sub> (₹/unit/day) multiplied by required inventory level I<sub>if</sub> for selected delivery frequency y<sub>if</sub>.
          </div>
        </div>
      </div>

      {/* 7. Constraints Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4 text-indigo-700">
          <Network className="w-5 h-5" />
          <h3 className="font-semibold text-gray-900">7. Constraints (Section 7)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-semibold text-gray-800 mb-1">1. Frequency Assignment</div>
            <div className="font-mono bg-white p-2 rounded border border-gray-200 text-indigo-900">∑<sub>f∈F</sub> y<sub>if</sub> = 1, ∀i ∈ D</div>
            <p className="text-gray-500 mt-1">Each dealer is assigned exactly one delivery frequency.</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-semibold text-gray-800 mb-1">2. Inventory-Frequency Relationship</div>
            <div className="font-mono bg-white p-2 rounded border border-gray-200 text-indigo-900">I<sub>i</sub> = ∑<sub>f∈F</sub> I<sub>if</sub> · y<sub>if</sub>, ∀i ∈ D</div>
            <p className="text-gray-500 mt-1">Inventory level is determined by the selected frequency.</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-semibold text-gray-800 mb-1">3. Vehicle Capacity Constraint</div>
            <div className="font-mono bg-white p-2 rounded border border-gray-200 text-indigo-900">∑<sub>i∈D</sub> q<sub>ivt</sub> ≤ Q<sub>v</sub>, ∀v ∈ V, t ∈ T</div>
            <p className="text-gray-500 mt-1">Total quantity delivered on vehicle v on day t cannot exceed capacity Q<sub>v</sub>.</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-semibold text-gray-800 mb-1">4. Dealer Visit Routing Link</div>
            <div className="font-mono bg-white p-2 rounded border border-gray-200 text-indigo-900">z<sub>it</sub> ≤ ∑<sub>v∈V</sub> ∑<sub>j∈N</sub> x<sub>ijvt</sub>, ∀i ∈ D, t ∈ T</div>
            <p className="text-gray-500 mt-1">Dealer receives delivery on day t only if a vehicle route visits that dealer.</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-semibold text-gray-800 mb-1">5. Route Flow Conservation</div>
            <div className="font-mono bg-white p-2 rounded border border-gray-200 text-indigo-900">∑<sub>j∈N</sub> x<sub>ijvt</sub> = ∑<sub>j∈N</sub> x<sub>jivt</sub>, ∀i ∈ N, v ∈ V, t ∈ T</div>
            <p className="text-gray-500 mt-1">Every vehicle that arrives at a dealer must also depart from it.</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-semibold text-gray-800 mb-1">6. Depot Departure and Return</div>
            <div className="font-mono bg-white p-2 rounded border border-gray-200 text-indigo-900">∑<sub>j∈D</sub> x<sub>0jvt</sub> ≤ 1, ∑<sub>i∈D</sub> x<sub>i0vt</sub> ≤ 1</div>
            <p className="text-gray-500 mt-1">Each vehicle departs depot at most once and returns to depot at end of day.</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 col-span-1 md:col-span-2">
            <div className="font-semibold text-gray-800 mb-1">7. MTZ Subtour Elimination & Integrality</div>
            <div className="font-mono bg-white p-2 rounded border border-gray-200 text-indigo-900">
              u<sub>it</sub> - u<sub>jt</sub> + |D| · x<sub>ijvt</sub> ≤ |D| - 1, ∀i ≠ j, v ∈ V, t ∈ T &nbsp;|&nbsp; x<sub>ijvt</sub>, y<sub>if</sub>, z<sub>it</sub> ∈ &#123;0, 1&#125;
            </div>
            <p className="text-gray-500 mt-1">Miller-Tucker-Zemlin constraints prevent detached loops; binary restrictions guarantee integer routing choices.</p>
          </div>
        </div>
      </div>

      {/* 9 & 10. Key Takeaways */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-3 text-slate-800">
          <Cpu className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Key Takeaways (Section 10)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>Integrates routing and inventory decisions into a single global objective function.</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>Delivery frequency directly affects inventory requirements through safety stock (SS<sub>if</sub> = z·σ·√f).</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>Powered by XGBoost machine learning to predict demand d<sub>i</sub> and uncertainty σ<sub>i</sub> from historical sales.</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <span>Provides an interactive decision-support tool for automotive OEMs with road distances and capacity limits.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
