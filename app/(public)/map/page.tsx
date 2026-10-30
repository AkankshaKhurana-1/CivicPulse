'use client';

import React, { useState } from 'react';
import { CivicMap } from '@/components/map/CivicMap';
import { mockStore } from '@/lib/db/mock-store';
import { Incident } from '@/lib/types';
import { MapPin, Sparkles, ShieldAlert, BarChart3 } from 'lucide-react';

export default function PublicMapPage() {
  const [incidents] = useState<Incident[]>(mockStore.getIncidents());

  // Count active stats
  const totalMapped = incidents.length;
  const criticalCount = incidents.filter(i => i.priority_level === 'CRITICAL').length;
  const resolvedCount = incidents.filter(i => i.status === 'VERIFIED_CLOSED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Public Geospatial Portal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Interactive Civic Issue Map</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live geospatial exploration of reported civic hazards across Chandigarh, Mohali, New Delhi, and Ludhiana.
            Search places, inspect corroborated incidents, and monitor field resolution.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-center min-w-[90px]">
            <span className="block font-bold text-slate-900 text-sm">{totalMapped}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Active</span>
          </div>
          <div className="flex-1 sm:flex-initial bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-center min-w-[90px]">
            <span className="block font-bold text-red-700 text-sm">{criticalCount}</span>
            <span className="text-[10px] text-red-600 uppercase tracking-wider font-semibold">Critical</span>
          </div>
          <div className="flex-1 sm:flex-initial bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-center min-w-[90px]">
            <span className="block font-bold text-emerald-700 text-sm">{resolvedCount}</span>
            <span className="text-[10px] text-emerald-600 uppercase tracking-wider">Closed</span>
          </div>
        </div>
      </div>

      {/* Reusable Master CivicMap */}
      <div className="h-[480px] sm:h-[580px] lg:h-[680px] w-full">
        <CivicMap
          incidents={incidents}
          infrastructureAssets={mockStore.getInfrastructureAssets()}
          showSearch={true}
          showFilters={true}
          showLegend={true}
        />
      </div>
    </div>
  );
}
