'use client';

import React from 'react';
import { Plus, Minus, Navigation, Layers, Maximize2, Minimize2, Loader2, RotateCcw } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateMe: () => void;
  isLocating?: boolean;
  onToggleLayer?: () => void;
  currentLayer?: string;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onResetView?: () => void;
  className?: string;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocateMe,
  isLocating = false,
  onToggleLayer,
  currentLayer,
  onToggleFullscreen,
  isFullscreen = false,
  onResetView,
  className = '',
}: MapControlsProps) {
  return (
    <div className={`flex flex-col space-y-1.5 z-20 ${className}`}>
      {/* Zoom In & Out */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
          className="p-2.5 sm:p-2 min-w-[38px] min-h-[38px] text-slate-300 hover:text-white hover:bg-slate-800 transition border-b border-slate-800 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="p-2.5 sm:p-2 min-w-[38px] min-h-[38px] text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Locate Me (GPS) */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          title="Detect My Location"
          aria-label="Detect My Location"
          className={`p-2.5 sm:p-2 min-w-[38px] min-h-[38px] w-full flex items-center justify-center transition ${
            isLocating
              ? 'bg-brand-600/30 text-brand-400 cursor-not-allowed'
              : 'text-brand-400 hover:text-brand-300 hover:bg-slate-800'
          }`}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Layer Toggle (Optional) */}
      {onToggleLayer && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={onToggleLayer}
            title={`Switch Map Layer (Current: ${currentLayer || 'Default'})`}
            aria-label="Switch Map Layer"
            className="p-2.5 sm:p-2 min-w-[38px] min-h-[38px] w-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fullscreen Toggle (Optional) */}
      {onToggleFullscreen && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            aria-label="Toggle Fullscreen"
            className="p-2.5 sm:p-2 min-w-[38px] min-h-[38px] w-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Reset View Button */}
      {onResetView && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={onResetView}
            title="Reset to City Center"
            aria-label="Reset Map View"
            className="p-2.5 sm:p-2 min-w-[38px] min-h-[38px] w-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
