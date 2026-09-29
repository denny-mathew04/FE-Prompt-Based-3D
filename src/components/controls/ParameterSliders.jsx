import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Undo2, Check, Layers, ChevronUp, ChevronDown } from 'lucide-react';

export default function ParameterSliders({ 
  parameters = [], 
  onUpdateParameters, 
  isRecompiling,
  infillPercent = 20,
  onInfillChange,
  telemetry,
  onClose
}) {
  const [localValues, setLocalValues] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with incoming parameters
  useEffect(() => {
    const initial = {};
    parameters.forEach(p => {
      initial[p.name] = p.value;
    });
    setLocalValues(initial);
    setHasChanges(false);
  }, [parameters]);

  const handleSliderChange = (name, val) => {
    const updated = { ...localValues, [name]: parseFloat(val) };
    setLocalValues(updated);
    setHasChanges(true);
  };

  const handleApply = () => {
    if (onUpdateParameters) {
      onUpdateParameters(localValues);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    const initial = {};
    parameters.forEach(p => {
      initial[p.name] = p.value;
    });
    setLocalValues(initial);
    setHasChanges(false);
  };

  // Group by category
  const categories = {};
  parameters.forEach(p => {
    const cat = p.category || 'Dimensions';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });

  return (
    <div className="bg-white/95 rounded-2xl p-3.5 border border-gray-200 text-gray-800 shadow-lg flex flex-col gap-3 max-h-[calc(100vh-170px)] overflow-y-auto select-none backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-gray-700">
              Parameters ({parameters.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title="Reset Sliders"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleApply}
            disabled={!hasChanges || isRecompiling}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              hasChanges
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isRecompiling ? 'animate-spin' : ''}`} />
            <span>{isRecompiling ? 'Compiling...' : 'Apply'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title="Collapse"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3D Print Infill Density Control */}
      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-700 text-[11px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            Print Infill Density
          </span>
          <span className="font-mono text-blue-600 font-bold text-xs">{infillPercent}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-400">10%</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={infillPercent}
            onChange={(e) => onInfillChange && onInfillChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <span className="text-[10px] font-mono text-gray-400">100%</span>
        </div>

        {/* Quick pills */}
        <div className="flex items-center gap-1 pt-0.5">
          {[15, 20, 40, 100].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => onInfillChange && onInfillChange(val)}
              className={`flex-1 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                infillPercent === val
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-800'
              }`}
            >
              {val}%
            </button>
          ))}
        </div>

        {telemetry && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-[10px] font-mono text-gray-500">
            <span>Mass: <strong className="text-gray-800">{telemetry.filament_mass_grams}g PLA</strong></span>
            <span>Est: <strong className="text-green-600">${telemetry.estimated_cost_usd}</strong></span>
          </div>
        )}
      </div>

      {/* Model Parametric Sliders */}
      {parameters.length > 0 ? (
        <div className="space-y-3 pt-1">
          {Object.entries(categories).map(([category, params]) => (
            <div key={category} className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue-500 font-semibold px-0.5">
                {category}
              </div>

              {params.map(param => {
                const currentVal = localValues[param.name] ?? param.value;
                return (
                  <div key={param.name} className="bg-gray-50 p-2 rounded-xl border border-gray-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 text-[11px] truncate max-w-[160px]" title={param.description || param.name}>
                        {param.description || param.name.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-blue-600 text-xs font-semibold">
                        {currentVal} {param.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-gray-400">{param.min}</span>
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={currentVal}
                        onChange={(e) => handleSliderChange(param.name, e.target.value)}
                        className="w-full accent-blue-500"
                      />
                      <span className="text-[9px] font-mono text-gray-400">{param.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 text-[11px] py-2 italic">
          No custom dimensions declared in model.
        </div>
      )}
    </div>
  );
}
