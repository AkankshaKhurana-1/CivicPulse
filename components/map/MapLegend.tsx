'use client';

import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Sparkles, ExternalLink } from 'lucide-react';
import { PRIORITY_COLORS, STATUS_BORDER_COLORS } from './MapConfig';

interface MapLegendProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function MapLegend({ className = '', defaultExpanded = false }: MapLegendProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl text-slate-200 transition-all z-20 ${className}`}
    >
      {/* Header / Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition"
      >
        <div className="flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span>Map Legend & Layers</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800 text-[11px] space-y-3 max-w-[280px]">
          {/* Priority Tiers */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Priority Severity
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-red-500/40 animate-pulse"
                  style={{ backgroundColor: PRIORITY_COLORS.CRITICAL }}
                />
                <span className="text-slate-300">Critical (100)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS.HIGH }} />
                <span className="text-slate-300">High (70+)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS.MEDIUM }} />
                <span className="text-slate-300">Medium (40+)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS.LOW }} />
                <span className="text-slate-300">Low (&lt;40)</span>
              </div>
            </div>
          </div>

          {/* Lifecycle Status Border */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Workflow Status (Pin Border)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400" />
                <span>Submitted</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500" />
                <span>Assigned</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-purple-500" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500" />
                <span>Verified Closed</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Failure DNA */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1.5 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Infrastructure Failure DNA</span>
            </span>
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs">⚡</span>
                <span className="text-rose-400 font-semibold">Chronic Failure Zone</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs">🔄</span>
                <span className="text-amber-300">Recurrent Failure Asset</span>
              </div>
            </div>
          </div>

          {/* Tile Source & Attribution */}
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 leading-tight">
            Map Data ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:underline inline-flex items-center"
            >
              OpenStreetMap contributors <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
