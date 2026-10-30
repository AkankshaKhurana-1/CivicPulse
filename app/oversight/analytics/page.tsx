'use client';

import React from 'react';
import { mockStore } from '@/lib/db/mock-store';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle2, Clock, MapPin, ShieldCheck } from 'lucide-react';

export default function AnalyticsPage() {
  const incidents = mockStore.getIncidents();
  const workOrders = mockStore.getWorkOrders();

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter(i => i.priority_level === 'CRITICAL').length;
  const verifiedClosedCount = workOrders.filter(w => w.status === 'VERIFIED_CLOSED').length;
  const breachCount = workOrders.filter(w => w.sla_breached).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded">
          Executive Analytics & Governance
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-2">Repeat-Failure Hotspots & Agency SLA Performance</h1>
        <p className="text-xs text-slate-500">Normalized metrics on municipal resolution speed, SLA compliance rates, and recurring failure locations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider block">Active Incidents</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 font-mono">{totalIncidents} Mapped</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider block">Critical Hazards</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600 font-mono">{criticalCount} Active</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider block">Verified Closures</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 font-mono">{verifiedClosedCount} Verified</div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider block">SLA Compliance</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-brand-600 font-mono">94.2%</div>
        </div>
      </div>

      {/* Agency Performance Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900">Municipal Agency SLA & Quality Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Agency Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Active Tasks</th>
                <th className="p-3">Avg Resolution Time</th>
                <th className="p-3">SLA Compliance</th>
                <th className="p-3">Evidence Rejection Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="p-3 font-bold text-slate-900 font-sans">PWD Road Infrastructure</td>
                <td className="p-3 text-slate-600">PWD-DEL</td>
                <td className="p-3">4</td>
                <td className="p-3">18.4 Hours</td>
                <td className="p-3 text-emerald-600 font-bold">96.0%</td>
                <td className="p-3 text-slate-600">4.2%</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900 font-sans">Delhi Jal Board (Drainage Unit)</td>
                <td className="p-3 text-slate-600">DJB-DRAIN</td>
                <td className="p-3">5</td>
                <td className="p-3">14.2 Hours</td>
                <td className="p-3 text-amber-600 font-bold">88.5%</td>
                <td className="p-3 text-slate-600">8.1%</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-900 font-sans">MCD Solid Waste & Environmental</td>
                <td className="p-3 text-slate-600">MCD-WASTE</td>
                <td className="p-3">3</td>
                <td className="p-3">9.8 Hours</td>
                <td className="p-3 text-emerald-600 font-bold">98.2%</td>
                <td className="p-3 text-slate-600">2.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
