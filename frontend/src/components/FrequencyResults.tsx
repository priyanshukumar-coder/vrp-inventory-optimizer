import { FrequencyInfo } from "../lib/types";

export default function FrequencyResults({ frequencies }: { frequencies: FrequencyInfo[] }) {
  const allDays = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dealer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Days</th>
              {allDays.map(day => (
                <th key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-8">D{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {frequencies.map((freq) => (
              <tr key={freq.dealer_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {freq.dealer_name} (ID: {freq.dealer_id})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Every {freq.frequency_days} day(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {freq.visit_days.join(", ")}
                </td>
                {allDays.map(day => {
                  const isVisited = freq.visit_days.includes(day);
                  return (
                    <td key={day} className="px-2 py-4 whitespace-nowrap text-center">
                      <div className={`w-6 h-6 mx-auto rounded-md ${isVisited ? 'bg-blue-500' : 'bg-gray-100'}`} title={isVisited ? 'Visited' : 'No visit'}></div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
