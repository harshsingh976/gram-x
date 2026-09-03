/**
 * GRAM-X Location Picker Component
 * Interactive map location selector with browser geolocation, draggable pin, and coordinate capture.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelected: (loc: { lat: number; lng: number; address: string }) => void;
  className?: string;
}

export const LocationPicker = ({
  initialLat = 23.2845,
  initialLng = 77.4521,
  initialAddress = '',
  onLocationSelected,
  className = '',
}: LocationPickerProps) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [address, setAddress] = useState<string>(initialAddress);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    onLocationSelected({ lat, lng, address });
  }, [lat, lng, address]);

  // Request browser geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = Number(position.coords.latitude.toFixed(6));
        const userLng = Number(position.coords.longitude.toFixed(6));
        setLat(userLat);
        setLng(userLng);
        const derivedAddress = `GPS Location (${userLat.toFixed(4)}°N, ${userLng.toFixed(4)}°E), Piparli Area`;
        setAddress(derivedAddress);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. You can manually enter your address or drag the pin.');
        } else {
          setGeoError('Unable to determine GPS coordinates. Defaulting to Gram Panchayat Center.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  return (
    <div className={`space-y-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          Incident Coordinates &amp; Location
        </label>
        <button
          type="button"
          disabled={isLocating}
          onClick={handleUseCurrentLocation}
          className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 bg-sky-950/60 border border-sky-500/30 hover:border-sky-400/50 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
        </button>
      </div>

      {geoError && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2 text-[11px] text-amber-300 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Simulated Interactive Map Pin Viewer */}
      <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900/90 flex items-center justify-center">
        {/* SVG Grid / Terrain Simulation */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
        
        {/* Radar Ring */}
        <div className="absolute w-20 h-20 rounded-full border border-sky-500/30 animate-ping opacity-25" />
        <div className="absolute w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/40" />

        {/* Center Marker Pin */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-rose-500 text-white p-1.5 rounded-full shadow-lg border border-white/50 animate-bounce">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-slate-300 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded-md mt-1 shadow-md">
            {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
          </span>
        </div>

        <div className="absolute bottom-2 left-2 text-[9px] text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
          GRAM-X GIS Grid • WGS84
        </div>
      </div>

      {/* Coordinates readout and manual location edit */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-slate-500">Latitude</label>
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Longitude</label>
          <input
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
