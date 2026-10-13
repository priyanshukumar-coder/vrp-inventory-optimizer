"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RouteInfo, DealerData } from "../lib/types";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const depotIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = icon;

const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#eab308", "#ec4899"];

interface RouteMapProps {
  routes: RouteInfo[];
  dealers: DealerData[];
}

export default function RouteMap({ routes, dealers }: RouteMapProps) {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  
  const days = Array.from(new Set(routes.map(r => r.day))).sort((a, b) => a - b);
  
  const filteredRoutes = selectedDay === 'all' 
    ? routes 
    : routes.filter(r => r.day === selectedDay);

  const centerLat = dealers.reduce((sum, d) => sum + d.latitude, 0) / (dealers.length || 1);
  const centerLng = dealers.reduce((sum, d) => sum + d.longitude, 0) / (dealers.length || 1);

  return (
    <div className="flex flex-col space-y-4 h-[600px]">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Show Routes for Day:</label>
        <select 
          className="border border-gray-300 rounded-md shadow-sm py-1 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-700"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">All Days</option>
          {days.map(d => (
            <option key={d} value={d}>Day {d}</option>
          ))}
        </select>
      </div>
      
      <div className="flex-grow rounded-lg overflow-hidden border border-gray-200 z-0 relative">
        <MapContainer center={[centerLat, centerLng]} zoom={10} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {dealers.map(d => (
            <Marker key={d.dealer_id} position={[d.latitude, d.longitude]} icon={d.dealer_id === 0 ? depotIcon : icon}>
              <Popup>
                <div className="text-sm">
                  <strong>{d.dealer_id === 0 ? "Depot" : d.name}</strong>
                  <br />ID: {d.dealer_id}
                </div>
              </Popup>
            </Marker>
          ))}

          {filteredRoutes.map((route, i) => {
            const positions = route.dealer_sequence.map(id => {
              const d = dealers.find(x => x.dealer_id === id);
              return [d!.latitude, d!.longitude] as [number, number];
            });
            
            return (
              <Polyline 
                key={i} 
                positions={positions} 
                pathOptions={{ 
                  color: COLORS[route.vehicle_id % COLORS.length], 
                  weight: 3, 
                  opacity: 0.7 
                }} 
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
