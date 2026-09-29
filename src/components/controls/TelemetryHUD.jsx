import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  Clock, 
  DollarSign, 
  Box, 
  Maximize2,
  Cpu,
  Layers
} from 'lucide-react';

export default function TelemetryHUD({ telemetry, infillPercent, onInfillChange }) {
  if (!telemetry) return null;

  const {
    is_watertight = true,
    volume_cm3 = 0,
    surface_area_cm2 = 0,
    bounding_box_mm = [0, 0, 0],
    fits_build_plate = true,
    filament_mass_grams = 0,
    estimated_print_time_mins = 0,
    estimated_cost_usd = 0,
    overhang_face_percentage = 0,
    overhang_detected = false
  } = telemetry;

  const hours = Math.floor(estimated_print_time_mins / 60);
  const mins = estimated_print_time_mins % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    <div className="bg-white/90 rounded-2xl p-4 border border-gray-200 text-gray-800 shadow-lg backdrop-blur-md">
      {/* Header & Overall Status */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold tracking-wider uppercase text-gray-600">
            Pre-Flight Telemetry
          </span>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        {/* Bounding Box */}
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Envelope (X×Y×Z)</span>
          </div>
          <div className="font-mono text-gray-900 font-medium">
            {bounding_box_mm[0]} × {bounding_box_mm[1]} × {bounding_box_mm[2]} <span className="text-[10px] text-gray-400">mm</span>
          </div>
          <div className="text-[10px] text-green-600">
            {fits_build_plate ? "✓ Fits 200×200×200 bed" : "⚠ Exceeds bed limits"}
          </div>
        </div>

        {/* PLA Filament Mass */}
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Filament Mass</span>
          </div>
          <div className="font-mono text-gray-900 font-medium text-sm">
            {filament_mass_grams} <span className="text-xs text-gray-400">g PLA</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            Vol: {volume_cm3} cm³
          </div>
        </div>

        {/* Print Time */}
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Est. Print Time</span>
          </div>
          <div className="font-mono text-gray-900 font-medium text-sm">
            {timeFormatted}
          </div>
          <div className="text-[10px] text-gray-500">
            FDM 0.20mm Standard
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-gray-500">
            <DollarSign className="w-3.5 h-3.5 text-green-500" />
            <span>Production Cost</span>
          </div>
          <div className="font-mono text-gray-900 font-medium text-sm">
            ${estimated_cost_usd.toFixed(2)} <span className="text-[10px] text-gray-400">USD</span>
          </div>
          <div className="text-[10px] text-gray-500">
            Based on $22/kg spool
          </div>
        </div>
      </div>

      {/* Pre-Flight Checklist Footer */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${is_watertight ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-600">2-Manifold Solid</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${overhang_detected ? 'bg-amber-500' : 'bg-green-500'}`} />
          <span className="text-gray-600">
            {overhang_detected ? `Overhang: ${overhang_face_percentage}%` : "No Overhangs"}
          </span>
        </div>

        {/* Infill quick toggle */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Infill:</span>
          <select 
            value={infillPercent}
            onChange={(e) => onInfillChange && onInfillChange(Number(e.target.value))}
            className="bg-white border border-gray-300 rounded px-1 py-0.5 text-blue-600 font-mono text-[11px] outline-none cursor-pointer"
          >
            <option value={15}>15%</option>
            <option value={20}>20%</option>
            <option value={40}>40%</option>
            <option value={100}>100%</option>
          </select>
        </div>
      </div>
    </div>
  );
}
