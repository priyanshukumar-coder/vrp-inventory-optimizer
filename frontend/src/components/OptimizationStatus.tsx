import { Loader2, AlertCircle } from "lucide-react";

export default function OptimizationStatus({ 
  status, 
  error 
}: { 
  status: 'loading' | 'error', 
  error?: string 
}) {
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Running Optimization</h3>
        <p className="text-gray-500 text-center max-w-md">
          Solving... This may take a few minutes for large instances. Please do not close the browser.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    const isFetchError = error?.toLowerCase().includes("failed to fetch");
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-2xl shadow-sm border border-red-200">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-xl font-bold text-red-800 mb-1">Optimization Failed</h3>
        <p className="text-red-700 font-medium text-center">{error || 'An unknown error occurred'}</p>
        {isFetchError && (
          <div className="mt-3 p-3 bg-white/80 rounded-lg border border-red-200 text-xs text-red-800 text-center max-w-md">
            The browser could not reach the backend API server. Make sure the FastAPI service is running on <strong>http://localhost:8001</strong>.
          </div>
        )}
      </div>
    );
  }

  return null;
}
