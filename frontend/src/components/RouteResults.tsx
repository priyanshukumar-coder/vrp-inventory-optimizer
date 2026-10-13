import { RouteInfo } from "../lib/types";

const VEHICLE_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-pink-100 text-pink-800",
];

export default function RouteResults({ routes }: { routes: RouteInfo[] }) {
  const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route Sequence</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">Day {route.day}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${VEHICLE_COLORS[route.vehicle_id % VEHICLE_COLORS.length]}`}>
                    Vehicle {route.vehicle_id}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {route.dealer_sequence.join(" → ")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                  {route.distance.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold text-gray-900">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right">Total Distance</td>
              <td className="px-6 py-4 text-right">{totalDistance.toFixed(2)} km</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
