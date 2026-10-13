"use client";

import { OptimizationResult } from "../lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { IndianRupee, Truck, Package, Clock, Zap, CheckCircle } from "lucide-react";

export default function CostSummary({ result }: { result: OptimizationResult }) {
  const pieData = [
    { name: 'Transportation Cost', value: result.transportation_cost },
    { name: 'Inventory Holding Cost', value: result.inventory_cost },
  ];

  const COLORS = ['#3b82f6', '#10b981'];

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <IndianRupee className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">₹{result.total_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Transportation Cost</p>
            <p className="text-2xl font-bold text-gray-900">₹{result.transportation_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Inventory Cost</p>
            <p className="text-2xl font-bold text-gray-900">₹{result.inventory_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[400px]">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Cost Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Solver Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-6">Solver Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center text-gray-600">
                <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                <span>Status</span>
              </div>
              <span className="font-semibold text-gray-900 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {result.solver_stats.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center text-gray-600">
                <Zap className="w-5 h-5 mr-3 text-yellow-500" />
                <span>Solver Used</span>
              </div>
              <span className="font-medium text-gray-900">{result.solver_stats.solver_used}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-3 text-blue-500" />
                <span>Solve Time</span>
              </div>
              <span className="font-medium text-gray-900">{result.solver_stats.solve_time_seconds?.toFixed(2) ?? 'N/A'} seconds</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center text-gray-600">
                <div className="w-5 h-5 mr-3 flex items-center justify-center font-bold text-indigo-500">%</div>
                <span>MIP Gap</span>
              </div>
              <span className="font-medium text-gray-900">
                {result.solver_stats.gap !== null ? `${(result.solver_stats.gap * 100).toFixed(4)}%` : 'N/A'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Variables</p>
                <p className="text-xl font-semibold text-gray-800">{(result.solver_stats.num_variables ?? 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Constraints</p>
                <p className="text-xl font-semibold text-gray-800">{(result.solver_stats.num_constraints ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
