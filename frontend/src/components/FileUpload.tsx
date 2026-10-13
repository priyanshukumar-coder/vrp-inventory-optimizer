"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, CheckCircle2, Play, Database, TrendingUp } from "lucide-react";
import { UploadedData } from "../lib/types";

interface FileUploadProps {
  onUpload: (dealer: File, demand: File, vehicle: File) => void;
  onLoadSample: () => void;
  onOptimize: () => void;
  onOptimizeWithForecast: () => void;
  uploadedData: UploadedData | null;
  isLoading: boolean;
}

const DropZoneArea = ({ 
  title, 
  file, 
  setFile 
}: { 
  title: string, 
  file: File | null, 
  setFile: (file: File) => void 
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-40
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
        ${file ? 'border-green-500 bg-green-50' : ''}
      `}
    >
      <input {...getInputProps()} />
      {file ? (
        <>
          <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
          <p className="text-sm font-medium text-green-700 truncate w-full px-2">{file.name}</p>
        </>
      ) : (
        <>
          <FileUp className={`w-8 h-8 mb-2 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-xs text-gray-400 mt-1">Drag & drop or click</p>
        </>
      )}
    </div>
  );
};

export default function FileUpload({ 
  onUpload, 
  onLoadSample, 
  onOptimize, 
  onOptimizeWithForecast,
  uploadedData, 
  isLoading 
}: FileUploadProps) {
  const [dealerFile, setDealerFile] = useState<File | null>(null);
  const [demandFile, setDemandFile] = useState<File | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);

  const canUpload = dealerFile && demandFile && vehicleFile;

  // Auto-process files when all 3 are provided
  React.useEffect(() => {
    if (dealerFile && demandFile && vehicleFile && !uploadedData) {
      onUpload(dealerFile, demandFile, vehicleFile);
    }
  }, [dealerFile, demandFile, vehicleFile, uploadedData, onUpload]);

  const handleForecastClick = async () => {
    if (canUpload && !uploadedData) {
      await onUpload(dealerFile!, demandFile!, vehicleFile!);
    }
    onOptimizeWithForecast();
  };

  const handleStandardOptimizeClick = async () => {
    if (canUpload && !uploadedData) {
      await onUpload(dealerFile!, demandFile!, vehicleFile!);
    }
    onOptimize();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Upload Data Files</h2>
        <button
          onClick={onLoadSample}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <Database className="w-4 h-4 mr-2" />
          Load Sample Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DropZoneArea title="Dealers CSV" file={dealerFile} setFile={setDealerFile} />
        <DropZoneArea title="Demand CSV" file={demandFile} setFile={setDemandFile} />
        <DropZoneArea title="Vehicles CSV" file={vehicleFile} setFile={setVehicleFile} />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          {uploadedData ? (
            <span className="flex items-center text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {uploadedData.dealers.length} dealers, {uploadedData.demands.length} demand records, {uploadedData.vehicles.length} vehicles loaded.
            </span>
          ) : (
            <span>Please upload all 3 CSV files or load sample data.</span>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onUpload(dealerFile!, demandFile!, vehicleFile!)}
            disabled={!canUpload || isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Process Files
          </button>
          <button
            onClick={handleStandardOptimizeClick}
            disabled={(!uploadedData && !canUpload) || isLoading}
            className="flex items-center px-5 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
          >
            <Play className="w-4 h-4 mr-1.5" />
            Standard Optimize
          </button>
          <button
            onClick={handleForecastClick}
            disabled={isLoading}
            className="flex items-center px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 text-sm shadow-md"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            ⚡ Optimize with XGBoost Demand Forecast
          </button>
        </div>
      </div>
    </div>
  );
}
